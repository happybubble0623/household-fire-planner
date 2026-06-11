import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.string();

const exactTimingRuleSchema = z.object({
  type: z.literal("exact_date"),
  date: isoDate
});

const relativeTimingRuleSchema = z.object({
  type: z.literal("relative_event"),
  eventId: z.string(),
  offsetValue: z.number(),
  offsetUnit: z.enum(["months", "years"]),
  direction: z.enum(["before", "after"])
});

export const timingRuleSchema = z.discriminatedUnion("type", [
  exactTimingRuleSchema,
  relativeTimingRuleSchema
]);

const personProfileSchema = z.object({
  id: z.string(),
  label: z.string(),
  birthDate: isoDate.optional(),
  currentAge: z.number().optional(),
  lifeExpectancy: z.number().positive(),
  isPrimary: z.boolean()
});

const portfolioGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional()
});

const quantitySnapshotSchema = z.object({
  id: z.string(),
  effectiveDate: isoDate,
  quantity: z.number(),
  source: z.literal("manual"),
  notes: z.string().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
});

const manualPriceOverrideSchema = z.object({
  id: z.string(),
  priceDate: isoDate,
  price: z.number().nonnegative(),
  notes: z.string().optional(),
  createdAt: isoDateTime
});

const taxBucketSchema = z.enum([
  "taxable",
  "tax_deferred",
  "tax_free",
  "cash",
  "real_estate",
  "custom"
]);

const marketPositionSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string().optional(),
  assetType: z.enum(["stock", "etf", "mutual_fund", "crypto"]),
  portfolioGroupId: z.string().optional(),
  includedInFire: z.boolean(),
  taxBucket: taxBucketSchema.optional(),
  notes: z.string().optional(),
  quantitySnapshots: z.array(quantitySnapshotSchema),
  manualPriceOverrides: z.array(manualPriceOverrideSchema).optional()
});

const balanceSnapshotSchema = z.object({
  id: z.string(),
  effectiveDate: isoDate,
  balance: z.number(),
  notes: z.string().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
});

const cashAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  portfolioGroupId: z.string().optional(),
  includedInFire: z.boolean(),
  taxBucket: z.literal("cash"),
  balanceSnapshots: z.array(balanceSnapshotSchema)
});

const valuationSnapshotSchema = z.object({
  id: z.string(),
  effectiveDate: isoDate,
  value: z.number(),
  notes: z.string().optional(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime
});

const manualAssetSchema = z.object({
  id: z.string(),
  name: z.string(),
  assetType: z.enum(["home", "vehicle", "private_equity", "other"]),
  portfolioGroupId: z.string().optional(),
  includedInFire: z.boolean(),
  valuationSnapshots: z.array(valuationSnapshotSchema),
  notes: z.string().optional()
});

const liabilityAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  liabilityType: z.enum([
    "mortgage",
    "credit_card",
    "student_loan",
    "auto_loan",
    "personal_loan",
    "other"
  ]),
  includedInNetWorth: z.boolean(),
  balanceSnapshots: z.array(balanceSnapshotSchema),
  notes: z.string().optional()
});

const fireAssumptionsSchema = z.object({
  withdrawalRate: z.number().positive(),
  globalInflationRate: z.number(),
  annualSavings: z.number(),
  retirementDate: isoDate.optional(),
  targetRetirementAge: z.number().optional(),
  fireAssetBasis: z.enum(["investable_only", "total_net_worth", "custom"]),
  includeHomeEquity: z.boolean(),
  fireRuleMode: z.enum(["withdrawal_rate", "income_stream", "income_only"])
});

const planningAllocationSchema = z
  .object({
    stockPercent: z.number().min(0).max(100),
    bondEquivalentPercent: z.number().min(0).max(100),
    cashPercent: z.number().min(0).max(100),
    rebalanceFrequency: z.literal("annual")
  })
  .refine(
    (allocation) =>
      allocation.stockPercent + allocation.bondEquivalentPercent + allocation.cashPercent === 100,
    "Stock + Bond Equivalent + Cash must equal 100%."
  );

const planningEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  eventType: z.enum([
    "retirement_date",
    "social_security_claiming_date",
    "healthcare_transition",
    "mortgage_payoff_date",
    "debt_payoff_date",
    "home_sale_date",
    "custom"
  ]),
  timing: timingRuleSchema
});

const recurringExpenseSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.string(),
  amount: z.number().nonnegative(),
  frequency: z.enum(["monthly", "annual"]),
  startTiming: timingRuleSchema,
  endTiming: timingRuleSchema.optional(),
  inflationAdjusted: z.boolean(),
  isEssential: z.boolean(),
  includedInFirePath: z.boolean()
});

const retirementIncomeStreamSchema = z.object({
  id: z.string(),
  name: z.string(),
  incomeType: z.enum([
    "social_security",
    "pension",
    "rental",
    "part_time_work",
    "business",
    "portfolio_income",
    "dividend",
    "interest",
    "annuity",
    "other"
  ]),
  incomeCategory: z.enum(["guaranteed", "passive", "earned", "portfolio_income", "other"]),
  amount: z.number().nonnegative(),
  frequency: z.enum(["monthly", "annual"]),
  startTiming: timingRuleSchema,
  endTiming: z.union([timingRuleSchema, z.literal("lifetime")]).optional(),
  inflationAdjusted: z.boolean(),
  taxable: z.boolean(),
  includedInFirePath: z.boolean(),
  personId: z.string().optional()
});

const socialSecurityEstimateSchema = z.object({
  id: z.string(),
  personId: z.string(),
  entryMode: z.enum(["direct_entry", "formula_calculator"]),
  monthlyBenefitTodayDollars: z.number().optional(),
  birthYear: z.number().optional(),
  claimingAge: z.number().optional(),
  workStartYear: z.number().optional(),
  workEndYear: z.number().optional(),
  currentAnnualCoveredEarnings: z.number().optional(),
  assumedAnnualEarningsGrowth: z.number().optional(),
  annualEarningsByYear: z.record(z.string(), z.number()).optional(),
  estimatedAime: z.number().optional(),
  estimatedPia: z.number().optional(),
  estimatedMonthlyBenefitTodayDollars: z.number().optional(),
  estimatedMonthlyBenefitFutureDollars: z.number().optional(),
  claimingTiming: timingRuleSchema,
  inflationAdjusted: z.boolean(),
  includedInFirePlan: z.boolean()
});

const taxSettingsSchema = z.object({
  mode: z.enum(["none", "simple_blended", "account_level"]),
  simpleEffectiveTaxRate: z.number().min(0).max(0.99).optional(),
  accountWithdrawalMethod: z.literal("pro_rata"),
  accountTaxRates: z
    .object({
      taxable: z.number(),
      tax_deferred: z.number(),
      tax_free: z.number(),
      cash: z.number(),
      real_estate: z.number(),
      custom: z.number()
    })
    .optional()
});

const projectionResultSchema = z.object({
  simpleFireNumber: z.number(),
  simpleFireAgeEstimate: z.string().optional(),
  deterministicFireAgeEstimate: z.string().optional(),
  monteCarloFireAgeEstimate: z.string().optional(),
  notes: z.array(z.string()).optional()
});

const savedPathSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean(),
  isArchived: z.boolean(),
  assumptions: fireAssumptionsSchema,
  planningEvents: z.array(planningEventSchema),
  expenses: z.array(recurringExpenseSchema),
  incomeStreams: z.array(retirementIncomeStreamSchema),
  socialSecurity: z.array(socialSecurityEstimateSchema),
  taxSettings: taxSettingsSchema,
  allocation: planningAllocationSchema,
  latestResult: projectionResultSchema.optional()
});

const cachedNetWorthSnapshotSchema = z.object({
  id: z.string(),
  snapshotDate: isoDate,
  totalAssets: z.number(),
  totalLiabilities: z.number(),
  netWorth: z.number(),
  source: z.literal("calculated"),
  calculatedAt: isoDateTime,
  invalidatedAt: isoDateTime.optional()
});

export const planDocumentSchema = z.object({
  schemaVersion: z.literal("1.4"),
  id: z.string(),
  title: z.string(),
  createdAt: isoDateTime,
  updatedAt: isoDateTime,
  settings: z.object({
    currency: z.literal("USD"),
    planningMode: z.enum(["individual", "family"]),
    defaultSavedPathId: z.string().nullable()
  }),
  people: z.array(personProfileSchema),
  portfolioGroups: z.array(portfolioGroupSchema),
  marketPositions: z.array(marketPositionSchema),
  cashAccounts: z.array(cashAccountSchema),
  manualAssets: z.array(manualAssetSchema),
  liabilityAccounts: z.array(liabilityAccountSchema),
  savedPaths: z.array(savedPathSchema),
  cachedNetWorthSnapshots: z.array(cachedNetWorthSnapshotSchema).optional()
});
