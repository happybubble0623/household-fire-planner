import { describe, expect, it } from "vitest";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import type { Phase1FireInputs } from "@/types/phase1";

const baseInputs: Phase1FireInputs = {
  currentAge: 40,
  lifeExpectancy: 90,
  passiveIncomeFireAge: 60,
  fireRuleMode: "withdrawal_rate",
  currentFireAssets: 500_000,
  annualExpenses: 120_000,
  expensesInflationAdjusted: true,
  useExpenseCategoriesOverride: false,
  expenseCategories: [],
  annualPassiveGuaranteedIncome: 20_000,
  passiveGuaranteedIncomeInflationAdjusted: true,
  useIncomeSourcesOverride: false,
  incomeSources: [],
  annualSavingsBeforeFire: 50_000,
  expectedAnnualPortfolioReturnPercent: 6,
  expectedCashGeneratingReturnPercent: 2,
  inflationRatePercent: 3,
  withdrawalRatePercent: 4,
  taxMode: "simple",
  simpleEffectiveTaxRatePercent: 10
};

describe("calculatePhase1Fire", () => {
  it("finds the earliest portfolio drawdown FIRE age that survives through life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 1_000_000,
      annualExpenses: 100_000,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 50_000,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      withdrawalRatePercent: 5,
      taxMode: "none"
    });

    expect(result.withdrawalRate.targetReached).toBe(true);
    expect(result.withdrawalRate.estimatedFireAge).toBe(68);
    expect(result.withdrawalRate.estimatedYearsToFire).toBe(28);
    expect(result.withdrawalRate.assetsAtFire).toBe(2_400_000);
    expect(result.withdrawalRate.firstYearPortfolioDraw).toBe(100_000);
    expect(result.withdrawalRate.impliedWithdrawalRate).toBeCloseTo(0.041666, 5);
    expect(result.withdrawalRate.endingBalanceAtLifeExpectancy).toBe(100_000);
  });

  it("ignores the stored withdrawal-rate shortcut when choosing a drawdown FIRE age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 1_000_000,
      annualExpenses: 100_000,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 50_000,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      withdrawalRatePercent: 50,
      taxMode: "none"
    });

    expect(result.withdrawalRate.estimatedFireAge).toBe(68);
    expect(result.withdrawalRate.impliedWithdrawalRate).toBeCloseTo(0.041666, 5);
  });

  it("returns calendar-year projection rows for the drawdown audit table", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 100_000,
      annualExpenses: 20_000,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 10_000,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    });
    const currentYear = new Date().getFullYear();

    expect(result.withdrawalRate.projectionRows[0]).toMatchObject({
      year: 0,
      calendarYear: currentYear,
      age: 40,
      startingAssets: 100_000,
      cashFlow: -20_000,
      endingAssets: 80_000,
      fireGap: 0
    });
  });

  it("marks drawdown FIRE as not reached when no retirement age survives to life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 50,
      currentFireAssets: 0,
      annualExpenses: 100_000,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    });

    expect(result.withdrawalRate.targetReached).toBe(false);
    expect(result.withdrawalRate.estimatedFireAge).toBeNull();
    expect(result.withdrawalRate.assetsAtFire).toBe(0);
    expect(result.withdrawalRate.impliedWithdrawalRate).toBeNull();
  });

  it("keeps inflation and tax in the drawdown survival test", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 500_000,
      annualExpenses: 100_000,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 10,
      taxMode: "simple",
      simpleEffectiveTaxRatePercent: 20
    });

    expect(result.withdrawalRate.targetReached).toBe(true);
    expect(result.withdrawalRate.estimatedFireAge).toBe(40);
    expect(result.withdrawalRate.projectionRows[0].cashFlow).toBeCloseTo(-125_000, 2);
  });

  it("lets annual retirement expenses stay flat when expense inflation is disabled", () => {
    const withInflation = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 500_000,
      annualExpenses: 100_000,
      expensesInflationAdjusted: true,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 10,
      taxMode: "none"
    });
    const withoutInflation = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 500_000,
      annualExpenses: 100_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 10,
      taxMode: "none"
    });

    expect(withInflation.withdrawalRate.projectionRows[1].cashFlow).toBeCloseTo(-110_000, 2);
    expect(withoutInflation.withdrawalRate.projectionRows[1].cashFlow).toBeCloseTo(-100_000, 2);
  });

  it("uses detailed expense categories instead of the simple annual expense amount when enabled", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 500_000,
      annualExpenses: 999_999,
      expensesInflationAdjusted: true,
      useExpenseCategoriesOverride: true,
      expenseCategories: [
        {
          id: "housing",
          type: "housing",
          annualAmount: 40_000,
          startAge: 40,
          inflationAdjusted: false
        },
        {
          id: "healthcare",
          type: "healthcare",
          annualAmount: 10_000,
          startAge: 41,
          endAge: 41,
          inflationAdjusted: false
        }
      ],
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    });

    expect(result.withdrawalRate.annualPortfolioFundedSpendingGap).toBe(40_000);
    expect(result.withdrawalRate.projectionRows[0].cashFlow).toBeCloseTo(-40_000, 2);
    expect(result.withdrawalRate.projectionRows[1].cashFlow).toBeCloseTo(-50_000, 2);
    expect(result.withdrawalRate.projectionRows[2].cashFlow).toBeCloseTo(-40_000, 2);
  });

  it("inflates detailed expense categories independently by active category", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 60,
      lifeExpectancy: 62,
      passiveIncomeFireAge: 60,
      fireRuleMode: "income_stream",
      annualExpenses: 999_999,
      expensesInflationAdjusted: false,
      useExpenseCategoriesOverride: true,
      expenseCategories: [
        {
          id: "base-living",
          type: "living",
          annualAmount: 30_000,
          startAge: 60,
          inflationAdjusted: true
        },
        {
          id: "travel",
          type: "travel",
          annualAmount: 5_000,
          startAge: 61,
          endAge: 61,
          inflationAdjusted: false
        }
      ],
      annualPassiveGuaranteedIncome: 100_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      inflationRatePercent: 10,
      taxMode: "none"
    });

    expect(result.incomeStream.projectionRows[0].annualExpenses).toBeCloseTo(30_000, 2);
    expect(result.incomeStream.projectionRows[1].annualExpenses).toBeCloseTo(38_000, 2);
    expect(result.incomeStream.projectionRows[2].annualExpenses).toBeCloseTo(36_300, 2);
  });

  it("counts detailed income sources that start before the estimated drawdown FIRE age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 36,
      lifeExpectancy: 90,
      currentFireAssets: 500_000,
      annualExpenses: 140_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "ss-user-1",
          type: "social_security",
          owner: "user_1",
          annualAmount: 70_000,
          startAge: 62,
          inflationAdjusted: false
        }
      ]
    });
    const age62Row = result.withdrawalRate.projectionRows.find((row) => row.age === 62);

    expect(result.withdrawalRate.targetReached).toBe(true);
    expect(result.withdrawalRate.estimatedFireAge).toBe(73);
    expect(result.withdrawalRate.assetsAtFire).toBe(1_270_000);
    expect(result.withdrawalRate.firstYearPortfolioDraw).toBe(70_000);
    expect(age62Row).toMatchObject({
      age: 62,
      startingAssets: 500_000,
      cashFlow: 70_000,
      endingAssets: 570_000
    });
  });

  it("does not count simple passive income as pre-FIRE savings because it has no start age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 36,
      lifeExpectancy: 90,
      currentFireAssets: 500_000,
      annualExpenses: 140_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 70_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: false,
      incomeSources: []
    });

    expect(result.withdrawalRate.estimatedFireAge).toBe(84);
    expect(result.withdrawalRate.assetsAtFire).toBe(500_000);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 62)?.cashFlow).toBe(0);
  });

  it("does not add income that starts exactly at FIRE age to assets before FIRE", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 0,
      annualExpenses: 50_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "pension",
          type: "pension",
          owner: "user_1",
          annualAmount: 50_000,
          startAge: 41,
          inflationAdjusted: false
        }
      ]
    });

    expect(result.withdrawalRate.estimatedFireAge).toBe(41);
    expect(result.withdrawalRate.assetsAtFire).toBe(0);
    expect(result.withdrawalRate.firstYearPortfolioDraw).toBe(0);
    expect(result.withdrawalRate.projectionRows[0]).toMatchObject({
      age: 40,
      cashFlow: 0,
      endingAssets: 0
    });
  });

  it("counts detailed income sources before FIRE only while they are active", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 45,
      currentFireAssets: 0,
      annualExpenses: 200_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "temporary-rental",
          type: "rental_income",
          owner: "joint",
          annualAmount: 50_000,
          startAge: 41,
          endAge: 42,
          inflationAdjusted: false
        }
      ]
    });

    expect(result.withdrawalRate.targetReached).toBe(false);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 40)?.cashFlow).toBe(0);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 41)?.cashFlow).toBe(50_000);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 42)?.cashFlow).toBe(50_000);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 43)?.cashFlow).toBe(0);
  });

  it("inflates active detailed income source cash flow before FIRE when marked inflation adjusted", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 0,
      annualExpenses: 500_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 10,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "cola-pension",
          type: "pension",
          owner: "user_1",
          annualAmount: 100_000,
          startAge: 41,
          inflationAdjusted: true
        }
      ]
    });

    expect(result.withdrawalRate.targetReached).toBe(false);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 41)?.cashFlow).toBeCloseTo(110_000, 2);
    expect(result.withdrawalRate.projectionRows.find((row) => row.age === 42)?.cashFlow).toBeCloseTo(121_000, 2);
  });

  it("returns zero years to FIRE when current assets already survive drawdown through life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentFireAssets: 5_000_000
    });

    expect(result.withdrawalRate.estimatedYearsToFire).toBe(0);
    expect(result.withdrawalRate.estimatedFireAge).toBe(40);
    expect(result.withdrawalRate.fireGap).toBe(0);
  });

  it("does not report deterministic success when FIRE is unreachable before life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentAge: 40,
      lifeExpectancy: 45,
      currentFireAssets: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0
    });

    expect(result.withdrawalRate.estimatedYearsToFire).toBe(5);
    expect(result.withdrawalRate.estimatedFireAge).toBeNull();
    expect(result.withdrawalRate.deterministicPasses).toBe(false);
    expect(result.withdrawalRate.endingBalanceAtLifeExpectancy).toBe(0);
    expect(result.withdrawalRate.firstFailureAge).toBe(45);
  });

  it("checks income stream coverage through life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      passiveIncomeFireAge: 40,
      annualExpenses: 80_000,
      annualPassiveGuaranteedIncome: 90_000,
      passiveGuaranteedIncomeInflationAdjusted: true,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.incomeCoverageRatio).toBeCloseTo(1.125, 3);
    expect(result.incomeStream.passes).toBe(true);
    expect(result.incomeStream.estimatedFireAge).toBe(40);
  });

  it("starts Income Stream FIRE expenses at the planned FIRE age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 45,
      passiveIncomeFireAge: 43,
      currentFireAssets: 100_000,
      annualExpenses: 50_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 10_000,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.firstShortfallAge).toBe(43);
    expect(result.incomeStream.projectionRows[0]).toMatchObject({
      age: 40,
      annualExpenses: 0,
      cashFlow: 0
    });
    expect(result.incomeStream.projectionRows.find((row) => row.age === 43)).toMatchObject({
      age: 43,
      annualExpenses: 50_000,
      cashFlow: -50_000,
      incomeCoverageRatio: 0
    });
  });

  it("uses simple passive income at Income Stream FIRE age but not before it", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 43,
      passiveIncomeFireAge: 42,
      currentFireAssets: 0,
      annualExpenses: 50_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 80_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: false,
      incomeSources: []
    } as Phase1FireInputs);

    expect(result.incomeStream.projectionRows.find((row) => row.age === 40)?.cashFlow).toBe(0);
    expect(result.incomeStream.projectionRows.find((row) => row.age === 41)?.cashFlow).toBe(0);
    expect(result.incomeStream.projectionRows.find((row) => row.age === 42)?.cashFlow).toBe(30_000);
    expect(result.incomeStream.incomeCoverageRatio).toBeCloseTo(1.6, 3);
    expect(result.incomeStream.passes).toBe(true);
    expect(result.incomeStream.estimatedFireAge).toBe(42);
  });

  it("uses detailed income sources for Income Stream FIRE only after the planned FIRE age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 44,
      passiveIncomeFireAge: 43,
      currentFireAssets: 0,
      annualExpenses: 50_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "temporary-rental",
          type: "rental_income",
          owner: "joint",
          annualAmount: 100_000,
          startAge: 41,
          endAge: 42,
          inflationAdjusted: false
        },
        {
          id: "ss-user-1",
          type: "social_security",
          owner: "user_1",
          annualAmount: 50_000,
          startAge: 43,
          inflationAdjusted: false
        }
      ]
    } as Phase1FireInputs);

    expect(result.incomeStream.passes).toBe(true);
    expect(result.incomeStream.firstShortfallAge).toBeUndefined();
    expect(result.incomeStream.projectionRows.map((row) => row.cashFlow)).toEqual([
      0,
      0,
      0,
      0,
      0
    ]);
  });

  it("measures Income Stream coverage ratio at the planned FIRE age, not current age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 64,
      passiveIncomeFireAge: 62,
      currentFireAssets: 0,
      annualExpenses: 100_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none",
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "ss-user-1",
          type: "social_security",
          owner: "user_1",
          annualAmount: 100_000,
          startAge: 62,
          inflationAdjusted: false
        }
      ]
    } as Phase1FireInputs);

    expect(result.incomeStream.incomeCoverageRatio).toBe(1);
    expect(result.incomeStream.passes).toBe(true);
    expect(result.incomeStream.estimatedFireAge).toBe(62);
    expect(result.incomeStream.firstShortfallAge).toBeUndefined();
  });

  it("returns income stream projection rows without asset roll-forward", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 42,
      passiveIncomeFireAge: 40,
      currentFireAssets: 100_000,
      annualExpenses: 80_000,
      annualPassiveGuaranteedIncome: 60_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      expectedAnnualPortfolioReturnPercent: 5,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.projectionRows[0]).toMatchObject({
      year: 0,
      age: 40,
      annualIncome: 60_000,
      annualExpenses: 80_000,
      incomeCoverageRatio: 0.75,
      cashFlow: -20_000,
      fireGap: 0
    });
    expect(result.incomeStream.firstShortfallAge).toBe(40);
  });

  it("keeps the simple passive income amount unless detailed income sources are enabled", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 41,
      passiveIncomeFireAge: 40,
      currentFireAssets: 0,
      annualExpenses: 100_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 20_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      useIncomeSourcesOverride: false,
      incomeSources: [
        {
          id: "ss-user-1",
          type: "social_security",
          owner: "user_1",
          annualAmount: 100_000,
          startAge: 40,
          inflationAdjusted: false
        }
      ],
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.annualPassiveGuaranteedIncome).toBe(20_000);
    expect(result.incomeStream.projectionRows[0].cashFlow).toBe(-80_000);
  });

  it("uses detailed income sources as an optional override with start and end ages", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 43,
      passiveIncomeFireAge: 40,
      currentFireAssets: 0,
      annualExpenses: 100_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      passiveGuaranteedIncomeInflationAdjusted: false,
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "rental",
          type: "rental_income",
          owner: "joint",
          annualAmount: 30_000,
          startAge: 40,
          endAge: 41,
          inflationAdjusted: false
        },
        {
          id: "ss-user-1",
          type: "social_security",
          owner: "user_1",
          annualAmount: 80_000,
          startAge: 42,
          inflationAdjusted: false
        }
      ],
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.annualPassiveGuaranteedIncome).toBe(30_000);
    expect(result.incomeStream.projectionRows.map((row) => row.cashFlow)).toEqual([
      -70_000,
      -70_000,
      -20_000,
      -20_000
    ]);
  });

  it("inflates detailed income sources only when the source is marked inflation adjusted", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      currentAge: 40,
      lifeExpectancy: 41,
      passiveIncomeFireAge: 40,
      currentFireAssets: 0,
      annualExpenses: 100_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "pension",
          type: "pension",
          owner: "user_1",
          annualAmount: 100_000,
          startAge: 40,
          inflationAdjusted: true
        }
      ],
      expectedAnnualPortfolioReturnPercent: 0,
      inflationRatePercent: 10,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.projectionRows[0].cashFlow).toBe(0);
    expect(result.incomeStream.projectionRows[1].cashFlow).toBeCloseTo(10_000, 2);
  });

  it("reports income stream failure when expenses outgrow non-inflating income", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_stream",
      passiveIncomeFireAge: 40,
      annualExpenses: 80_000,
      annualPassiveGuaranteedIncome: 85_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      inflationRatePercent: 4,
      taxMode: "none"
    } as Phase1FireInputs);

    expect(result.incomeStream.passes).toBe(false);
    expect(result.incomeStream.firstShortfallAge).toBeGreaterThan(40);
  });

  it("finds the earliest Principal-Preserving FIRE age once savings raise the floor enough", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 100_000,
      annualSavingsBeforeFire: 10_000,
      annualExpenses: 7_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      passiveGuaranteedIncomeInflationAdjusted: false,
      expectedAnnualPortfolioReturnPercent: 0,
      expectedCashGeneratingReturnPercent: 5,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    // Pre-FIRE assets grow by 10,000 savings plus the total return, which here is
    // appreciation (0%) + cash-generating return (5%). A 5% yield must reach
    // 7,000/yr, i.e. a ~147,287.50 floor: 100,000 compounded at 5% with 10,000
    // savings reaches that after three years -> earliest age 43.
    expect(result.principalPreserving.passes).toBe(true);
    expect(result.principalPreserving.estimatedFireAge).toBe(43);
    expect(result.principalPreserving.estimatedYearsToFire).toBe(3);
    expect(result.principalPreserving.assetsAtFire).toBeCloseTo(147_287.5, 2);
    expect(result.principalPreserving.principalFloor).toBeCloseTo(147_287.5, 2);
    expect(result.principalPreserving.annualCashGeneratingReturn).toBeCloseTo(7_364.375, 2);
    expect(result.principalPreserving.spendableIncome).toBeCloseTo(7_364.375, 2);
    expect(result.principalPreserving.firstPrincipalDipAge).toBeUndefined();
  });

  it("retires immediately when cash-generating return already covers expenses", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 43,
      currentFireAssets: 1_000_000,
      annualSavingsBeforeFire: 0,
      annualExpenses: 60_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 20_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      expectedAnnualPortfolioReturnPercent: 0,
      expectedCashGeneratingReturnPercent: 4,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    // 20,000 income + 4% of 1,000,000 = 60,000 exactly covers expenses now.
    expect(result.principalPreserving.estimatedFireAge).toBe(40);
    expect(result.principalPreserving.estimatedYearsToFire).toBe(0);
    expect(result.principalPreserving.assetsAtFire).toBe(1_000_000);
    expect(result.principalPreserving.principalFloor).toBe(1_000_000);
    expect(result.principalPreserving.annualCashGeneratingReturn).toBe(40_000);
    expect(result.principalPreserving.spendableIncome).toBe(60_000);
    expect(result.principalPreserving.passes).toBe(true);
    expect(result.principalPreserving.firstPrincipalDipAge).toBeUndefined();
  });

  it("reports Not reached and a retire-now dip age when no age preserves principal", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 43,
      currentFireAssets: 1_000_000,
      annualSavingsBeforeFire: 0,
      annualExpenses: 80_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 10_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      expectedAnnualPortfolioReturnPercent: 0,
      expectedCashGeneratingReturnPercent: 2,
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    // 10,000 income + 2% of 1,000,000 = 30,000 < 80,000, and no accumulation
    // grows the floor, so every candidate age dips immediately.
    expect(result.principalPreserving.passes).toBe(false);
    expect(result.principalPreserving.estimatedFireAge).toBeNull();
    expect(result.principalPreserving.estimatedFireYear).toBeNull();
    expect(result.principalPreserving.firstCashShortfallAge).toBe(40);
    expect(result.principalPreserving.firstPrincipalDipAge).toBe(40);
    expect(result.principalPreserving.endingAssetsAtLifeExpectancy).toBeLessThan(1_000_000);
  });

  it("allows Principal-Preserving FIRE to use prior cash surpluses without dipping below the principal floor", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 42,
      currentFireAssets: 1_000_000,
      annualSavingsBeforeFire: 0,
      annualExpenses: 70_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 40_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      expectedAnnualPortfolioReturnPercent: 0,
      expectedCashGeneratingReturnPercent: 4,
      useIncomeSourcesOverride: true,
      incomeSources: [
        {
          id: "temporary-rent",
          type: "rental_income",
          owner: "joint",
          annualAmount: 100_000,
          startAge: 40,
          endAge: 40,
          inflationAdjusted: false
        }
      ],
      inflationRatePercent: 0,
      taxMode: "none"
    } as Phase1FireInputs);

    // A one-year rental surplus at age 40 lifts assets above the floor, and the
    // surplus keeps later years above the floor even when cash flow turns slightly negative.
    expect(result.principalPreserving.estimatedFireAge).toBe(40);
    expect(result.principalPreserving.firstCashShortfallAge).toBe(41);
    expect(result.principalPreserving.firstPrincipalDipAge).toBeUndefined();
    expect(result.principalPreserving.passes).toBe(true);
    expect(result.principalPreserving.endingAssetsAtLifeExpectancy).toBeGreaterThanOrEqual(1_000_000);
  });

  it("validates the separate cash-generating return input", () => {
    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        fireRuleMode: "principal_preserving",
        expectedCashGeneratingReturnPercent: -0.1
      } as Phase1FireInputs)
    ).toThrow("expectedCashGeneratingReturnPercent must be a finite non-negative number.");
  });

  it("grosses up the full spending need under simple tax (Option B)", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "withdrawal_rate",
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 5_000_000,
      annualExpenses: 90_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 30_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 5,
      inflationRatePercent: 0,
      taxMode: "simple",
      simpleEffectiveTaxRatePercent: 25
    });

    // 90,000 / (1 - 0.25) = 120,000 pre-tax need; minus 30,000 income = 90,000 sold.
    expect(result.withdrawalRate.estimatedFireAge).toBe(40);
    expect(result.withdrawalRate.firstYearPortfolioDraw).toBe(90_000);
  });

  it("adds the home sale as a one-time inflow at the sale age", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "withdrawal_rate",
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 1_000_000,
      annualExpenses: 60_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 5,
      inflationRatePercent: 0,
      taxMode: "none",
      homeSaleAge: 70,
      homeSaleProceeds: 300_000
    });

    const saleRows = result.withdrawalRate.projectionRows.filter(
      (row) => (row.homeSaleInflow ?? 0) > 0
    );
    expect(saleRows).toHaveLength(1);
    expect(saleRows[0].age).toBe(70);
    expect(saleRows[0].homeSaleInflow).toBe(300_000);
  });

  it("grows the protected principal by appreciation in Principal-Preserving FIRE", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 90,
      currentFireAssets: 1_000_000,
      annualExpenses: 0,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 0,
      expectedAnnualPortfolioReturnPercent: 5,
      expectedCashGeneratingReturnPercent: 0,
      inflationRatePercent: 0,
      taxMode: "none"
    });

    expect(result.principalPreserving.passes).toBe(true);
    expect(result.principalPreserving.estimatedFireAge).toBe(40);
    expect(result.principalPreserving.endingAssetsAtLifeExpectancy).toBeGreaterThan(5_000_000);
  });

  it.each([
    {
      name: "income stream exact coverage passes",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 50_000,
        expensesInflationAdjusted: false,
        annualPassiveGuaranteedIncome: 50_000,
        passiveGuaranteedIncomeInflationAdjusted: false,
        inflationRatePercent: 0
      },
      path: "incomeStream",
      expected: { passes: true, firstShortfallAge: undefined, ratio: 1 }
    },
    {
      name: "income stream zero expenses passes",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 0,
        annualPassiveGuaranteedIncome: 0
      },
      path: "incomeStream",
      expected: { passes: true, firstShortfallAge: undefined, ratio: 1 }
    },
    {
      name: "income stream no income fails at FIRE age",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 45,
        annualExpenses: 10_000,
        expensesInflationAdjusted: false,
        annualPassiveGuaranteedIncome: 0
      },
      path: "incomeStream",
      expected: { passes: false, firstShortfallAge: 45, ratio: 0 }
    },
    {
      name: "income stream inflation adjusted income keeps pace",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 70_000,
        expensesInflationAdjusted: true,
        annualPassiveGuaranteedIncome: 70_000,
        passiveGuaranteedIncomeInflationAdjusted: true,
        inflationRatePercent: 5
      },
      path: "incomeStream",
      expected: { passes: true, firstShortfallAge: undefined, ratio: 1 }
    },
    {
      name: "income stream non-inflating income fails later",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 70_000,
        expensesInflationAdjusted: true,
        annualPassiveGuaranteedIncome: 70_000,
        passiveGuaranteedIncomeInflationAdjusted: false,
        inflationRatePercent: 5
      },
      path: "incomeStream",
      expected: { passes: false, firstShortfallAge: 41, ratio: 1 }
    },
    {
      name: "income stream detailed source starts after FIRE and fails first years",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 40_000,
        annualPassiveGuaranteedIncome: 0,
        useIncomeSourcesOverride: true,
        incomeSources: [
          {
            id: "later-pension",
            type: "pension",
            owner: "user_1",
            annualAmount: 40_000,
            startAge: 42,
            inflationAdjusted: false
          }
        ],
        inflationRatePercent: 0
      },
      path: "incomeStream",
      expected: { passes: false, firstShortfallAge: 40, ratio: 0 }
    },
    {
      name: "income stream temporary income ending before life expectancy fails after end age",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 40_000,
        annualPassiveGuaranteedIncome: 0,
        useIncomeSourcesOverride: true,
        incomeSources: [
          {
            id: "temp-rent",
            type: "rental_income",
            owner: "joint",
            annualAmount: 40_000,
            startAge: 40,
            endAge: 41,
            inflationAdjusted: false
          }
        ],
        inflationRatePercent: 0
      },
      path: "incomeStream",
      expected: { passes: false, firstShortfallAge: 42, ratio: 1 }
    },
    {
      name: "principal preserving exact cash coverage preserves floor",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 50_000,
        expensesInflationAdjusted: false,
        annualPassiveGuaranteedIncome: 20_000,
        expectedCashGeneratingReturnPercent: 3,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: true,
        estimatedFireAge: 40,
        firstPrincipalDipAge: undefined,
        firstCashShortfallAge: undefined
      }
    },
    {
      name: "principal preserving zero cash yield fails when income is short",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 50_000,
        expensesInflationAdjusted: false,
        annualPassiveGuaranteedIncome: 20_000,
        expectedCashGeneratingReturnPercent: 0,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: false,
        estimatedFireAge: null,
        firstPrincipalDipAge: 40,
        firstCashShortfallAge: 40
      }
    },
    {
      name: "principal preserving zero assets can pass with income streams only",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 0,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 50_000,
        expensesInflationAdjusted: false,
        annualPassiveGuaranteedIncome: 50_000,
        expectedCashGeneratingReturnPercent: 5,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: true,
        estimatedFireAge: 40,
        firstPrincipalDipAge: undefined,
        firstCashShortfallAge: undefined
      }
    },
    {
      name: "principal preserving pre-FIRE savings raise the floor to an earliest age",
      mode: "principal_preserving",
      overrides: {
        currentAge: 40,
        currentFireAssets: 100_000,
        annualSavingsBeforeFire: 10_000,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 7_000,
        annualPassiveGuaranteedIncome: 0,
        expectedCashGeneratingReturnPercent: 5,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: true,
        estimatedFireAge: 43,
        firstPrincipalDipAge: undefined
      }
    },
    {
      name: "principal preserving fails when income and yield cannot cover expenses and there is no appreciation cushion",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        annualExpenses: 60_000,
        annualPassiveGuaranteedIncome: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        expectedCashGeneratingReturnPercent: 0,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: false,
        estimatedFireAge: null,
        firstPrincipalDipAge: 40,
        firstCashShortfallAge: 40
      }
    },
    {
      name: "principal preserving cash yield scales with growing surplus assets",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 40_000,
        annualPassiveGuaranteedIncome: 20_000,
        expectedCashGeneratingReturnPercent: 4,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 40, finalGreaterThanFloor: true }
    },
    {
      name: "principal preserving inflation can eventually break the principal floor",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 55_000,
        expensesInflationAdjusted: true,
        annualPassiveGuaranteedIncome: 20_000,
        passiveGuaranteedIncomeInflationAdjusted: false,
        expectedCashGeneratingReturnPercent: 4,
        inflationRatePercent: 5
      },
      path: "principalPreserving",
      expected: {
        passes: false,
        estimatedFireAge: null,
        firstPrincipalDipAge: 44,
        firstCashShortfallAge: 42
      }
    },
    {
      name: "principal preserving inflation-adjusted income and expenses can keep floor intact",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 60_000,
        expensesInflationAdjusted: true,
        annualPassiveGuaranteedIncome: 40_000,
        passiveGuaranteedIncomeInflationAdjusted: true,
        expectedCashGeneratingReturnPercent: 4,
        inflationRatePercent: 3
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 40, firstPrincipalDipAge: undefined }
    },
    {
      name: "principal preserving evaluates a one-year horizon at the current age",
      mode: "principal_preserving",
      overrides: {
        currentAge: 40,
        lifeExpectancy: 41,
        currentFireAssets: 100_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 1_000,
        annualPassiveGuaranteedIncome: 1_000,
        expectedCashGeneratingReturnPercent: 0
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 40 }
    },
    {
      name: "principal preserving retires at the current age when income already covers expenses",
      mode: "principal_preserving",
      overrides: {
        currentAge: 45,
        lifeExpectancy: 46,
        currentFireAssets: 100_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 4_000,
        annualPassiveGuaranteedIncome: 0,
        expectedCashGeneratingReturnPercent: 4,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 45 }
    },
    {
      name: "drawdown mode still ignores cash-generating return",
      mode: "withdrawal_rate",
      overrides: {
        currentAge: 40,
        lifeExpectancy: 42,
        currentFireAssets: 0,
        annualSavingsBeforeFire: 0,
        annualExpenses: 100_000,
        annualPassiveGuaranteedIncome: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        expectedCashGeneratingReturnPercent: 99,
        inflationRatePercent: 0,
        taxMode: "none"
      },
      path: "withdrawalRate",
      expected: { targetReached: false, estimatedFireAge: null }
    },
    {
      name: "principal preserving uses detailed income override",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 100_000,
        annualPassiveGuaranteedIncome: 0,
        useIncomeSourcesOverride: true,
        incomeSources: [
          {
            id: "joint-pension",
            type: "pension",
            owner: "joint",
            annualAmount: 60_000,
            startAge: 40,
            inflationAdjusted: false
          }
        ],
        expectedCashGeneratingReturnPercent: 4,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 40, firstPrincipalDipAge: undefined }
    },
    {
      name: "principal preserving ignores simple income when detailed override is on",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 100_000,
        annualPassiveGuaranteedIncome: 100_000,
        useIncomeSourcesOverride: true,
        incomeSources: [],
        expectedCashGeneratingReturnPercent: 0,
        inflationRatePercent: 0
      },
      path: "principalPreserving",
      expected: {
        passes: false,
        estimatedFireAge: null,
        firstPrincipalDipAge: 40,
        firstCashShortfallAge: 40
      }
    },
    {
      name: "income stream ignores cash-generating yield",
      mode: "income_stream",
      overrides: {
        passiveIncomeFireAge: 40,
        annualExpenses: 100_000,
        annualPassiveGuaranteedIncome: 0,
        expectedCashGeneratingReturnPercent: 99,
        inflationRatePercent: 0
      },
      path: "incomeStream",
      expected: { passes: false, firstShortfallAge: 40, ratio: 0 }
    },
    {
      name: "principal preserving exact zero expense and zero income passes",
      mode: "principal_preserving",
      overrides: {
        currentFireAssets: 1_000_000,
        annualSavingsBeforeFire: 0,
        expectedAnnualPortfolioReturnPercent: 0,
        annualExpenses: 0,
        annualPassiveGuaranteedIncome: 0,
        expectedCashGeneratingReturnPercent: 0
      },
      path: "principalPreserving",
      expected: { passes: true, estimatedFireAge: 40, firstPrincipalDipAge: undefined, coverageRatio: 1 }
    },
    {
      name: "income stream current age near life expectancy evaluates one-year horizon",
      mode: "income_stream",
      overrides: {
        currentAge: 89,
        lifeExpectancy: 90,
        passiveIncomeFireAge: 89,
        annualExpenses: 10_000,
        annualPassiveGuaranteedIncome: 10_000
      },
      path: "incomeStream",
      expected: { passes: true, estimatedFireAge: 89, ratio: 1 }
    }
  ])("scenario: $name", ({ mode, overrides, path, expected }) => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: mode,
      taxMode: "none",
      passiveGuaranteedIncomeInflationAdjusted: false,
      expensesInflationAdjusted: false,
      useIncomeSourcesOverride: false,
      incomeSources: [],
      ...overrides
    } as Phase1FireInputs);

    const modeResult = (result as unknown as Record<string, Record<string, unknown>>)[path];

    for (const [key, value] of Object.entries(expected)) {
      if (key === "ratio") {
        expect(modeResult.incomeCoverageRatio).toBeCloseTo(value as number, 4);
      } else if (key === "coverageRatio") {
        expect(modeResult.coverageRatio).toBeCloseTo(value as number, 4);
      } else if (key === "finalGreaterThanFloor") {
        expect(modeResult.endingAssetsAtLifeExpectancy).toBeGreaterThan(
          modeResult.principalFloor as number
        );
      } else {
        expect(modeResult[key]).toEqual(value);
      }
    }
  });

  it("validates age and tax rate without requiring withdrawal rate for drawdown FIRE", () => {
    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        lifeExpectancy: 40
      })
    ).toThrow("Current age must be less than life expectancy.");

    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        simpleEffectiveTaxRatePercent: 100
      })
    ).toThrow("Simple effective tax rate must be less than 100%.");
  });

  it("validates current age and life expectancy as whole years", () => {
    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        currentAge: 40.5
      })
    ).toThrow("Current age and life expectancy must be whole years.");

    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        lifeExpectancy: 90.5
      })
    ).toThrow("Current age and life expectancy must be whole years.");
  });
});

