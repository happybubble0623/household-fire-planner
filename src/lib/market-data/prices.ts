import type { ManualPriceOverride, PlanDocument } from "@/types/plan";
import type { FetchedMarketPrice, MarketPrice } from "@/types/market-data";

export function getManualPriceOnOrBefore(
  symbol: string,
  date: string,
  overrides: ManualPriceOverride[] = []
): MarketPrice | null {
  const override = overrides
    .filter((price) => price.priceDate <= date)
    .sort((a, b) => b.priceDate.localeCompare(a.priceDate))[0];

  if (!override) {
    return null;
  }

  return {
    symbol,
    priceDate: override.priceDate,
    closePrice: override.price,
    source: "manual_override",
    warning:
      override.priceDate === date
        ? undefined
        : "Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values."
  };
}

export async function getMarketPriceOnOrBefore(
  symbol: string,
  date: string,
  overrides: ManualPriceOverride[] = []
): Promise<MarketPrice> {
  const manualPrice = getManualPriceOnOrBefore(symbol, date, overrides);

  if (manualPrice) {
    return manualPrice;
  }

  return {
    symbol,
    priceDate: date,
    closePrice: 0,
    source: "static_sample",
    stale: true,
    warning: "Could not fetch latest price. Enter a manual price or try again later."
  };
}

export function applyFetchedPricesToPlan(
  plan: PlanDocument,
  fetchedPrices: FetchedMarketPrice[]
): PlanDocument {
  const fetchedBySymbol = new Map(
    fetchedPrices.map((price) => [price.symbol.toUpperCase(), price])
  );

  return {
    ...plan,
    updatedAt: new Date().toISOString(),
    marketPositions: plan.marketPositions.map((position) => {
      const fetched = fetchedBySymbol.get(position.symbol.toUpperCase());

      if (!fetched || fetched.closePrice === null || fetched.closePrice <= 0) {
        return position;
      }

      const existingOverrides = position.manualPriceOverrides ?? [];
      const withoutSameDate = existingOverrides.filter(
        (price) => price.priceDate !== fetched.priceDate
      );

      return {
        ...position,
        manualPriceOverrides: [
          ...withoutSameDate,
          {
            id: `price-${position.symbol.toLowerCase()}-${fetched.priceDate}`,
            priceDate: fetched.priceDate,
            price: fetched.closePrice,
            notes: `Fetched EOD price from ${fetched.source}. ${fetched.warning ?? ""}`.trim(),
            createdAt: new Date().toISOString()
          }
        ]
      };
    })
  };
}
