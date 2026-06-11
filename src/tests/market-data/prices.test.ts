import { describe, expect, it } from "vitest";
import { applyFetchedPricesToPlan } from "@/lib/market-data/prices";
import { samplePlan } from "@/lib/data/sample-plan";

describe("market price application", () => {
  it("adds fetched EOD prices as dated price records for matching positions", () => {
    const updated = applyFetchedPricesToPlan(samplePlan, [
      {
        symbol: "AAPL",
        priceDate: "2026-06-05",
        closePrice: 203.92,
        source: "alpha_vantage_eod",
        warning: "Market data may be delayed."
      }
    ]);

    const aapl = updated.marketPositions.find((position) => position.symbol === "AAPL");
    const latestPrice = aapl?.manualPriceOverrides?.find(
      (price) => price.priceDate === "2026-06-05"
    );

    expect(latestPrice?.price).toBe(203.92);
    expect(latestPrice?.notes).toContain("alpha_vantage_eod");
  });

  it("does not add a price record when the provider returns manual fallback", () => {
    const updated = applyFetchedPricesToPlan(samplePlan, [
      {
        symbol: "AAPL",
        priceDate: "2026-06-07",
        closePrice: null,
        source: "manual_required",
        warning: "Could not fetch latest price."
      }
    ]);

    const aapl = updated.marketPositions.find((position) => position.symbol === "AAPL");

    expect(aapl?.manualPriceOverrides?.some((price) => price.priceDate === "2026-06-07")).toBe(
      false
    );
  });
});
