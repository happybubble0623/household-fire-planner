import { addMonths, addYears, differenceInCalendarMonths, parseISO } from "date-fns";
import type {
  PlanDocument,
  PlanningEvent,
  PlanningAllocation,
  RecurringExpense,
  RetirementIncomeStream,
  SavedPath,
  TaxSettings,
  TimingRule
} from "@/types/plan";
import type { CandidateFireResult } from "@/types/calculations";
import { calculateFireAssetValueAsOf } from "@/lib/calculations/net-worth";

const CONSERVATIVE_WARNING =
  "This path uses 50% or more in Bond Equivalent and Cash / T-Bills. This may reduce market volatility, but it may also lower long-term growth. A lower-growth allocation can require a larger FIRE number, higher savings, lower spending, or a later retirement date.";

export function toAnnualAmount(amount: number, frequency: "monthly" | "annual") {
  return frequency === "monthly" ? amount * 12 : amount;
}

export function calculateSimpleFireNumber(
  annualExpenses: number,
  annualIncome: number,
  withdrawalRate = 0.04
) {
  const gap = Math.max(0, annualExpenses - annualIncome);
  return gap / withdrawalRate;
}

export function taxAdjustedWithdrawal(
  afterTaxGap: number,
  taxSettings: TaxSettings,
  accountLevelEffectiveTaxRate?: number
) {
  if (taxSettings.mode === "none") {
    return afterTaxGap;
  }

  const rate =
    taxSettings.mode === "account_level"
      ? accountLevelEffectiveTaxRate ?? 0
      : taxSettings.simpleEffectiveTaxRate ?? 0;
  if (rate <= 0) return afterTaxGap;
  if (rate >= 1) throw new Error("Effective tax rate must be less than 100%.");
  return afterTaxGap / (1 - rate);
}

export function calculateAccountLevelEffectiveTaxRate(
  plan: PlanDocument,
  date: string,
  accountTaxRates: NonNullable<TaxSettings["accountTaxRates"]>
) {
  const bucketValues = new Map<keyof typeof accountTaxRates, number>();

  for (const position of plan.marketPositions) {
    if (!position.includedInFire) continue;
    const bucket = position.taxBucket ?? "custom";
    const quantitySnapshot = position.quantitySnapshots
      .filter((snapshot) => snapshot.effectiveDate <= date)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
    const price = position.manualPriceOverrides
      ?.filter((override) => override.priceDate <= date)
      .sort((a, b) => b.priceDate.localeCompare(a.priceDate))[0];
    if (!quantitySnapshot || !price) continue;
    bucketValues.set(bucket, (bucketValues.get(bucket) ?? 0) + quantitySnapshot.quantity * price.price);
  }

  for (const cash of plan.cashAccounts) {
    if (!cash.includedInFire) continue;
    const snapshot = cash.balanceSnapshots
      .filter((item) => item.effectiveDate <= date)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
    if (!snapshot) continue;
    bucketValues.set("cash", (bucketValues.get("cash") ?? 0) + snapshot.balance);
  }

  for (const asset of plan.manualAssets) {
    if (!asset.includedInFire) continue;
    const snapshot = asset.valuationSnapshots
      .filter((item) => item.effectiveDate <= date)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0];
    if (!snapshot) continue;
    bucketValues.set("real_estate", (bucketValues.get("real_estate") ?? 0) + snapshot.value);
  }

  const total = [...bucketValues.values()].reduce((sum, value) => sum + value, 0);
  if (total <= 0) return 0;

  return [...bucketValues.entries()].reduce(
    (rate, [bucket, value]) => rate + (value / total) * accountTaxRates[bucket],
    0
  );
}

export function getConservativeAllocationWarning(allocation: PlanningAllocation) {
  return allocation.bondEquivalentPercent + allocation.cashPercent >= 50
    ? CONSERVATIVE_WARNING
    : null;
}

