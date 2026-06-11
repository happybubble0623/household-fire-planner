import { describe, expect, it } from "vitest";
import {
  applyFetchedPricesToPhase1Portfolio,
  calculatePortfolioItemBalance,
  deletePhase1PortfolioItem,
  getDefaultIncludedInFire,
  isSuccessfulFetchedMarketPrice,
  isMarketPricedType,
  normalizePortfolioItemBalance,
  summarizePhase1Portfolio,
  upsertPhase1PortfolioItem
} from "@/lib/phase1/portfolio";
import type { FetchedMarketPrice } from "@/types/market-data";
import type { Phase1PortfolioItem } from "@/types/phase1";

describe("Phase 1 portfolio helpers", () => {
  it("calculates market balance from unit price and units", () => {
    expect(
      calculatePortfolioItemBalance({
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 300,
        units: 10,
        balance: 0
      })
    ).toBe(3000);
  });

  it("keeps direct balance assets simple and liabilities negative", () => {
    const home: Phase1PortfolioItem = {
      id: "home",
      type: "home",
      name: "Home",
      taxBucket: "Real Estate",
      includedInFire: false,
      balance: 600_000
    };
    const mortgage: Phase1PortfolioItem = {
      id: "mortgage",
      type: "liability",
      name: "Mortgage",
      taxBucket: "Other",
      includedInFire: false,
      balance: 300_000
    };

    expect(calculatePortfolioItemBalance(home)).toBe(600_000);
    expect(calculatePortfolioItemBalance(mortgage)).toBe(-300_000);
  });

  it("summarizes assets, liabilities, net balance, and FIRE included balance", () => {
    const summary = summarizePhase1Portfolio([
      {
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 300,
        units: 10,
        balance: 0
      },
      {
        id: "cash",
        type: "cash",
        name: "Emergency Fund",
        taxBucket: "Cash",
        includedInFire: true,
        balance: 20_000
      },
      {
        id: "mortgage",
        type: "liability",
        name: "Mortgage",
        taxBucket: "Other",
        includedInFire: false,
        balance: -100_000
      }
    ]);

    expect(summary.totalAssets).toBe(23_000);
    expect(summary.totalLiabilities).toBe(-100_000);
    expect(summary.totalNetBalance).toBe(-77_000);
    expect(summary.includedInFire).toBe(23_000);
  });

  it("defaults Include in FIRE to yes for liquid asset types but excludes the primary home", () => {
    expect(getDefaultIncludedInFire("stock")).toBe(true);
    expect(getDefaultIncludedInFire("etf")).toBe(true);
    expect(getDefaultIncludedInFire("mutual_fund")).toBe(true);
    expect(getDefaultIncludedInFire("crypto")).toBe(true);
    expect(getDefaultIncludedInFire("cash")).toBe(true);
    expect(getDefaultIncludedInFire("liability")).toBe(true);
    expect(getDefaultIncludedInFire("other_asset")).toBe(true);
    // The FIRE pool is liquid investments only, so the primary home is not
    // counted by default (real estate enters only via a planned home sale).
    expect(getDefaultIncludedInFire("home")).toBe(false);
  });

  it("does not treat options as Phase 1 market-priced assets", () => {
    expect(isMarketPricedType("stock")).toBe(true);
    expect(isMarketPricedType("crypto")).toBe(true);
    expect(isMarketPricedType("option")).toBe(false);
  });

  it("normalizes market balances and liability balances", () => {
    expect(
      normalizePortfolioItemBalance({
        id: "qqq",
        type: "etf",
        name: "QQQ",
        symbol: "QQQ",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 400,
        units: 2,
        balance: 10
      }).balance
    ).toBe(800);

    expect(
      normalizePortfolioItemBalance({
        id: "loan",
        type: "liability",
        name: "Loan",
        taxBucket: "Other",
        includedInFire: false,
        balance: 12_000
      }).balance
    ).toBe(-12_000);
  });

  it("preserves imported market direct balances until price and units are both available", () => {
    expect(
      normalizePortfolioItemBalance({
        id: "vfiax",
        type: "mutual_fund",
        name: "Vanguard 500 Index Fund",
        symbol: "VFIAX.US",
        taxBucket: "Taxable",
        includedInFire: true,
        balance: 10_000
      }).balance
    ).toBe(10_000);
  });

  it("applies a matching positive fetched price and recalculates balance", () => {
    const [updated] = applyFetchedPricesToPhase1Portfolio(
      [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "vti",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 300,
          units: 3,
          balance: 900,
          priceStatus: "manual",
          priceDate: "2026-01-01",
          priceWarning: "stale"
        }
      ],
      [
        {
          symbol: "VTI",
          priceDate: "2026-06-05",
          closePrice: 325,
          source: "alpha_vantage_eod"
        }
      ]
    );

    expect(updated.unitPrice).toBe(325);
    expect(updated.balance).toBe(975);
    expect(updated.priceStatus).toBe("refreshed");
    expect(updated.priceDate).toBe("2026-06-05");
    expect(updated.priceWarning).toBeUndefined();
  });

  it("does not zero balance-only market imports when a refreshed price exists without units", () => {
    const [updated] = applyFetchedPricesToPhase1Portfolio(
      [
        {
          id: "vfiax",
          type: "mutual_fund",
          name: "Vanguard 500 Index Fund",
          symbol: "VFIAX.US",
          taxBucket: "Taxable",
          includedInFire: true,
          balance: 10_000
        }
      ],
      [
        {
          symbol: "VFIAX.US",
          priceDate: "2026-06-05",
          closePrice: 500,
          source: "eodhd_eod"
        }
      ]
    );

    expect(updated.balance).toBe(10_000);
    expect(updated.unitPrice).toBeUndefined();
    expect(updated.priceStatus).toBe("failed");
    expect(updated.priceWarning).toBe("Units are required before refreshed prices can update this holding.");
  });

  it("marks missing fetched symbols as failed without stale price metadata", () => {
    const [updated] = applyFetchedPricesToPhase1Portfolio(
      [
        {
          id: "qqq",
          type: "etf",
          name: "QQQ",
          symbol: "QQQ",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 400,
          units: 2,
          balance: 800,
          priceStatus: "refreshed",
          priceDate: "2026-06-01",
          priceWarning: "old warning"
        }
      ],
      [
        {
          symbol: "VTI",
          priceDate: "2026-06-05",
          closePrice: 325,
          source: "alpha_vantage_eod"
        }
      ]
    );

    expect(updated.unitPrice).toBe(400);
    expect(updated.balance).toBe(800);
    expect(updated.priceStatus).toBe("failed");
    expect(updated.priceDate).toBeUndefined();
    expect(updated.priceWarning).toBe("Price was not returned for this symbol.");
  });

  it("marks unsupported and null fetched prices without changing balance", () => {
    const unsupportedPrice = {
      symbol: "BTC",
      priceDate: "2026-06-05",
      closePrice: null,
      source: "unsupported",
      warning: "Crypto prices are not supported."
    } as unknown as FetchedMarketPrice;

    const [unsupported, failed] = applyFetchedPricesToPhase1Portfolio(
      [
        {
          id: "btc",
          type: "crypto",
          name: "Bitcoin",
          symbol: "BTC",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 100_000,
          units: 0.1,
          balance: 10_000,
          priceStatus: "refreshed",
          priceDate: "2026-06-01"
        },
        {
          id: "spy",
          type: "etf",
          name: "SPY",
          symbol: "SPY",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 500,
          units: 4,
          balance: 2_000,
          priceStatus: "refreshed",
          priceDate: "2026-06-01"
        }
      ],
      [
        unsupportedPrice,
        {
          symbol: "SPY",
          priceDate: "2026-06-05",
          closePrice: null,
          source: "manual_required",
          warning: "Manual price required."
        }
      ]
    );

    expect(unsupported.priceStatus).toBe("unsupported");
    expect(unsupported.unitPrice).toBe(100_000);
    expect(unsupported.balance).toBe(10_000);
    expect(unsupported.priceDate).toBeUndefined();
    expect(unsupported.priceWarning).toBe("Crypto prices are not supported.");

    expect(failed.priceStatus).toBe("failed");
    expect(failed.unitPrice).toBe(500);
    expect(failed.balance).toBe(2_000);
    expect(failed.priceDate).toBeUndefined();
    expect(failed.priceWarning).toBe("Manual price required.");
  });

  it("rejects zero and negative fetched prices as failed", () => {
    const [zero, negative] = applyFetchedPricesToPhase1Portfolio(
      [
        {
          id: "zero",
          type: "stock",
          name: "Zero",
          symbol: "ZERO",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 10,
          units: 10,
          balance: 100,
          priceStatus: "refreshed",
          priceDate: "2026-06-01"
        },
        {
          id: "negative",
          type: "stock",
          name: "Negative",
          symbol: "NEG",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 20,
          units: 10,
          balance: 200,
          priceStatus: "refreshed",
          priceDate: "2026-06-01"
        }
      ],
      [
        {
          symbol: "ZERO",
          priceDate: "2026-06-05",
          closePrice: 0,
          source: "alpha_vantage_eod"
        },
        {
          symbol: "NEG",
          priceDate: "2026-06-05",
          closePrice: -1,
          source: "alpha_vantage_eod"
        }
      ]
    );

    expect(zero.priceStatus).toBe("failed");
    expect(zero.unitPrice).toBe(10);
    expect(zero.balance).toBe(100);
    expect(zero.priceDate).toBeUndefined();

    expect(negative.priceStatus).toBe("failed");
    expect(negative.unitPrice).toBe(20);
    expect(negative.balance).toBe(200);
    expect(negative.priceDate).toBeUndefined();
  });

  it("recognizes only positive provider prices as successful refreshes", () => {
    expect(
      isSuccessfulFetchedMarketPrice({
        symbol: "VTI",
        priceDate: "2026-06-05",
        closePrice: 325,
        source: "eodhd_eod"
      })
    ).toBe(true);

    expect(
      isSuccessfulFetchedMarketPrice({
        symbol: "VTI",
        priceDate: "2026-06-05",
        closePrice: 325,
        source: "manual_required"
      })
    ).toBe(false);

    expect(
      isSuccessfulFetchedMarketPrice({
        symbol: "VTI",
        priceDate: "2026-06-05",
        closePrice: null,
        source: "eodhd_eod"
      })
    ).toBe(false);
  });

  it("upserts and deletes portfolio rows by id", () => {
    const existing: Phase1PortfolioItem[] = [
      {
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 300,
        units: 1,
        balance: 300
      },
      {
        id: "cash",
        type: "cash",
        name: "Emergency Fund",
        taxBucket: "Cash",
        includedInFire: true,
        balance: 10000
      }
    ];

    const updated = upsertPhase1PortfolioItem(existing, {
      ...existing[0],
      unitPrice: 325,
      units: 2,
      balance: 0
    });

    expect(updated).toHaveLength(2);
    expect(updated[0].balance).toBe(650);
    expect(updated[1].id).toBe("cash");
    expect(deletePhase1PortfolioItem(updated, "vti")).toEqual([existing[1]]);
  });
});
