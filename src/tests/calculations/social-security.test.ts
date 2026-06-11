import { describe, expect, it } from "vitest";
import {
  applyClaimingAdjustment,
  calculateAime,
  calculatePia,
  estimateSocialSecurityBenefit
} from "@/lib/calculations/social-security";

describe("Social Security calculator helpers", () => {
  it("computes AIME from the highest 35 indexed earning years", () => {
    const earnings = Array.from({ length: 40 }, (_, index) => ({
      year: 1985 + index,
      indexedEarnings: index < 5 ? 10000 : 42000
    }));

    expect(calculateAime(earnings)).toBe(3500);
  });

  it("computes PIA from bend points", () => {
    expect(calculatePia(10_000, { first: 1_286, second: 7_749 })).toBe(3_563.2);
  });

  it("applies early and delayed claiming adjustments", () => {
    expect(applyClaimingAdjustment(2000, 67, 62)).toBeCloseTo(1400, 2);
    expect(applyClaimingAdjustment(2000, 67, 70)).toBeCloseTo(2480, 2);
    expect(applyClaimingAdjustment(2000, 66, 70)).toBeCloseTo(2640, 2);
    expect(applyClaimingAdjustment(2000, 67, 72)).toBeCloseTo(2480, 2);
  });

  it("estimates a worker benefit from salary, work years, growth, and claiming age", () => {
    const result = estimateSocialSecurityBenefit({
      birthYear: 1985,
      claimingAge: 67,
      workStartYear: 2010,
      workEndYear: 2049,
      startingAnnualCoveredEarnings: 80000,
      annualEarningsGrowth: 0.03,
      displayMode: "today_dollars"
    });

    expect(result.eligibilityYear).toBe(2047);
    expect(result.indexingYear).toBe(2045);
    expect(result.retirementEligible).toBe(true);
    expect(result.estimatedCredits).toBeGreaterThanOrEqual(result.requiredCredits);
    expect(result.estimatedAime).toBeGreaterThan(0);
    expect(result.estimatedPia).toBeGreaterThan(0);
    expect(result.estimatedMonthlyBenefitTodayDollars).toBeGreaterThan(0);
    expect(result.estimatedMonthlyBenefitFutureDollars).toBeGreaterThan(
      result.estimatedMonthlyBenefitTodayDollars
    );
    expect(result.annualBenefitTodayDollars).toBeCloseTo(
      result.estimatedMonthlyBenefitTodayDollars * 12,
      2
    );
    expect(result.warning).toContain("unofficial estimate");
  });

  it("uses detailed annual covered earnings when provided", () => {
    const annualEarningsByYear = Object.fromEntries(
      Array.from({ length: 35 }, (_, index) => [String(1990 + index), 50_000])
    );
    const result = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 1990,
      workEndYear: 2024,
      startingAnnualCoveredEarnings: 10_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars",
      annualEarningsByYear
    });

    expect(result.eligibilityYear).toBe(2026);
    expect(result.estimatedAime).toBe(Math.floor((50_000 * 35) / 420));
    expect(result.estimatedMonthlyBenefitTodayDollars).toBeGreaterThan(0);
  });

  it("caps covered earnings at the contribution and benefit base before computing AIME", () => {
    const result = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 2026,
      workEndYear: 2026,
      startingAnnualCoveredEarnings: 1_000_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars"
    });

    expect(result.estimatedCredits).toBe(4);
    expect(result.retirementEligible).toBe(false);
    expect(result.estimatedAime).toBe(Math.floor(184_500 / 420));
    expect(result.estimatedMonthlyBenefitTodayDollars).toBe(0);
  });

  it("does not estimate retirement benefits until the worker has 40 credits", () => {
    const result = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 2020,
      workEndYear: 2021,
      startingAnnualCoveredEarnings: 200_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars"
    });

    expect(result.estimatedCredits).toBe(8);
    expect(result.requiredCredits).toBe(40);
    expect(result.retirementEligible).toBe(false);
    expect(result.estimatedMonthlyBenefitTodayDollars).toBe(0);
    expect(result.warning).toContain("40 Social Security credits");
  });

  it("qualifies after earning 40 credits across at least 10 years", () => {
    const annualEarningsByYear = Object.fromEntries(
      Array.from({ length: 10 }, (_, index) => [String(2017 + index), 8_000])
    );
    const result = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 2017,
      workEndYear: 2026,
      startingAnnualCoveredEarnings: 0,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars",
      annualEarningsByYear
    });

    expect(result.estimatedCredits).toBe(40);
    expect(result.retirementEligible).toBe(true);
    expect(result.estimatedMonthlyBenefitTodayDollars).toBeGreaterThan(0);
  });

  it("manual annual covered earnings override the simplified projected earnings for matching years", () => {
    const projected = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 1990,
      workEndYear: 1991,
      startingAnnualCoveredEarnings: 10_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars"
    });
    const manualOverride = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 1990,
      workEndYear: 1991,
      startingAnnualCoveredEarnings: 80_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars",
      annualEarningsByYear: {
        "1990": 10_000,
        "1991": 10_000
      }
    });

    expect(manualOverride.estimatedAime).toBe(projected.estimatedAime);
  });

  it("caps the benefit at the highest 35 years: 35 vs 40 identical years are equal", () => {
    const flat = (workStartYear: number, workEndYear: number) =>
      estimateSocialSecurityBenefit({
        birthYear: 1964,
        claimingAge: 67,
        workStartYear,
        workEndYear,
        startingAnnualCoveredEarnings: 30_000,
        annualEarningsGrowth: 0,
        wageGrowthAssumption: 0,
        displayMode: "today_dollars"
      });

    const thirtyFive = flat(1990, 2024); // 35 years
    const forty = flat(1985, 2024); // 40 years, same flat wage

    expect(thirtyFive.estimatedAime).toBe(Math.floor((30_000 * 35) / 420));
    expect(forty.estimatedAime).toBe(thirtyFive.estimatedAime);
    expect(forty.estimatedPia).toBe(thirtyFive.estimatedPia);
  });

  it("counts missing years as zero when fewer than 35 years are worked", () => {
    const twenty = estimateSocialSecurityBenefit({
      birthYear: 1964,
      claimingAge: 67,
      workStartYear: 2005,
      workEndYear: 2024,
      startingAnnualCoveredEarnings: 30_000,
      annualEarningsGrowth: 0,
      wageGrowthAssumption: 0,
      displayMode: "today_dollars"
    });

    expect(twenty.estimatedAime).toBe(Math.floor((30_000 * 20) / 420));
    expect(twenty.estimatedAime).toBeLessThan(Math.floor((30_000 * 35) / 420));
  });

  it("never lowers the benefit when extra years are added (rising wages)", () => {
    const rising = (workEndYear: number) =>
      estimateSocialSecurityBenefit({
        birthYear: 1990,
        claimingAge: 67,
        workStartYear: 2015,
        workEndYear,
        startingAnnualCoveredEarnings: 50_000,
        annualEarningsGrowth: 0.05,
        wageGrowthAssumption: 0.03,
        displayMode: "today_dollars"
      }).estimatedAime;

    expect(rising(2054)).toBeGreaterThanOrEqual(rising(2049));
  });

  it("does not index earnings earned at or after age 60", () => {
    const singleYear = (year: number) =>
      estimateSocialSecurityBenefit({
        birthYear: 1964, // turns 60 in 2024 -> indexing year 2024
        claimingAge: 67,
        workStartYear: year,
        workEndYear: year,
        startingAnnualCoveredEarnings: 50_000,
        annualEarningsGrowth: 0,
        wageGrowthAssumption: 0.03,
        displayMode: "today_dollars"
      }).estimatedAime;

    // A dollar earned before age 60 is indexed up; the same dollar at age 60 is not.
    expect(singleYear(2010)).toBeGreaterThan(singleYear(2024));
  });

  it("does not count earnings after the claiming age (working far past 62 cannot inflate the age-62 benefit)", () => {
    const at62 = (workEndYear: number) =>
      estimateSocialSecurityBenefit({
        birthYear: 1990,
        claimingAge: 62,
        workStartYear: 2026,
        workEndYear,
        startingAnnualCoveredEarnings: 145_000,
        annualEarningsGrowth: 0.03,
        wageGrowthAssumption: 0.03,
        displayMode: "today_dollars"
      });

    // Working to age 100 vs age 71 must give the same age-62 benefit, because
    // earnings after age 62 are not counted toward a benefit claimed at 62.
    expect(at62(2090).estimatedAime).toBe(at62(2061).estimatedAime);
    expect(at62(2090).estimatedMonthlyBenefitTodayDollars).toBe(
      at62(2061).estimatedMonthlyBenefitTodayDollars
    );

    // But claiming later still counts the extra years worked up to that age.
    const at70 = estimateSocialSecurityBenefit({
      birthYear: 1990,
      claimingAge: 70,
      workStartYear: 2026,
      workEndYear: 2090,
      startingAnnualCoveredEarnings: 145_000,
      annualEarningsGrowth: 0.03,
      wageGrowthAssumption: 0.03,
      displayMode: "today_dollars"
    });
    expect(at70.estimatedAime).toBeGreaterThanOrEqual(at62(2090).estimatedAime);
  });

  it("sets full retirement age by birth year", () => {
    const fra = (birthYear: number) =>
      estimateSocialSecurityBenefit({
        birthYear,
        claimingAge: 67,
        workStartYear: birthYear + 25,
        workEndYear: birthYear + 60,
        startingAnnualCoveredEarnings: 50_000,
        annualEarningsGrowth: 0,
        wageGrowthAssumption: 0,
        displayMode: "today_dollars"
      }).fullRetirementAge;

    expect(fra(1954)).toBe(66);
    expect(fra(1955)).toBeCloseTo(66 + 2 / 12, 4);
    expect(fra(1960)).toBe(67);
  });
});
