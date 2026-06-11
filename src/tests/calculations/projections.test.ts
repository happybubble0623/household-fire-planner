import { describe, expect, it } from "vitest";
import { generateNetWorthSeries } from "@/lib/calculations/net-worth-series";
import {
  buildMonthlyBlockBootstrapPath,
  runMonteCarloProjection
} from "@/lib/calculations/monte-carlo";
import { historicalMonthlyReturns } from "@/lib/data/historical-returns";
import { summarizeSavedPath } from "@/lib/calculations/projection-summary";
import { samplePlan } from "@/lib/data/sample-plan";

describe("projection summaries", () => {
  it("generates a monthly net worth series from effective-dated records", async () => {
    const series = await generateNetWorthSeries(samplePlan, "2024-12-31", "2025-12-31", "monthly");

    expect(series.length).toBeGreaterThan(10);
    expect(series[0]).toMatchObject({
      date: "2024-12-31",
      netWorth: expect.any(Number)
    });
    expect(series.at(-1)).toMatchObject({
      date: "2025-12-31",
      netWorth: 272500
    });
  });

  it("returns Monte Carlo result shape with safe survival wording fields", async () => {
    const result = await runMonteCarloProjection(samplePlan, samplePlan.savedPaths[0], {
      retirementDate: "2048-01-01",
      simulations: 1000,
      successThreshold: 0.9,
      seed: 42
    });

    expect(result.simulations).toBe(1000);
    expect(result.successThreshold).toBe(0.9);
    expect(result.successRate).toBeGreaterThanOrEqual(0);
    expect(result.successRate).toBeLessThanOrEqual(1);
    expect(result.safeWording).toContain("simulated historical market paths");
  });

  it("builds deterministic 12-month contiguous bootstrap blocks from static historical rows", () => {
    const path = buildMonthlyBlockBootstrapPath({
      rows: historicalMonthlyReturns,
      monthsNeeded: 24,
      seed: 7
    });

    expect(path).toHaveLength(24);
    expect(path[1].monthIndex).toBe(path[0].monthIndex + 1);
    expect(path[11].monthIndex).toBe(path[0].monthIndex + 11);

    const repeat = buildMonthlyBlockBootstrapPath({
      rows: historicalMonthlyReturns,
      monthsNeeded: 24,
      seed: 7
    });
    expect(repeat.map((row) => row.monthIndex)).toEqual(path.map((row) => row.monthIndex));
  });

  it("returns reproducible Monte Carlo distribution metrics for the same seed", async () => {
    const first = await runMonteCarloProjection(samplePlan, samplePlan.savedPaths[0], {
      retirementDate: "2048-01-01",
      simulations: 1000,
      successThreshold: 0.85,
      seed: 123
    });
    const second = await runMonteCarloProjection(samplePlan, samplePlan.savedPaths[0], {
      retirementDate: "2048-01-01",
      simulations: 1000,
      successThreshold: 0.85,
      seed: 123
    });

    expect(second).toMatchObject({
      successRate: first.successRate,
      medianEndingBalance: first.medianEndingBalance,
      tenthPercentileEndingBalance: first.tenthPercentileEndingBalance,
      ninetiethPercentileEndingBalance: first.ninetiethPercentileEndingBalance
    });
    expect(first.successThreshold).toBe(0.85);
  });

  it("summarizes all three FIRE age estimate labels for a Saved Path", async () => {
    const summary = await summarizeSavedPath(samplePlan, samplePlan.savedPaths[0], {
      currentDate: "2026-01-01",
      simulations: 1000
    });

    expect(summary.simple.label).toBe("Simple FIRE Age Estimate");
    expect(summary.deterministic.label).toBe("Deterministic FIRE Age Estimate");
    expect(summary.monteCarlo.label).toBe("Monte Carlo FIRE Age Estimate");
    expect(summary.disclaimer).toContain("not a guarantee");
  });

  it("derives FIRE age estimates from plan assumptions instead of fixed placeholder ages", async () => {
    const slowerPath = {
      ...samplePlan.savedPaths[0],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        annualSavings: 12000
      }
    };
    const fasterPath = {
      ...samplePlan.savedPaths[0],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        annualSavings: 60000
      }
    };

    const slower = await summarizeSavedPath(samplePlan, slowerPath, {
      currentDate: "2026-01-01",
      simulations: 1000
    });
    const faster = await summarizeSavedPath(samplePlan, fasterPath, {
      currentDate: "2026-01-01",
      simulations: 1000
    });

    expect(faster.simple.monthsFromCurrentDate).toBeLessThan(slower.simple.monthsFromCurrentDate);
    expect(faster.simple.value).not.toBe(slower.simple.value);
    expect(faster.monteCarlo.value).not.toBe("51 years, 2 months");
  });
});
