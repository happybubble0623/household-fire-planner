import { describe, expect, it } from "vitest";
import {
  calculateInvestment,
  investmentFutureValue,
  periodsPerYearFor
} from "@/components/planning/planning-tool-panel";

// The investment engine lives in the planning tool panel. These tests pin the
// future-value math the calculator promises: ordinary annuity vs annuity-due,
// the monthly/annual equivalence sanity check, and the zero-return guard.
describe("investmentFutureValue — closed-form future value", () => {
  // §1 Ordinary vs annuity-due for C=1000, r=6%, monthly, 10y.
  //   i = 0.06/12 = 0.005, n = 120, growthFactor = 1.005^120 ≈ 1.81939673
  //   ordinary = 1000 · (1.005^120 − 1)/0.005 ≈ 163,879.347
  //   due      = ordinary × 1.005             ≈ 164,698.744
  it("computes ordinary annuity (end of period) FV for C=1000, 6% monthly, 10y", () => {
    const i = 0.06 / 12;
    const ordinary = investmentFutureValue({
      principal: 0,
      contributionPerPeriod: 1000,
      periodicRate: i,
      periods: 120,
      timing: "end"
    });
    expect(ordinary.total).toBeCloseTo(163_879.347, 2);
  });

  it("computes annuity-due (beginning of period) FV as ordinary × (1 + i)", () => {
    const i = 0.06 / 12;
    const ordinary = investmentFutureValue({
      principal: 0,
      contributionPerPeriod: 1000,
      periodicRate: i,
      periods: 120,
      timing: "end"
    });
    const due = investmentFutureValue({
      principal: 0,
      contributionPerPeriod: 1000,
      periodicRate: i,
      periods: 120,
      timing: "beginning"
    });
    expect(due.total).toBeCloseTo(164_698.744, 2);
    // The defining relationship: a beginning-of-period series is an end-of-period
    // series compounded one extra period.
    expect(due.total).toBeCloseTo(ordinary.total * (1 + i), 6);
    // And it must always end higher for a positive rate.
    expect(due.total).toBeGreaterThan(ordinary.total);
  });

  it("includes principal growth: P·(1+i)^n separate from the contribution series", () => {
    const i = 0.06 / 12;
    const result = investmentFutureValue({
      principal: 50_000,
      contributionPerPeriod: 1000,
      periodicRate: i,
      periods: 120,
      timing: "end"
    });
    expect(result.fvPrincipal).toBeCloseTo(50_000 * Math.pow(1 + i, 120), 4);
    expect(result.total).toBeCloseTo(result.fvPrincipal + result.fvContributions, 6);
  });

  // §3 i = 0 guard: with no return the series is just C·n and principal is flat.
  it("guards i = 0 — no return means FV(contributions) = C·n (both timings equal)", () => {
    const end = investmentFutureValue({
      principal: 5_000,
      contributionPerPeriod: 1000,
      periodicRate: 0,
      periods: 120,
      timing: "end"
    });
    const begin = investmentFutureValue({
      principal: 5_000,
      contributionPerPeriod: 1000,
      periodicRate: 0,
      periods: 120,
      timing: "beginning"
    });
    expect(end.fvContributions).toBe(1000 * 120);
    expect(end.total).toBe(5_000 + 120_000);
    // With no growth, timing makes no difference.
    expect(begin.total).toBe(end.total);
  });
});

describe("calculateInvestment — frequency, timing, and compounding", () => {
  it("derives compounding from contribution frequency (12/yr vs 1/yr)", () => {
    expect(periodsPerYearFor("monthly")).toBe(12);
    expect(periodsPerYearFor("annual")).toBe(1);
  });

  it("monthly end-of-period default matches the closed-form ordinary annuity", () => {
    const inv = calculateInvestment({
      startingBalance: 0,
      contribution: 1000,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      annualReturnPercent: 6,
      years: 10
    });
    expect(inv.endingBalance).toBeCloseTo(163_879.347, 2);
    expect(inv.totalContributions).toBe(1000 * 120);
  });

  it("annuity-due ends higher than the ordinary annuity for the same inputs", () => {
    const base = {
      startingBalance: 100_000,
      contribution: 2_000,
      contributionFrequency: "monthly" as const,
      annualReturnPercent: 7,
      years: 15
    };
    const ordinary = calculateInvestment({ ...base, contributionTiming: "end" });
    const due = calculateInvestment({ ...base, contributionTiming: "beginning" });
    expect(due.endingBalance).toBeGreaterThan(ordinary.endingBalance);
    expect(due.totalContributions).toBe(ordinary.totalContributions);
  });

  // §2 Monthly vs annual equivalence sanity: contributing 1,000/mo (monthly
  // compounding) is the same yearly cash as 12,000/yr (annual compounding).
  // Monthly should end a touch higher — money goes in sooner and compounds more
  // often — but within a few percent, not wildly apart.
  it("monthly vs annual: same yearly cash lands within ~5% (monthly slightly higher)", () => {
    const monthly = calculateInvestment({
      startingBalance: 0,
      contribution: 1_000,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      annualReturnPercent: 6,
      years: 10
    });
    const annual = calculateInvestment({
      startingBalance: 0,
      contribution: 12_000,
      contributionFrequency: "annual",
      contributionTiming: "end",
      annualReturnPercent: 6,
      years: 10
    });
    // Same total cash contributed.
    expect(monthly.totalContributions).toBe(annual.totalContributions);
    expect(monthly.endingBalance).toBeGreaterThan(annual.endingBalance);
    const ratio = monthly.endingBalance / annual.endingBalance;
    expect(ratio).toBeGreaterThan(1);
    expect(ratio).toBeLessThan(1.05);
  });

  it("annual frequency compounds once a year (FV = P·(1+r)^years)", () => {
    const inv = calculateInvestment({
      startingBalance: 10_000,
      contribution: 0,
      contributionFrequency: "annual",
      contributionTiming: "end",
      annualReturnPercent: 7,
      years: 10
    });
    expect(inv.endingBalance).toBeCloseTo(10_000 * Math.pow(1.07, 10), 4);
  });

  it("zero return: ending balance is just principal plus every contribution", () => {
    const inv = calculateInvestment({
      startingBalance: 5_000,
      contribution: 1_000,
      contributionFrequency: "monthly",
      contributionTiming: "end",
      annualReturnPercent: 0,
      years: 10
    });
    expect(inv.endingBalance).toBe(5_000 + 1_000 * 120);
    expect(inv.investmentGrowth).toBe(0);
  });
});