export async function evaluateCandidateRetirementDate(
  plan: PlanDocument,
  savedPath: SavedPath,
  candidateRetirementDate: string,
  projectionMode: "deterministic" | "monte_carlo"
): Promise<CandidateFireResult> {
  switch (savedPath.assumptions.fireRuleMode) {
    case "income_stream":
    case "income_only":
      return evaluateIncomeStreamCandidate(savedPath, candidateRetirementDate, projectionMode);
    case "withdrawal_rate":
    default:
      return evaluateWithdrawalRateCandidate(
        plan,
        savedPath,
        candidateRetirementDate,
        projectionMode
      );
  }
}

async function evaluateWithdrawalRateCandidate(
  plan: PlanDocument,
  savedPath: SavedPath,
  candidateRetirementDate: string,
  projectionMode: "deterministic" | "monte_carlo"
): Promise<CandidateFireResult> {
  const horizonMonths = getPlanningHorizonMonths(plan, candidateRetirementDate);
  const monthlyReturn = Math.pow(1 + estimateAnnualReturn(savedPath.allocation), 1 / 12) - 1;
  // The portfolio compounds at a NOMINAL return, so spending (and inflation-
  // adjusted income) must grow with inflation over time to stay consistent with
  // the Monte-Carlo and phase-1 engines. Each expense/income honors its own
  // `inflationAdjusted` flag; flat items stay level. Without this the evaluator
  // overstates survival and two plans differing only in that flag would produce
  // identical results.
  const monthlyInflation =
    Math.pow(1 + (savedPath.assumptions.globalInflationRate ?? 0), 1 / 12) - 1;
  let portfolio = await calculateFireAssetValueAsOf(plan, candidateRetirementDate);
  const accountLevelEffectiveTaxRate =
    savedPath.taxSettings.mode === "account_level" && savedPath.taxSettings.accountTaxRates
      ? calculateAccountLevelEffectiveTaxRate(
          plan,
          candidateRetirementDate,
          savedPath.taxSettings.accountTaxRates
        )
      : undefined;
  let totalWithdrawals = 0;
  let currentDate = parseISO(`${candidateRetirementDate}T00:00:00.000Z`);

  for (let month = 0; month <= horizonMonths; month += 1) {
    const date = currentDate.toISOString().slice(0, 10);
    // Months elapsed since retirement drive the inflation factor applied to
    // inflation-adjusted expenses and income.
    const inflationFactor = Math.pow(1 + monthlyInflation, month);
    const annualExpenses = getAnnualExpensesForDate(
      savedPath.expenses,
      date,
      savedPath.planningEvents,
      inflationFactor
    );
    const annualIncome = getAnnualIncomeForDate(
      savedPath.incomeStreams,
      date,
      savedPath.planningEvents,
      { includeEarned: true },
      inflationFactor
    );
    const afterTaxGap = Math.max(0, annualExpenses - annualIncome);
    const grossWithdrawal = taxAdjustedWithdrawal(
      afterTaxGap / 12,
      savedPath.taxSettings,
      accountLevelEffectiveTaxRate
    );

    portfolio -= grossWithdrawal;
    totalWithdrawals += grossWithdrawal;

    if (portfolio < 0) {
      return {
        fireRuleMode: "withdrawal_rate",
        projectionMode,
        passes: false,
        candidateRetirementDate,
        failureDate: date,
        endingBalance: portfolio,
        totalWithdrawals
      };
    }

    portfolio *= 1 + monthlyReturn;
    currentDate = addMonths(currentDate, 1);
  }

  return {
    fireRuleMode: "withdrawal_rate",
    projectionMode,
    passes: true,
    candidateRetirementDate,
    endingBalance: portfolio,
    totalWithdrawals
  };
}

function evaluateIncomeStreamCandidate(
  savedPath: SavedPath,
  candidateRetirementDate: string,
  projectionMode: "deterministic" | "monte_carlo"
): CandidateFireResult {
  const annualExpenses = getAnnualExpensesForDate(
    savedPath.expenses,
    candidateRetirementDate,
    savedPath.planningEvents
  );
  const annualPassiveOrGuaranteedIncome = getAnnualIncomeForDate(
    savedPath.incomeStreams,
    candidateRetirementDate,
    savedPath.planningEvents,
    {
      includeEarned: false
    }
  );
  const incomeCoverageRatio =
    annualExpenses === 0 ? 1 : annualPassiveOrGuaranteedIncome / annualExpenses;

  return {
    fireRuleMode: savedPath.assumptions.fireRuleMode === "income_only" ? "income_only" : "income_stream",
    projectionMode,
    passes: incomeCoverageRatio >= 1,
    candidateRetirementDate,
    failureDate: incomeCoverageRatio >= 1 ? undefined : candidateRetirementDate,
    incomeCoverageRatio,
    annualPassiveOrGuaranteedIncome,
    annualExpenses
  };
}

