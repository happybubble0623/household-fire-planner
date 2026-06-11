import { describe, expect, it } from "vitest";
import {
  addCashSnapshotToPlan,
  addMarketSnapshotToPlan,
  summarizePortfolioLab
} from "@/lib/planning/portfolio-lab-actions";
import { samplePlan } from "@/lib/data/sample-plan";

const fixedNow = "2026-06-07T03:40:00.000Z";

describe("Portfolio Lab plan actions", () => {
  it("adds a stock snapshot and manual price to an existing holding", () => {
    const updated = addMarketSnapshotToPlan(samplePlan, {
      symbol: "AAPL",
      quantity: 75,
      effectiveDate: "2026-01-15",
      manualPrice: 225,
      priceDate: "2026-01-15",
      now: fixedNow
    });

    const position = updated.marketPositions.find((item) => item.symbol === "AAPL");

    expect(position?.quantitySnapshots.at(-1)).toMatchObject({
      effectiveDate: "2026-01-15",
      quantity: 75,
      source: "manual"
    });
    expect(position?.manualPriceOverrides?.at(-1)).toMatchObject({
      priceDate: "2026-01-15",
      price: 225
    });
  });

  it("creates a new stock holding when the ticker is not already present", () => {
    const updated = addMarketSnapshotToPlan(samplePlan, {
      symbol: "MSFT",
      quantity: 12,
      effectiveDate: "2026-02-01",
      manualPrice: 430,
      priceDate: "2026-02-01",
      portfolioGroupId: "group-brokerage",
      taxBucket: "tax_deferred",
      includedInFire: false,
      now: fixedNow
    });

    const position = updated.marketPositions.find((item) => item.symbol === "MSFT");

    expect(position).toMatchObject({
      symbol: "MSFT",
      portfolioGroupId: "group-brokerage",
      taxBucket: "tax_deferred",
      includedInFire: false
    });
    expect(position?.quantitySnapshots[0]?.quantity).toBe(12);
  });

  it("summarizes visible holdings, group totals, investable assets, allocation, and price timestamp", () => {
    const updated = addCashSnapshotToPlan(samplePlan, {
      accountName: "Emergency Cash",
      balance: 50000,
      effectiveDate: "2026-01-01",
      now: fixedNow
    });
    const summary = summarizePortfolioLab(updated);

    expect(summary.holdings[0]).toMatchObject({
      symbol: "AAPL",
      latestQuantity: 50,
      latestPrice: 210,
      currentValue: 10500
    });
    expect(summary.combinedInvestableAssets).toBe(60500);
    expect(summary.groupTotals.find((group) => group.groupName === "Brokerage")?.value).toBe(10500);
    expect(summary.groupTotals.find((group) => group.groupName === "Cash")?.value).toBe(50000);
    expect(summary.allocationByGroup.find((group) => group.groupName === "Cash")?.percent).toBeCloseTo(82.64, 2);
    expect(summary.lastPriceUpdate).toBe("2026-06-06T22:00:00.000Z");
  });
});
