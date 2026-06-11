import type { Phase1Workbook } from "@/types/phase1";

export const defaultPhase1Workbook: Phase1Workbook = {
  id: "phase1-default",
  schemaVersion: "phase1.7",
  updatedAt: new Date("2026-06-08T00:00:00.000Z").toISOString(),
  fireInputs: {
    currentAge: 40,
    lifeExpectancy: 90,
    passiveIncomeFireAge: 60,
    fireRuleMode: "withdrawal_rate",
    currentFireAssets: 0,
    annualExpenses: 100_000,
    expensesInflationAdjusted: true,
    useExpenseCategoriesOverride: false,
    expenseCategories: [],
    annualPassiveGuaranteedIncome: 0,
    passiveGuaranteedIncomeInflationAdjusted: true,
    useIncomeSourcesOverride: false,
    incomeSources: [],
    annualSavingsBeforeFire: 50_000,
    expectedAnnualPortfolioReturnPercent: 6,
    expectedCashGeneratingReturnPercent: 2,
    inflationRatePercent: 3,
    withdrawalRatePercent: 4,
    taxMode: "none",
    simpleEffectiveTaxRatePercent: 0,
    homeSaleAge: 0,
    homeSaleProceeds: 0
  },
  portfolioItems: [],
  portfolioCollections: [],
  portfolioCollectionMemberships: []
};
