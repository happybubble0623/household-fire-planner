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

export type Phase1FireRuleMode =
  | "withdrawal_rate"
  | "income_stream"
  | "principal_preserving"
  | "coast_fire";
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
  // Coast FIRE: the traditional retirement age the current portfolio must grow
  // into (with no further contributions) to fund retirement. Only used by the
  // coast_fire mode; ignored by the other three.
  coastRetirementAge: number;
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

// Coast FIRE: the point where current invested assets, with NO further
// contributions, will grow to the FIRE number by a traditional retirement age.
export type Phase1CoastFireResult = {
  // The FIRE number at the chosen retirement age (the tax-adjusted, inflation-
  // grown portfolio-funded spending gap at that age, capitalized at the
  // withdrawal rule — the 4% rule by default, i.e. 25x the gap).
  fireNumberAtRetirement: number;
  // The coast number TODAY: the present value of fireNumberAtRetirement
  // discounted by the expected return over the years to retirement. Reaching it
  // means current assets alone (no further saving) grow into the target.
  coastNumber: number;
  retirementAge: number;
  // Whether current assets already suffice to coast to the target.
  reachedCoast: boolean;
  // The earliest age the saver can stop contributing and still coast to the
  // target (accumulating with savings until then, returns-only afterwards).
  // null when even saving through the retirement age never reaches the target.
  coastAge: number | null;
  coastYear: number | null;
  estimatedYearsToCoast: number;
  // Where today's assets land at the retirement age with no further saving.
  projectedAssetsAtRetirement: number;
  surplusOrShortfallAtRetirement: number;
  withdrawalRatePercent: number;
  projectionRows: Phase1ProjectionRow[];
};

export type Phase1FireResult = {
  mode: Phase1FireRuleMode;
  withdrawalRate: Phase1WithdrawalRateResult;
  incomeStream: Phase1IncomeStreamResult;
  principalPreserving: Phase1PrincipalPreservingResult;
  coastFire: Phase1CoastFireResult;
};

// An optional snapshot of the healthcare calculator's result, persisted into the
// workbook so the Plan snapshot can surface a real number instead of a CTA. It
// carries the computed value plus a short basis/label describing it (so the
// reader is self-explanatory) and a capture timestamp. Being optional, its
// absence is the "no estimate yet" state and it never affects sync for users
// who haven't run the calculator (a default workbook omits it entirely).
export type Phase1HealthcareEstimate = {
  // The calculator's computed figure, in today's-dollar present value.
  amount: number;
  // Short human label describing what `amount` represents.
  basis: string;
  // ISO timestamp of when the estimate was captured from the calculator.
  capturedAt: string;
};

// ---------------------------------------------------------------------------
// Calculator state (APP-ONLY persistence)
//
// Each of the six calculators can remember its INPUTS and a small summary of its
// OUTPUTS so that returning to the tool restores the last session (and, for
// signed-in users, across devices via the existing workbook sync). Like
// `healthcareEstimate`, the whole section is OPTIONAL and absent from the
// default workbook, so a brand-new/default workbook still has no calculatorState
// and `workbookHasData(default)` stays false — reconcile + last-write-wins are
// unaffected. It rides `normalizePhase1Workbook` (spread) and
// `canonicalizeWorkbook` (key-sorted) with zero sync-code changes. On the
// WEBSITE the calculators never read or write this (gated on app mode).
//
// Input field shapes are kept to JSON primitives (string/number/boolean) plus a
// year→amount override map, deliberately decoupled from the calculation modules'
// union types so this core type file has no dependency on them. Each calculator
// narrows the stored strings back to its own unions on hydration.

export type Phase1SocialSecurityCalcInputs = {
  birthYear: number;
  workStartYear: number;
  workEndYear: number;
  startingAnnualCoveredEarnings: number;
  annualEarningsGrowthPercent: number;
  // Optional year→wage overrides keyed by year (as entered, raw strings).
  annualEarningsOverrides: Record<string, string>;
};

export type Phase1HealthcareCalcInputs = {
  household: string;
  currentAge: number;
  fireAge: number;
  medicareAge: number;
  planToAge: number;
  displayMode: string;
  annualMagi: number;
  acaPlanMode: string;
  metalTier: string;
  regionCost: string;
  benchmarkSlcspMonthly: number;
  chosenPlanMonthly: number;
  acaDeductible: number;
  acaOutOfPocketMax: number;
  acaUsage: string;
  acaCustomOop: number;
  acaInflationPercent: number;
  medicareCoverage: string;
  medigapPlanLetter: string;
  medigapMonthly: number;
  partDMonthly: number;
  advantageMonthly: number;
  medicareOutOfPocketMax: number;
  medicareUsage: string;
  medicareCustomOop: number;
  dentalVisionHearing: number;
  medicareInflationPercent: number;
  generalInflationPercent: number;
  hsaBalance: number;
  hsaGrowthPercent: number;
  hsaStrategy: string;
  travelMode: string;
  daysAbroadPerYear: number;
  travelAnnualPremium: number;
};

export type Phase1MortgageCalcInputs = {
  loanAmount: number;
  homeValue: number;
  annualInterestRatePercent: number;
  termYears: number;
  startYear: number;
  propertyTaxAnnual: number;
  homeInsuranceAnnual: number;
  pmiAnnualPercent: number;
  monthlyHoa: number;
  loanType: string;
  includeFees: boolean;
};

export type Phase1InvestmentCalcInputs = {
  startingBalance: number;
  contribution: number;
  contributionFrequency: string;
  contributionTiming: string;
  annualReturnPercent: number;
  years: number;
  feePercent: number;
};

export type Phase1ExpensesCalcInputs = {
  // Per-line amount + monthly/annual basis, keyed by expense item id.
  entries: Record<string, { amount: number; frequency: string }>;
};

export type Phase1TaxCalcInputs = {
  filingStatus: string;
  w2Wages: number;
  otherOrdinaryIncome: number;
  traditionalWithdrawals: number;
  pretaxContributions: number;
  longTermGains: number;
  children: number;
  seniors65: number;
  stateRatePercent: number;
};

// A captured calculator session: its input field values (for rehydration) plus a
// small summary of the displayed output value(s), and a capture timestamp. The
// result summary holds only JSON-primitive display values — no recomputation is
// implied; it is whatever the calculator showed when captured.
export type Phase1CalculatorResultSummary = Record<string, number | string | boolean | null>;

export type Phase1CalculatorSnapshot<TInputs> = {
  inputs: TInputs;
  result: Phase1CalculatorResultSummary;
  capturedAt: string;
};

export type Phase1CalculatorState = {
  socialSecurity?: Phase1CalculatorSnapshot<Phase1SocialSecurityCalcInputs>;
  healthcare?: Phase1CalculatorSnapshot<Phase1HealthcareCalcInputs>;
  mortgage?: Phase1CalculatorSnapshot<Phase1MortgageCalcInputs>;
  investment?: Phase1CalculatorSnapshot<Phase1InvestmentCalcInputs>;
  expenses?: Phase1CalculatorSnapshot<Phase1ExpensesCalcInputs>;
  tax?: Phase1CalculatorSnapshot<Phase1TaxCalcInputs>;
};

export type Phase1CalculatorKey = keyof Phase1CalculatorState;

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
  // Optional captured result from the healthcare calculator (Plan snapshot tile).
  healthcareEstimate?: Phase1HealthcareEstimate;
  // Optional per-calculator saved inputs + result summaries (app-only). Absent on
  // a default workbook so it never affects sync for users who haven't used a
  // calculator in the app.
  calculatorState?: Phase1CalculatorState;
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