describe("Principal-Preserving pre-FIRE return display split", () => {
  it("splits pre-FIRE growth into appreciation and cash yield without changing totals", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "principal_preserving",
      currentAge: 40,
      lifeExpectancy: 60,
      // Start below the level where yield alone covers expenses, so the plan
      // needs pre-FIRE accumulation years (which this test inspects).
      currentFireAssets: 300_000,
      annualExpenses: 30_000,
      expensesInflationAdjusted: false,
      annualPassiveGuaranteedIncome: 0,
      annualSavingsBeforeFire: 20_000,
      expectedAnnualPortfolioReturnPercent: 5,
      expectedCashGeneratingReturnPercent: 3,
      inflationRatePercent: 0,
      taxMode: "none"
    });

    const rows = result.principalPreserving.projectionRows;
    const fireYear = result.principalPreserving.estimatedYearsToFire;
    const preFireRows = rows.filter((row) => row.year < fireYear);
    expect(preFireRows.length).toBeGreaterThan(0);

    for (const row of preFireRows) {
      // Yield is reinvested pre-FIRE but still shown in its own column.
      expect(row.cashGeneratingReturn).toBeCloseTo(row.startingAssets * 0.03, 6);
      // Investment-return column is appreciation only in every year.
      expect(row.investmentReturn).toBeCloseTo(row.startingAssets * 0.05, 6);
      // Value conservation: ending = starting + appreciation + yield + savings/income.
      expect(row.endingAssets).toBeCloseTo(
        row.startingAssets +
          (row.investmentReturn ?? 0) +
          (row.cashGeneratingReturn ?? 0) +
          row.cashFlow,
        6
      );
      // Pre-FIRE income excludes the reinvested yield (no double counting).
      expect(row.annualIncome).toBe(0);
    }

    const postFireRow = rows.find((row) => row.year === fireYear);
    expect(postFireRow).toBeDefined();
    // After FIRE the yield is spendable income, not reinvested growth.
    expect(postFireRow!.annualIncome).toBeCloseTo(
      (postFireRow!.cashGeneratingReturn ?? 0),
      6
    );
  });
});
