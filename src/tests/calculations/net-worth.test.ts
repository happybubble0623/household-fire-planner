import { describe, expect, it } from "vitest";
import {
  calculateNetWorthAsOf,
  getLatestSnapshotOnOrBefore
} from "@/lib/calculations/net-worth";
import { samplePlan } from "@/lib/data/sample-plan";

describe("effective-dated net worth calculation", () => {
  it("returns the latest snapshot on or before the selected date", () => {
    const snapshots = [
      { effectiveDate: "2025-06-01", quantity: 50 },
      { effectiveDate: "2024-06-01", quantity: 100 }
    ];

    expect(getLatestSnapshotOnOrBefore(snapshots, "2025-05-31")).toEqual({
      effectiveDate: "2024-06-01",
      quantity: 100
    });
    expect(getLatestSnapshotOnOrBefore(snapshots, "2025-06-01")).toEqual({
      effectiveDate: "2025-06-01",
      quantity: 50
    });
    expect(getLatestSnapshotOnOrBefore(snapshots, "2024-05-31")).toBeNull();
  });

  it("uses the correct AAPL quantity before and after a later snapshot", async () => {
    const result2024 = await calculateNetWorthAsOf(samplePlan, "2024-12-31");
    const result2025 = await calculateNetWorthAsOf(samplePlan, "2025-12-31");

    const aapl2024 = result2024.drilldown.marketPositions.find(
      (position) => position.symbol === "AAPL"
    );
    const aapl2025 = result2025.drilldown.marketPositions.find(
      (position) => position.symbol === "AAPL"
    );

    expect(aapl2024?.quantity).toBe(100);
    expect(aapl2024?.price).toBe(192);
    expect(aapl2024?.value).toBe(19200);

    expect(aapl2025?.quantity).toBe(50);
    expect(aapl2025?.price).toBe(210);
    expect(aapl2025?.value).toBe(10500);
  });

  it("combines market positions, cash, manual assets, and liabilities as of a date", async () => {
    const result = await calculateNetWorthAsOf(samplePlan, "2025-12-31");

    expect(result.totalAssets).toBe(10500 + 42000 + 525000);
    expect(result.totalLiabilities).toBe(305000);
    expect(result.netWorth).toBe(272500);
    expect(result.drilldown.cashAccounts[0]?.balance).toBe(42000);
    expect(result.drilldown.manualAssets[0]?.value).toBe(525000);
    expect(result.drilldown.liabilities[0]?.balance).toBe(305000);
  });
});
