export type Phase1AssetType =
  | "stock"
  | "etf"
  | "mutual_fund"
  | "crypto"
  | "bond"
  | "option"
  | "cash"
  | "home"
  | "liability"
  | "other_asset";

export type Phase1FireRuleMode = "withdrawal_rate" | "income_stream" | "principal_preserving";
export type Phase1TaxMode = "none" | "simple";
export type Phase1PriceStatus = "manual" | "refreshed" | "unsupported" | "failed";
export type Phase1IncomeSourceType =
  | "social_security"
  | "rental_income"
  | "pension"
  | "annuity"
  | "part_time_income"
  | "other";
export type Phase1IncomeSourceOwner = "user_1" | "user_2" | "joint" | "child" | "household";
export type Phase1ExpenseCategoryType =
  | "housing"
  | "healthcare"
  | "insurance"
  | "food"
  | "transportation"
  | "travel"
  | "taxes"
  | "childcare_education"
  | "debt"
  | "living"
  | "other";

export type Phase1ExpenseCategory = {
  id: string;
  type: Phase1ExpenseCategoryType;
  label?: string;
  annualAmount: number;
  startAge: number;
  endAge?: number;
  inflationAdjusted: boolean;
};

export type Phase1IncomeSource = {
  id: string;
  type: Phase1IncomeSourceType;
  owner: Phase1IncomeSourceOwner;
  label?: string;
  annualAmount: number;
  startAge: number;
  endAge?: number;
  inflationAdjusted: boolean;
};

export type Phase1PortfolioItem = {
  id: string;
  type: Phase1AssetType;
  name: string;
  symbol?: string;
  accountOwner?: string;
  accountName?: string;
  accountType?: string;
  taxBucket: string;
  includedInFire: boolean;
  unitPrice?: number;
  units?: number;
  balance: number;
  customGroup?: string;
  priceStatus?: Phase1PriceStatus;
  priceDate?: string;
  priceWarning?: string;
};

export type Phase1PortfolioCollection = {
  id: string;
  name: string;
  purpose?: string;
  targetMinPercent?: number;
  targetMaxPercent?: number;
  createdAt: string;
  updatedAt: string;
};

export type Phase1PortfolioCollectionMembership = {
  collectionId: string;
  portfolioItemId: string;
};

export type Phase1FireInputs = {
  currentAge: number;
  lifeExpectancy: number;
  passiveIncomeFireAge: number;
  fireRuleMode: Phase1FireRuleMode;
  currentFireAssets: number;
  annualExpenses: number;
  expensesInflationAdjusted: boolean;
  useExpenseCategoriesOverride: boolean;
  expenseCategories: Phase1ExpenseCategory[];
  annualPassiveGuaranteedIncome: number;
  passiveGuaranteedIncomeInflationAdjusted: boolean;
  useIncomeSourcesOverride: boolean;
  incomeSources: Phase1IncomeSource[];
  annualSavingsBeforeFire: number;
  expectedAnnualPortfolioReturnPercent: number;
  expectedCashGeneratingReturnPercent: number;
  inflationRatePercent: number;
  withdrawalRatePercent: number;
  taxMode: Phase1TaxMode;
  simpleEffectiveTaxRatePercent: number;
  // One-time home/real-estate sale added to liquid FIRE assets at the given age.
  // Proceeds of 0 means no planned sale. Real estate is otherwise excluded.
  homeSaleAge: number;
  homeSaleProceeds: number;
};

export type Phase1ProjectionRow = {
  year: number;
  calendarYear: number;
  age: number;
  startingAssets: number;
  cashFlow: number;
  annualIncome?: number;
  annualExpenses?: number;
  cashGeneratingReturn?: number;
  investmentReturn?: number;
  assetsWithdrawn?: number;
  homeSaleInflow?: number;
  fireTarget?: number;
  incomeCoverageRatio?: number;
  principalFloor?: number;
  principalPreserved?: boolean;
  fireGap: number;
  endingAssets: number;
  depleted: boolean;
};

export type Phase1WithdrawalRateResult = {
  annualPortfolioFundedSpendingGap: number;
  taxAdjustedAnnualSpendingGap: number;
  simpleFireNumber: number | null;
  targetFireNumber: number | null;
  fireGap: number;
  targetReached: boolean;
  projectedFireAssets: number;
  estimatedYearsToFire: number;
  estimatedFireAge: number | null;
  estimatedFireYear: number | null;
  assetsAtFire: number;
  firstYearPortfolioDraw: number;
  impliedWithdrawalRate: number | null;
  deterministicPasses: boolean;
  endingBalanceAtLifeExpectancy: number;
  firstFailureAge?: number;
  projectionRows: Phase1ProjectionRow[];
};

export type Phase1IncomeStreamResult = {
  incomeCoverageRatio: number;
  annualPassiveGuaranteedIncome: number;
  annualExpenses: number;
  passes: boolean;
  estimatedFireAge: number | null;
  shortfallOrSurplus: number;
  firstShortfallAge?: number;
  projectionRows: Phase1ProjectionRow[];
};

export type Phase1PrincipalPreservingResult = {
  coverageRatio: number;
  spendableIncome: number;
  annualCashGeneratingReturn: number;
  annualPassiveGuaranteedIncome: number;
  annualExpenses: number;
  passes: boolean;
  estimatedFireAge: number | null;
  estimatedFireYear: number | null;
  estimatedYearsToFire: number;
  assetsAtFire: number;
  principalFloor: number;
  shortfallOrSurplus: number;
  firstCashShortfallAge?: number;
  firstPrincipalDipAge?: number;
  endingAssetsAtLifeExpectancy: number;
  projectionRows: Phase1ProjectionRow[];
};

export type Phase1FireResult = {
  mode: Phase1FireRuleMode;
  withdrawalRate: Phase1WithdrawalRateResult;
  incomeStream: Phase1IncomeStreamResult;
  principalPreserving: Phase1PrincipalPreservingResult;
};

export type Phase1Workbook = {
  id: "phase1-default";
  schemaVersion: "phase1.7";
  updatedAt: string;
  fireInputs: Phase1FireInputs;
  portfolioItems: Phase1PortfolioItem[];
  portfolioCollections: Phase1PortfolioCollection[];
  portfolioCollectionMemberships: Phase1PortfolioCollectionMembership[];
  lastEodRefreshAt?: string;
  lastImportExportStatus?: string;
};

export type PortfolioImportRowError = {
  rowNumber: number;
  message: string;
};

export type PortfolioImportResult = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
  errors: PortfolioImportRowError[];
};
