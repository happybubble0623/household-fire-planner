import { describe, expect, it } from "vitest";
import {
  getEarliestEffectiveDate,
  resolveNetWorthRange
} from "@/lib/calculations/net-worth-series";
import { samplePlan } from "@/lib/data/sample-plan";

describe("net worth chart ranges", () => {
  it("maps standard ranges to a start date and practical chart granularity", () => {
    expect(
      resolveNetWorthRange({
        range: "1M",
        endDate: "2026-06-07",
        earliestDate: "2024-06-01"
      })
    ).toEqual({
      startDate: "2026-05-07",
      granularity: "daily"
    });

    expect(
      resolveNetWorthRange({
        range: "YTD",
        endDate: "2026-06-07",
        earliestDate: "2024-06-01"
      })
    ).toEqual({
      startDate: "2026-01-01",
      granularity: "weekly"
    });

    expect(
      resolveNetWorthRange({
        range: "All",
        endDate: "2026-06-07",
        earliestDate: "2024-06-01"
      })
    ).toEqual({
      startDate: "2024-06-01",
      granularity: "monthly"
    });
  });

  it("uses the custom start date when Custom is selected", () => {
    expect(
      resolveNetWorthRange({
        range: "Custom",
        endDate: "2026-06-07",
        earliestDate: "2024-06-01",
        customStartDate: "2025-03-15"
      })
    ).toEqual({
      startDate: "2025-03-15",
      granularity: "weekly"
    });
  });

  it("finds the earliest effective-dated record in a plan", () => {
    expect(getEarliestEffectiveDate(samplePlan)).toBe("2024-06-01");
  });
});
