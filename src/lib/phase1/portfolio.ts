import type { FetchedMarketPrice } from "@/types/market-data";
import type { Phase1AssetType, Phase1PortfolioItem } from "@/types/phase1";

export const marketPricedTypes = new Set<Phase1AssetType>([
  "stock",
  "etf",
  "mutual_fund",
  "crypto",
  "bond"
]);

export type Phase1PortfolioSummary = {
  totalAssets: number;
  totalLiabilities: number;
  totalNetBalance: number;
  includedInFire: number;
  itemCount: number;
};

export function isMarketPricedType(type: Phase1AssetType) {
  return marketPricedTypes.has(type);
}

// Primary homes / real estate are not liquid, drawable FIRE assets, so they
// default to excluded and are never counted in the FIRE-asset total (a planned
// home sale is modeled separately as a one-time inflow in the FIRE inputs).
export function getDefaultIncludedInFire(type: Phase1AssetType) {
  return type !== "home";
}

// Single source of truth for whether an item's balance counts toward the
// FIRE-asset total: it must be flagged Include-in-FIRE AND not be real estate.
export function countsTowardFireAssets(item: Phase1PortfolioItem) {
  return item.includedInFire && item.type !== "home";
}

export function calculatePortfolioItemBalance(item: Phase1PortfolioItem) {
  if (item.type === "liability") {
    return -Math.abs(item.balance);
  }

  if (isMarketPricedType(item.type)) {
    return item.unitPrice !== undefined && item.units !== undefined
      ? item.unitPrice * item.units
      : item.balance;
  }

  return item.balance;
}

export function normalizePortfolioItemBalance(item: Phase1PortfolioItem): Phase1PortfolioItem {
  return {
    ...item,
    balance: calculatePortfolioItemBalance(item)
  };
}

export function summarizePhase1Portfolio(
  items: Phase1PortfolioItem[]
): Phase1PortfolioSummary {
  return items.reduce<Phase1PortfolioSummary>(
    (summary, item) => {
      const balance = calculatePortfolioItemBalance(item);

      if (balance >= 0) {
        summary.totalAssets += balance;
      } else {
        summary.totalLiabilities += balance;
      }

      summary.totalNetBalance += balance;

      if (countsTowardFireAssets(item)) {
        summary.includedInFire += balance;
      }

      summary.itemCount += 1;
      return summary;
    },
    {
      totalAssets: 0,
      totalLiabilities: 0,
      totalNetBalance: 0,
      includedInFire: 0,
      itemCount: 0
    }
  );
}

export function applyFetchedPricesToPhase1Portfolio(
  items: Phase1PortfolioItem[],
  prices: FetchedMarketPrice[]
) {
  const pricesBySymbol = new Map(prices.map((price) => [price.symbol.toUpperCase(), price]));

  return items.map((item) => {
    if (!item.symbol || !isMarketPricedType(item.type)) {
      return item;
    }

    const price = pricesBySymbol.get(item.symbol.toUpperCase());
    if (!price) {
      return markPriceRefreshFailed(item, "Price was not returned for this symbol.");
    }

    if ((price.source as string) === "unsupported") {
      return markPriceRefreshFailed(item, price.warning, "unsupported");
    }

    if (
      !isSuccessfulFetchedMarketPrice(price)
    ) {
      return markPriceRefreshFailed(item, price.warning);
    }

    if (item.units === undefined) {
      return markPriceRefreshFailed(
        item,
        "Units are required before refreshed prices can update this holding."
      );
    }

    return {
      ...item,
      unitPrice: price.closePrice,
      balance: price.closePrice * item.units,
      priceStatus: "refreshed" as const,
      priceDate: price.priceDate,
      priceWarning: price.warning
    };
  });
}

export function upsertPhase1PortfolioItem(
  items: Phase1PortfolioItem[],
  item: Phase1PortfolioItem
) {
  const normalizedItem = normalizePortfolioItemBalance(item);
  const itemExists = items.some((currentItem) => currentItem.id === item.id);

  if (!itemExists) return [...items, normalizedItem];

  return items.map((currentItem) =>
    currentItem.id === item.id ? normalizedItem : currentItem
  );
}

export function deletePhase1PortfolioItem(items: Phase1PortfolioItem[], itemId: string) {
  return items.filter((item) => item.id !== itemId);
}

export function isSuccessfulFetchedMarketPrice(
  price: FetchedMarketPrice
): price is FetchedMarketPrice & {
  closePrice: number;
  source: "alpha_vantage_eod" | "eodhd_eod";
} {
  return (
    price.source !== "manual_required" &&
    (price.source as string) !== "unsupported" &&
    price.closePrice !== null &&
    Number.isFinite(price.closePrice) &&
    price.closePrice > 0
  );
}

function markPriceRefreshFailed(
  item: Phase1PortfolioItem,
  warning: string | undefined,
  priceStatus: "failed" | "unsupported" = "failed"
): Phase1PortfolioItem {
  return {
    ...item,
    priceStatus,
    priceDate: undefined,
    priceWarning: warning
  };
}