function getAnnualExpensesForDate(
  expenses: RecurringExpense[],
  date: string,
  planningEvents: PlanningEvent[],
  inflationFactor = 1
) {
  return expenses
    .filter(
      (expense) =>
        expense.includedInFirePath &&
        isTimingWindowActive(expense.startTiming, expense.endTiming, planningEvents, date)
    )
    .reduce((sum, expense) => {
      const factor = expense.inflationAdjusted ? inflationFactor : 1;
      return sum + toAnnualAmount(expense.amount, expense.frequency) * factor;
    }, 0);
}

function getAnnualIncomeForDate(
  incomeStreams: RetirementIncomeStream[],
  date: string,
  planningEvents: PlanningEvent[],
  options: { includeEarned: boolean },
  inflationFactor = 1
) {
  return incomeStreams
    .filter((stream) => {
      if (!stream.includedInFirePath) return false;
      if (!isTimingWindowActive(stream.startTiming, stream.endTiming, planningEvents, date)) return false;
      if (!options.includeEarned && !["guaranteed", "passive"].includes(stream.incomeCategory)) {
        return false;
      }
      return true;
    })
    .reduce((sum, stream) => {
      const factor = stream.inflationAdjusted ? inflationFactor : 1;
      return sum + toAnnualAmount(stream.amount, stream.frequency) * factor;
    }, 0);
}

function isTimingWindowActive(
  startTiming: TimingRule,
  endTiming: TimingRule | "lifetime" | undefined,
  planningEvents: PlanningEvent[],
  targetDate: string
) {
  const startDate = resolveTimingDate(startTiming, planningEvents);
  if (startDate && targetDate < startDate) return false;

  if (!endTiming || endTiming === "lifetime") return true;

  const endDate = resolveTimingDate(endTiming, planningEvents);
  if (!endDate) return true;

  return targetDate <= endDate;
}

export function resolveTimingDate(
  timing: TimingRule,
  planningEvents: PlanningEvent[]
): string | undefined {
  if (timing.type === "exact_date") return timing.date;

  const event = planningEvents.find((item) => item.id === timing.eventId);
  if (!event) return undefined;

  const eventDate = resolveTimingDate(event.timing, planningEvents);
  if (!eventDate) return undefined;

  const parsed = parseISO(`${eventDate}T00:00:00.000Z`);
  const direction = timing.direction === "before" ? -1 : 1;
  const resolved =
    timing.offsetUnit === "years"
      ? addYears(parsed, direction * timing.offsetValue)
      : addMonths(parsed, direction * timing.offsetValue);

  return resolved.toISOString().slice(0, 10);
}

function estimateAnnualReturn(allocation: PlanningAllocation) {
  return (
    allocation.stockPercent * 0.07 +
    allocation.bondEquivalentPercent * 0.035 +
    allocation.cashPercent * 0.02
  ) / 100;
}

function getPlanningHorizonMonths(plan: PlanDocument, candidateRetirementDate: string) {
  const primaryPerson = plan.people.find((person) => person.isPrimary) ?? plan.people[0];
  if (!primaryPerson?.birthDate) {
    return 30 * 12;
  }

  const birthYear = Number(primaryPerson.birthDate.slice(0, 4));
  const horizonDate = `${birthYear + primaryPerson.lifeExpectancy}-01-01`;
  return Math.max(
    0,
    differenceInCalendarMonths(
      parseISO(`${horizonDate}T00:00:00.000Z`),
      parseISO(`${candidateRetirementDate}T00:00:00.000Z`)
    )
  );
}
