export type CurrencyCode = "USD";

export type PlanningMode = "individual" | "family";

export type FireRuleMode = "withdrawal_rate" | "income_stream" | "income_only";

export type TaxBucket =
  | "taxable"
  | "tax_deferred"
  | "tax_free"
  | "cash"
  | "real_estate"
  | "custom";

export type PlanDocument = {
  schemaVersion: "1.4";
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  settings: {
    currency: CurrencyCode;
    planningMode: PlanningMode;
    defaultSavedPathId: string | null;
  };
  people: PersonProfile[];
  portfolioGroups: PortfolioGroup[];
  marketPositions: MarketPosition[];
  cashAccounts: CashAccount[];
  manualAssets: ManualAsset[];
  liabilityAccounts: LiabilityAccount[];
  savedPaths: SavedPath[];
  cachedNetWorthSnapshots?: CachedNetWorthSnapshot[];
};

export type PersonProfile = {
  id: string;
  label: string;
  birthDate?: string;
  currentAge?: number;
  lifeExpectancy: number;
  isPrimary: boolean;
};

export type PortfolioGroup = {
  id: string;
  name: string;
  description?: string;
};

export type MarketPosition = {
  id: string;
  symbol: string;
  name?: string;
  assetType: "stock" | "etf" | "mutual_fund" | "crypto";
  portfolioGroupId?: string;
  includedInFire: boolean;
  taxBucket?: TaxBucket;
  notes?: string;
  quantitySnapshots: QuantitySnapshot[];
  manualPriceOverrides?: ManualPriceOverride[];
};

export type QuantitySnapshot = {
  id: string;
  effectiveDate: string;
  quantity: number;
  source: "manual";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ManualPriceOverride = {
  id: string;
  priceDate: string;
  price: number;
  notes?: string;
  createdAt: string;
};

export type CashAccount = {
  id: string;
  name: string;
  portfolioGroupId?: string;
  includedInFire: boolean;
  taxBucket: "cash";
  balanceSnapshots: BalanceSnapshot[];
};

export type ManualAsset = {
  id: string;
  name: string;
  assetType: "home" | "vehicle" | "private_equity" | "other";
  portfolioGroupId?: string;
  includedInFire: boolean;
  valuationSnapshots: ValuationSnapshot[];
  notes?: string;
};

export type LiabilityAccount = {
  id: string;
  name: string;
  liabilityType:
    | "mortgage"
    | "credit_card"
    | "student_loan"
    | "auto_loan"
    | "personal_loan"
    | "other";
  includedInNetWorth: boolean;
  balanceSnapshots: BalanceSnapshot[];
  notes?: string;
};

export type BalanceSnapshot = {
  id: string;
  effectiveDate: string;
  balance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ValuationSnapshot = {
  id: string;
  effectiveDate: string;
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CachedNetWorthSnapshot = {
  id: string;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  source: "calculated";
  calculatedAt: string;
  invalidatedAt?: string;
};

export type SavedPath = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;
  assumptions: FireAssumptions;
  planningEvents: PlanningEvent[];
  expenses: RecurringExpense[];
  incomeStreams: RetirementIncomeStream[];
  socialSecurity: SocialSecurityEstimate[];
  taxSettings: TaxSettings;
  allocation: PlanningAllocation;
  latestResult?: ProjectionResult;
};

export type FireAssumptions = {
  withdrawalRate: number;
  globalInflationRate: number;
  annualSavings: number;
  retirementDate?: string;
  targetRetirementAge?: number;
  fireAssetBasis: "investable_only" | "total_net_worth" | "custom";
  includeHomeEquity: boolean;
  fireRuleMode: FireRuleMode;
};

export type PlanningAllocation = {
  stockPercent: number;
  bondEquivalentPercent: number;
  cashPercent: number;
  rebalanceFrequency: "annual";
};

export type TimingRule =
  | {
      type: "exact_date";
      date: string;
    }
  | {
      type: "relative_event";
      eventId: string;
      offsetValue: number;
      offsetUnit: "months" | "years";
      direction: "before" | "after";
    };

export type PlanningEvent = {
  id: string;
  name: string;
  eventType:
    | "retirement_date"
    | "social_security_claiming_date"
    | "healthcare_transition"
    | "mortgage_payoff_date"
    | "debt_payoff_date"
    | "home_sale_date"
    | "custom";
  timing: TimingRule;
};

export type RecurringExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: "monthly" | "annual";
  startTiming: TimingRule;
  endTiming?: TimingRule;
  inflationAdjusted: boolean;
  isEssential: boolean;
  includedInFirePath: boolean;
};

export type RetirementIncomeStream = {
  id: string;
  name: string;
  incomeType:
    | "social_security"
    | "pension"
    | "rental"
    | "part_time_work"
    | "business"
    | "portfolio_income"
    | "dividend"
    | "interest"
    | "annuity"
    | "other";
  incomeCategory: "guaranteed" | "passive" | "earned" | "portfolio_income" | "other";
  amount: number;
  frequency: "monthly" | "annual";
  startTiming: TimingRule;
  endTiming?: TimingRule | "lifetime";
  inflationAdjusted: boolean;
  taxable: boolean;
  includedInFirePath: boolean;
  personId?: string;
};

export type SocialSecurityEstimate = {
  id: string;
  personId: string;
  entryMode: "direct_entry" | "formula_calculator";
  monthlyBenefitTodayDollars?: number;
  birthYear?: number;
  claimingAge?: number;
  workStartYear?: number;
  workEndYear?: number;
  currentAnnualCoveredEarnings?: number;
  assumedAnnualEarningsGrowth?: number;
  annualEarningsByYear?: Record<string, number>;
  estimatedAime?: number;
  estimatedPia?: number;
  estimatedMonthlyBenefitTodayDollars?: number;
  estimatedMonthlyBenefitFutureDollars?: number;
  claimingTiming: TimingRule;
  inflationAdjusted: boolean;
  includedInFirePlan: boolean;
};

export type TaxSettings = {
  mode: "none" | "simple_blended" | "account_level";
  simpleEffectiveTaxRate?: number;
  accountWithdrawalMethod: "pro_rata";
  accountTaxRates?: {
    taxable: number;
    tax_deferred: number;
    tax_free: number;
    cash: number;
    real_estate: number;
    custom: number;
  };
};

export type ProjectionResult = {
  simpleFireNumber: number;
  simpleFireAgeEstimate?: string;
  deterministicFireAgeEstimate?: string;
  monteCarloFireAgeEstimate?: string;
  notes?: string[];
};
