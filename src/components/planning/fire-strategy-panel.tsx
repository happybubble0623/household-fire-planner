"use client";

import { useState } from "react";
import Link from "next/link";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { StrategyCashFlowChart } from "@/components/charts/calculator-charts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { cn } from "@/lib/utils";
import { PLANNING_TOOLS } from "@/lib/data/planning-tools";
import type {
  Phase1ExpenseCategory,
  Phase1ExpenseCategoryType,
  Phase1FireInputs,
  Phase1FireRuleMode,
  Phase1IncomeSource,
  Phase1IncomeSourceOwner,
  Phase1IncomeSourceType,
  Phase1ProjectionRow,
  Phase1TaxMode
} from "@/types/phase1";

const fireInputErrorId = "fire-input-error";

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 1
});

const percentFormatter = new Intl.NumberFormat(undefined, {
  style: "percent",
  maximumFractionDigits: 1
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatSignedCurrency(value: number) {
  const formatted = formatCurrency(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

// Compact currency for the dense projection tables only (NOT the KPI cards):
// trims values to ~3 significant figures with a $k / $M / $B unit so more
// columns fit on a narrow phone without horizontal scrolling.
// e.g. 50000 -> $50k, 1_250_000 -> $1.25M, 482_500 -> $483k.
function trimToSignificant(value: number) {
  const decimals = value >= 100 ? 0 : value >= 10 ? 1 : 2;
  return Number(value.toFixed(decimals)).toString();
}

function formatCompactCurrencyAbs(value: number) {
  if (value < 1000) {
    return `$${Math.round(value)}`;
  }
  if (value < 1_000_000) {
    return `$${trimToSignificant(value / 1000)}k`;
  }
  if (value < 1_000_000_000) {
    return `$${trimToSignificant(value / 1_000_000)}M`;
  }
  return `$${trimToSignificant(value / 1_000_000_000)}B`;
}

function formatCompactCurrency(value: number) {
  if (value < 0) return `-${formatCompactCurrencyAbs(-value)}`;
  return formatCompactCurrencyAbs(value);
}

function formatSignedCompactCurrency(value: number) {
  if (value > 0) return `+${formatCompactCurrencyAbs(value)}`;
  if (value < 0) return `-${formatCompactCurrencyAbs(-value)}`;
  return formatCompactCurrencyAbs(0);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPercent(value: number) {
  return percentFormatter.format(value);
}

type NumericFireInputKey = {
  [Key in keyof Phase1FireInputs]: Phase1FireInputs[Key] extends number ? Key : never;
}[keyof Phase1FireInputs];

const fireFieldLabels: Record<NumericFireInputKey, string> = {
  currentAge: "Current age",
  lifeExpectancy: "Life expectancy",
  passiveIncomeFireAge: "Passive Income FIRE age",
  currentFireAssets: "Current FIRE assets",
  annualExpenses: "Annual retirement expenses",
  annualPassiveGuaranteedIncome: "Annual passive/guaranteed income",
  annualSavingsBeforeFire: "Annual savings before FIRE",
  expectedAnnualPortfolioReturnPercent: "Expected annual portfolio return",
  expectedCashGeneratingReturnPercent: "Expected cash-generating investment return",
  inflationRatePercent: "Inflation rate",
  withdrawalRatePercent: "Withdrawal rate",
  simpleEffectiveTaxRatePercent: "Simple effective tax rate",
  homeSaleAge: "Home sale age",
  homeSaleProceeds: "Net home sale proceeds"
};

const termHelp: Record<string, string> = {
  "Estimated FIRE age": "The earliest age when the projection can stop adding savings, begin portfolio draws, and still avoid depletion through life expectancy.",
  "FIRE year": "The calendar year when the successful portfolio drawdown plan begins.",
  "Assets at FIRE": "Projected FIRE assets at the start of the first retirement drawdown year.",
  "Implied withdrawal rate": "The first-year portfolio draw divided by assets at FIRE. It is an output, not an input.",
  "Income coverage ratio": "Passive or guaranteed income divided by annual expenses.",
  "Annual surplus / shortfall": "Your spendable income for this FIRE mode minus your annual retirement expenses. Positive is a surplus; negative is a gap you'd need to cover.",
  "Progress to FIRE age": "How far your current age has progressed toward this strategy's projected FIRE age, measured as current age ÷ projected FIRE age. 100% means you've reached the age where you could retire under this strategy.",
  "First shortfall age": "The first age when income is lower than retirement expenses.",
  "Coverage status": "Whether income covers projected expenses through life expectancy.",
  "Spendable income": "Income streams plus cash-generating investment return available to cover expenses.",
  "Earliest Principal-Preserving FIRE age": "The earliest age where the projected asset balance becomes a principal floor and income plus cash-generating return can cover expenses through life expectancy without ever dipping below that floor. It is an output, not an input.",
  "Principal floor": "The projected FIRE asset balance at the earliest qualifying FIRE age. Principal-Preserving FIRE passes only if assets stay at or above this floor.",
  "First cash shortfall age": "The first age when income streams plus cash-generating investment return are below expenses.",
  "First principal dip age": "The first age when projected assets fall below the FIRE-age principal floor.",
  "Ending assets": "Projected FIRE assets left at life expectancy.",
  "Cash flow": "Positive values add to FIRE assets. Negative values represent spending or withdrawal support.",
  "Income": "Spendable income counted in the row.",
  "Expenses": "Retirement expenses counted in the row.",
  "Surplus / shortfall": "Income minus expenses in the row.",
  "Cash-generating return": "Dividends, interest, and distributions generated from FIRE assets in the row.",
  "Cash yield": "Dividends, interest, and distributions your assets paid this year. Before FIRE it is reinvested and grows your assets; after FIRE it is spendable and counted inside Spendable income.",
  "Progress to FIRE": "Your current FIRE assets as a share of the assets this strategy needs at the FIRE age. 100% means you could retire under this strategy today.",
  "Starting FIRE assets": "Projected FIRE assets at the beginning of the row.",
  "Ending FIRE assets": "Projected FIRE assets at the end of the row.",
  "FIRE gap": "Before FIRE, the remaining gap to the target. After depletion, the uncovered shortfall.",
  "Income coverage": "How much of expenses are covered by passive or guaranteed income in that row.",
  "Current FIRE assets": "Liquid investments you could draw on — brokerage, retirement accounts, cash. Your primary home is NOT counted; if you plan to sell it, add the proceeds under Future home sale instead.",
  "Income Stream FIRE age": "The age when Income Stream FIRE starts testing retirement expenses against income streams.",
  "Principal-Preserving FIRE age": "The age when Principal-Preserving FIRE sets the principal floor and starts testing income plus cash-generating return against expenses.",
  "Annual retirement expenses": "Expected yearly household spending after FIRE, before subtracting passive or guaranteed income. When detailed expense categories are active, those categories replace this simple amount.",
  "Retirement expenses are inflation adjusted": "When enabled, annual retirement expenses grow each projected year by the inflation-rate assumption.",
  "Expense category": "A household retirement spending category. Detailed categories replace the simple annual expense amount only when the override is on.",
  "Annual expense amount": "The annual amount for this expense category.",
  "Expense start age": "The age when this expense category starts being counted.",
  "Expense end age": "Optional age when this expense category stops being counted.",
  "Expense category is inflation adjusted": "When enabled, this category grows each projected year by the inflation-rate assumption.",
  "Annual passive/guaranteed income after FIRE": "Recurring income like Social Security, pension, or rent. Don't include investment dividends or interest here — those belong in the return fields, or they'll be double-counted.",
  "Total return (price + yield)": "Your blended yearly growth on liquid investments — price gains plus dividends and interest. You spend by selling from this growing pot, so both kinds of return are usable here.",
  "Cash yield (spendable)": "The cash your investments pay out — dividends and interest — as a percent of assets. The part you can live on after FIRE without selling anything.",
  "Price appreciation (kept)": "Price growth only, not the cash yield. You don't spend it — it grows the principal you keep and pass on. Example: if total return is 10% and cash yield is 3%, enter 7% here.",
  "Home sale age": "The age you sell a home or property. Until then, real estate isn't part of your spendable FIRE assets.",
  "Net home sale proceeds": "Cash left after selling costs and any remaining mortgage. Added to spendable assets at the sale age. Leave 0 if you won't sell.",
  "Investment return": "Growth your assets earned this year.",
  "Investment return (total)": "All the growth your liquid investments earned this year — price gains plus dividends and interest. In Portfolio Drawdown you spend by selling, so the whole return grows the pot you draw from.",
  "Appreciation (unspent)": "Price growth only — the part of return you don't spend. It grows the principal you preserve and pass on. Your spendable cash yield is counted under income instead.",
  "Guaranteed income": "Recurring retirement income counted this year — Social Security, pension, annuity, or rent. Investment returns are tracked separately, not here.",
  "Spendable income (incl. yield)": "What you live on without selling principal: your guaranteed income plus the cash yield (dividends and interest) your assets pay out.",
  "Income / savings": "Before FIRE, the savings you add each year. After FIRE, your passive/guaranteed income.",
  "Assets withdrawn": "Money sold from the portfolio to cover the spending your income didn't. 0 means income covered it all.",
  "Passive/guaranteed income is inflation adjusted": "When enabled, the simple passive-income amount grows each projected year with inflation.",
  "Annual savings before FIRE": "Yearly cash flow that can be saved toward FIRE before retirement.",
  "Expected annual portfolio return": "The total annual growth assumption applied to FIRE assets before FIRE and in drawdown projections. It can include market appreciation.",
  "Expected appreciation return": "The non-cash part of your expected return: price growth only, excluding the cash-generating yield below. Before FIRE, total growth is this appreciation plus the cash-generating return. After FIRE, appreciation is not spent or counted toward covering expenses, so enter the remaining return here. Example: if your total return is 10% and your cash-generating return is 3%, enter 7% here.",
  "Expected cash-generating investment return": "The annual cash yield from dividends, interest, and distributions, as a percent of assets. This is the part of return you can use after FIRE. It is not unrealized appreciation; your total expected return is this plus the appreciation return above.",
  "Inflation rate": "The annual increase applied to future expenses.",
  "Tax mode": "Simple mode assumes you pay tax on the money you spend, so it grosses up your spending by the rate (you need expenses ÷ (1 − rate) before tax). A blunt estimate — it taxes all income equally.",
  "Simple effective tax rate": "A blended tax assumption used to estimate pre-tax withdrawals."
};

const expenseCategoryLabels: Record<Phase1ExpenseCategoryType, string> = {
  housing: "Housing",
  healthcare: "Healthcare",
  insurance: "Insurance",
  food: "Food",
  transportation: "Transportation",
  travel: "Travel",
  taxes: "Taxes",
  childcare_education: "Childcare / education",
  debt: "Debt",
  living: "General living",
  other: "Other expense"
};

const incomeSourceTypeLabels: Record<Phase1IncomeSourceType, string> = {
  social_security: "Social Security",
  rental_income: "Rental income",
  pension: "Pension",
  annuity: "Annuity",
  part_time_income: "Part-time income",
  other: "Other income"
};

const incomeSourceOwnerLabels: Record<Phase1IncomeSourceOwner, string> = {
  user_1: "User 1",
  user_2: "User 2",
  joint: "Joint",
  child: "Child",
  household: "Household"
};

const expenseCategoryTypes = Object.keys(expenseCategoryLabels) as Phase1ExpenseCategoryType[];
const incomeSourceTypes = Object.keys(incomeSourceTypeLabels) as Phase1IncomeSourceType[];
const incomeSourceOwners = Object.keys(incomeSourceOwnerLabels) as Phase1IncomeSourceOwner[];

type ExpenseCategoryDraft = {
  type: Phase1ExpenseCategoryType;
  annualAmount: string;
  startAge: string;
  endAge: string;
  inflationAdjusted: boolean;
};

type IncomeSourceDraft = {
  type: Phase1IncomeSourceType;
  owner: Phase1IncomeSourceOwner;
  annualAmount: string;
  startAge: string;
  endAge: string;
  inflationAdjusted: boolean;
};

function getFriendlyFireError(error: string | null) {
  if (!error) return null;

  const finiteField = Object.keys(fireFieldLabels).find((field) =>
    error.startsWith(`${field} must be a finite non-negative number.`)
  ) as NumericFireInputKey | undefined;

  if (finiteField) {
    return `${fireFieldLabels[finiteField]} must be a finite non-negative number.`;
  }

  if (error === "Current age and life expectancy must be whole years.") return error;
  if (error === "Current age must be less than life expectancy.") return error;
  if (error === "Passive Income FIRE age must be a whole year.") return error;
  if (error === "Passive Income FIRE age must be less than or equal to life expectancy.") {
    return error;
  }
  if (error === "Withdrawal rate must be greater than 0.") return error;
  if (error === "Simple effective tax rate must be less than 100%.") {
    return "Simple effective tax rate must be less than 100%.";
  }

  return "Check the highlighted FIRE inputs.";
}

function getInvalidFireFields(error: string | null) {
  if (!error) return new Set<NumericFireInputKey>();

  const finiteField = Object.keys(fireFieldLabels).find((field) =>
    error.startsWith(`${field} must be a finite non-negative number.`)
  ) as NumericFireInputKey | undefined;

  if (finiteField) return new Set<NumericFireInputKey>([finiteField]);

  if (
    error === "Current age and life expectancy must be whole years." ||
    error === "Current age must be less than life expectancy." ||
    error === "Passive Income FIRE age must be a whole year." ||
    error === "Passive Income FIRE age must be less than or equal to life expectancy."
  ) {
    return new Set<NumericFireInputKey>(["currentAge", "lifeExpectancy", "passiveIncomeFireAge"]);
  }

  if (error === "Withdrawal rate must be greater than 0.") {
    return new Set<NumericFireInputKey>(["withdrawalRatePercent"]);
  }

  if (error === "Simple effective tax rate must be less than 100%.") {
    return new Set<NumericFireInputKey>(["simpleEffectiveTaxRatePercent"]);
  }

  return new Set<NumericFireInputKey>(Object.keys(fireFieldLabels) as NumericFireInputKey[]);
}

type NumberFieldProps<Key extends NumericFireInputKey> = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  format?: "plain" | "grouped";
  invalid?: boolean;
  onChange: (key: Key, value: number) => void;
  fieldKey: Key;
};

function NumberField<Key extends NumericFireInputKey>({
  id,
  label,
  value,
  min = 0,
  max,
  step = 1,
  suffix,
  format = "plain",
  invalid = false,
  onChange,
  fieldKey
}: NumberFieldProps<Key>) {
  const useGroupedTextInput = format === "grouped";
  const [draftValue, setDraftValue] = useState(() =>
    useGroupedTextInput ? formatInputNumber(value) : String(value)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [hasUncommittedDraft, setHasUncommittedDraft] = useState(false);
  const displayedValue = isEditing || hasUncommittedDraft
    ? draftValue
    : useGroupedTextInput
      ? formatInputNumber(value)
      : String(value);
  const handleInputValue = (rawValue: string) => {
    setIsEditing(true);
    setDraftValue(rawValue);
    const parsedValue = parseInputNumber(rawValue);
    if (Number.isFinite(parsedValue)) {
      setHasUncommittedDraft(false);
      onChange(fieldKey, parsedValue);
    } else {
      setHasUncommittedDraft(true);
    }
  };

  return (
    <div>
      <InfoLabel htmlFor={id} label={label} />
      <div
        className={cn(
          "mt-2 flex min-h-12 items-center rounded-xl border bg-white px-4 shadow-sm transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]",
          invalid ? "border-[var(--danger)]" : "border-gray-200"
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={displayedValue}
          aria-invalid={invalid}
          aria-describedby={invalid ? fireInputErrorId : undefined}
          onChange={(event) => {
            handleInputValue(event.target.value);
          }}
          onInput={(event) => {
            handleInputValue(event.currentTarget.value);
          }}
          onFocus={() => {
            if (!hasUncommittedDraft) {
              setDraftValue(useGroupedTextInput ? formatInputNumber(value) : String(value));
            }
            setIsEditing(true);
          }}
          onBlur={() => {
            setIsEditing(false);
            setHasUncommittedDraft(!Number.isFinite(parseInputNumber(draftValue)));
          }}
          onWheel={(event) => event.currentTarget.blur()}
          className="min-h-11 w-full border-0 bg-transparent py-2 text-base font-medium text-gray-900 outline-none"
        />
        {suffix ? (
          <span className="pl-2 text-sm font-medium text-gray-500">{suffix}</span>
        ) : null}
      </div>
    </div>
  );
}

function parseInputNumber(value: string) {
  const normalizedValue = value.replace(/,/g, "").trim();
  if (!normalizedValue) return Number.NaN;
  return Number(normalizedValue);
}

function formatInputNumber(value: number) {
  if (!Number.isFinite(value)) return "";
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value);
}

function InfoLabel({
  label,
  htmlFor,
  className,
  help
}: {
  label: string;
  htmlFor?: string;
  className?: string;
  // Optional override so a renamed column header can keep its original tooltip
  // (e.g. "Income" displays but keeps the old "Income / savings" help text).
  help?: string;
}) {
  const helpText =
    help ??
    termHelp[label] ??
    "This value changes the projection. Review the calculation details to see how it is used.";
  const content = (
    <>
      <span>{label}</span>
      <InfoPopover label={label} content={helpText} />
    </>
  );

  if (htmlFor) {
    return (
      <div className={cn("flex items-center gap-1.5 text-sm font-medium text-gray-800", className)}>
        <label htmlFor={htmlFor}>{label}</label>
        <InfoPopover label={label} content={helpText} />
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {content}
    </span>
  );
}

// KPI card (REDESIGN_SPEC §4): caption label, big tabular value, tone-colored
// with a matching top accent so the result rail reads at a glance.
function ResultCard({
  label,
  value,
  tone = "default",
  help
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning";
  // Optional tooltip override so the same card label (e.g. "Annual surplus /
  // shortfall") can carry mode-specific help text explaining which income counts.
  help?: string;
}) {
  const valueClass =
    tone === "success"
      ? "text-[var(--positive)]"
      : tone === "warning"
        ? "text-[var(--negative)]"
        : "text-gray-900";

  return (
    <Card
      className={cn(
        "border-t-2 p-5",
        tone === "warning" ? "border-t-[var(--negative)]" : "border-t-[var(--primary)]"
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
        <InfoLabel label={label} help={help} />
      </p>
      <p className={cn("mt-2 text-[28px] font-extrabold leading-9 tracking-tight tabular-nums", valueClass)}>
        {value}
      </p>
    </Card>
  );
}

function ProgressBar({
  label,
  value,
  note
}: {
  label: string;
  value: number;
  note: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        <p className="text-sm text-gray-500 tabular-nums">{note}</p>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(boundedValue)}
        className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--green-400)] to-[var(--primary)] transition-[width] duration-500"
          style={{ width: `${boundedValue}%` }}
        />
      </div>
    </div>
  );
}

// Age-based progress toward a strategy's projected FIRE age. Used by both
// Portfolio Drawdown and Principal-Preserving so the progress bar reads in
// intuitive age terms rather than an assets-based ratio.
//
// Formula: percent = (current age / projected FIRE age) × 100, clamped to
// 0–100. It reaches 100% once the current age is at or past the FIRE age
// (you could retire now), and shows 0% with a "not reached" note when the
// strategy never reaches FIRE under the current assumptions.
function computeAgeProgress(currentAge: number, fireAge: number | null) {
  if (fireAge === null) {
    return { percent: 0, note: "FIRE age not reached under current assumptions" };
  }
  if (fireAge <= currentAge) {
    return {
      percent: 100,
      note: `Age ${formatNumber(currentAge)} — you've reached your FIRE age`
    };
  }
  const percent = Math.max(0, Math.min(100, (currentAge / fireAge) * 100));
  return {
    percent,
    note: `Age ${formatNumber(currentAge)} of ${formatNumber(fireAge)} — ${formatPercent(
      percent / 100
    )} of the way to your FIRE age`
  };
}

// Always-visible navigation to the standalone calculators, shown near the top
// of each FIRE strategy page so users can refine an assumption without hunting
// through the optional accordions. Reuses the shared PLANNING_TOOLS registry.
// Income Stream FIRE ignores portfolio growth, so the Investment calculator is
// omitted in that mode.
function StrategyCalculatorLinks({ excludeInvestment }: { excludeInvestment: boolean }) {
  const tools = PLANNING_TOOLS.filter(
    (tool) => !(excludeInvestment && tool.slug === "investment")
  );

  return (
    <Card className="p-6 sm:p-7">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-gray-900">
          Refine your estimate with these calculators
        </h2>
        <p className="text-sm leading-relaxed text-gray-500">
          Open a calculator in a new tab to fine-tune an assumption, then bring the number back into
          your plan.
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {tools.map((tool) => (
          <Link
            key={tool.slug}
            href={tool.href}
            target="_blank"
            rel="noreferrer"
            className="group block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          >
            <span className="block text-base font-semibold text-gray-900 transition group-hover:text-[var(--primary)]">
              {tool.title}
            </span>
            <span className="mt-2 block text-sm leading-relaxed text-gray-500">
              {tool.description}
            </span>
            <span className="mt-3 inline-block text-[13px] font-semibold text-[var(--primary-hover)]">
              Explore &rarr;
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export function FireStrategyPanel({
  mode,
  workbook,
  fireResult,
  fireError,
  portfolioSummary,
  onChange
}: Phase1PanelProps & { mode: Phase1FireRuleMode }) {
  const inputs = workbook.fireInputs;
  const isWithdrawalRateMode = mode === "withdrawal_rate";
  const isIncomeStreamMode = mode === "income_stream";
  const isPrincipalPreservingMode = mode === "principal_preserving";
  // Results only update when the user clicks Calculate. Until then, editing
  // inputs marks the shown results as stale (edit mode).
  const [committedResult, setCommittedResult] = useState(fireResult);
  const [committedError, setCommittedError] = useState(fireError);
  const [resultsStale, setResultsStale] = useState(false);
  const friendlyFireError = getFriendlyFireError(committedError);
  const invalidFireFields = getInvalidFireFields(committedError);
  const withdrawalResult = committedResult?.withdrawalRate;
  const incomeStreamResult = committedResult?.incomeStream;
  const principalPreservingResult = committedResult?.principalPreserving;

  function recalculateResults() {
    setCommittedResult(fireResult);
    setCommittedError(fireError);
    setResultsStale(false);
  }
  const [expenseCategoryDraft, setExpenseCategoryDraft] = useState<ExpenseCategoryDraft>({
    type: "housing",
    annualAmount: "",
    startAge: String(inputs.passiveIncomeFireAge),
    endAge: "",
    inflationAdjusted: true
  });
  const [expenseCategoryDraftError, setExpenseCategoryDraftError] = useState<string | null>(null);
  const [incomeSourceDraft, setIncomeSourceDraft] = useState<IncomeSourceDraft>({
    type: "social_security",
    owner: "user_1",
    annualAmount: "",
    startAge: String(inputs.currentAge),
    endAge: "",
    inflationAdjusted: true
  });
  const [incomeSourceDraftError, setIncomeSourceDraftError] = useState<string | null>(null);

  function updateFireInput<Key extends keyof Phase1FireInputs>(
    key: Key,
    value: Phase1FireInputs[Key]
  ) {
    setResultsStale(true);
    onChange((current) => ({
      ...current,
      fireInputs: { ...current.fireInputs, fireRuleMode: mode, [key]: value }
    }));
  }

  function usePortfolioFireAssets() {
    updateFireInput("currentFireAssets", portfolioSummary.includedInFire);
  }

  function setTaxMode(taxMode: Phase1TaxMode) {
    updateFireInput("taxMode", taxMode);
  }

  function updateExpenseCategoryDraft<Key extends keyof ExpenseCategoryDraft>(
    key: Key,
    value: ExpenseCategoryDraft[Key]
  ) {
    setExpenseCategoryDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    setExpenseCategoryDraftError(null);
  }

  function updateIncomeSourceDraft<Key extends keyof IncomeSourceDraft>(
    key: Key,
    value: IncomeSourceDraft[Key]
  ) {
    setIncomeSourceDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
    setIncomeSourceDraftError(null);
  }

  function addExpenseCategory() {
    const annualAmount = parseInputNumber(expenseCategoryDraft.annualAmount);
    const startAge = parseInputNumber(expenseCategoryDraft.startAge);
    const endAge = expenseCategoryDraft.endAge.trim()
      ? parseInputNumber(expenseCategoryDraft.endAge)
      : undefined;

    if (!Number.isFinite(annualAmount) || annualAmount < 0) {
      setExpenseCategoryDraftError("Enter a valid non-negative annual expense amount.");
      return;
    }

    if (!Number.isInteger(startAge) || startAge < 0) {
      setExpenseCategoryDraftError("Enter a valid whole-number expense start age.");
      return;
    }

    if (endAge !== undefined) {
      if (!Number.isInteger(endAge) || endAge < 0) {
        setExpenseCategoryDraftError("Enter a valid whole-number expense end age, or leave it blank.");
        return;
      }

      if (endAge < startAge) {
        setExpenseCategoryDraftError("Expense end age must be greater than or equal to start age.");
        return;
      }
    }

    const expenseCategory: Phase1ExpenseCategory = {
      id: `expense-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: expenseCategoryDraft.type,
      annualAmount,
      startAge,
      endAge,
      inflationAdjusted: expenseCategoryDraft.inflationAdjusted
    };

    updateFireInput("expenseCategories", [...inputs.expenseCategories, expenseCategory]);
    setExpenseCategoryDraft({
      ...expenseCategoryDraft,
      annualAmount: "",
      startAge: String(startAge),
      endAge: ""
    });
  }

  function removeExpenseCategory(expenseCategoryId: string) {
    updateFireInput(
      "expenseCategories",
      inputs.expenseCategories.filter(
        (expenseCategory) => expenseCategory.id !== expenseCategoryId
      )
    );
  }

  function addIncomeSource() {
    const annualAmount = parseInputNumber(incomeSourceDraft.annualAmount);
    const startAge = parseInputNumber(incomeSourceDraft.startAge);
    const endAge = incomeSourceDraft.endAge.trim()
      ? parseInputNumber(incomeSourceDraft.endAge)
      : undefined;

    if (!Number.isFinite(annualAmount) || annualAmount < 0) {
      setIncomeSourceDraftError("Enter a valid non-negative annual amount.");
      return;
    }

    if (!Number.isInteger(startAge) || startAge < 0) {
      setIncomeSourceDraftError("Enter a valid whole-number start age.");
      return;
    }

    if (endAge !== undefined) {
      if (!Number.isInteger(endAge) || endAge < 0) {
        setIncomeSourceDraftError("Enter a valid whole-number end age, or leave it blank.");
        return;
      }

      if (endAge < startAge) {
        setIncomeSourceDraftError("End age must be greater than or equal to start age.");
        return;
      }
    }

    const incomeSource: Phase1IncomeSource = {
      id: `income-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: incomeSourceDraft.type,
      owner: incomeSourceDraft.owner,
      annualAmount,
      startAge,
      endAge,
      inflationAdjusted: incomeSourceDraft.inflationAdjusted
    };

    updateFireInput("incomeSources", [...inputs.incomeSources, incomeSource]);
    setIncomeSourceDraft({
      ...incomeSourceDraft,
      annualAmount: "",
      startAge: String(startAge),
      endAge: ""
    });
  }

  function removeIncomeSource(incomeSourceId: string) {
    updateFireInput(
      "incomeSources",
      inputs.incomeSources.filter((incomeSource) => incomeSource.id !== incomeSourceId)
    );
  }

  const title = isWithdrawalRateMode
    ? "Portfolio Drawdown FIRE"
    : isPrincipalPreservingMode
      ? "Principal-Preserving FIRE"
      : "Income Stream FIRE";
  const intro = isWithdrawalRateMode
    ? "Find the earliest age where household assets can stop receiving savings, begin portfolio draws, and last through life expectancy."
    : isPrincipalPreservingMode
      ? "Find the earliest age where income streams plus cash-generating investment return can cover expenses while keeping assets at or above the FIRE-age principal floor through life expectancy."
      : "Check whether recurring income streams can cover retirement expenses from your chosen FIRE age.";
  const plannedFireAgeLabel = isPrincipalPreservingMode
    ? "Principal-Preserving FIRE age"
    : "Income Stream FIRE age";
  const portfolioReturnLabel = isPrincipalPreservingMode
    ? "Price appreciation (kept)"
    : "Total return (price + yield)";

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/app/fire-path"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            &larr; Back to Path to FIRE
          </Link>
          <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-500">{intro}</p>
        </div>
        {!isIncomeStreamMode ? (
          <Button type="button" onClick={usePortfolioFireAssets} variant="secondary" size="sm">
            Use Portfolio FIRE Assets
          </Button>
        ) : null}
      </div>

      <div className="grid scroll-mt-28 gap-5 lg:grid-cols-3 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(320px,0.95fr)]">
        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Timeline</h2>
          <div className="mt-5 grid gap-4">
            <NumberField
              id="fire-current-age"
              label="Current age"
              value={inputs.currentAge}
              step={1}
              invalid={invalidFireFields.has("currentAge")}
              onChange={updateFireInput}
              fieldKey="currentAge"
            />
            <NumberField
              id="fire-life-expectancy"
              label="Life expectancy"
              value={inputs.lifeExpectancy}
              step={1}
              invalid={invalidFireFields.has("lifeExpectancy")}
              onChange={updateFireInput}
              fieldKey="lifeExpectancy"
            />
            {isIncomeStreamMode ? (
              <NumberField
                id="fire-passive-income-fire-age"
                label={plannedFireAgeLabel}
                value={inputs.passiveIncomeFireAge}
                step={1}
                invalid={invalidFireFields.has("passiveIncomeFireAge")}
                onChange={updateFireInput}
                fieldKey="passiveIncomeFireAge"
              />
            ) : (
              isPrincipalPreservingMode ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-500">
                  Principal-Preserving FIRE finds the earliest age for you. Add savings, returns,
                  and income below, then read the earliest age in the results.
                </div>
              ) : null
            )}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Money</h2>
          <div className="mt-5 grid gap-4">
            {!isIncomeStreamMode ? (
              <div>
                <NumberField
                  id="fire-current-assets"
                  label="Current FIRE assets"
                  value={inputs.currentFireAssets}
                  step={1000}
                  format="grouped"
                  invalid={invalidFireFields.has("currentFireAssets")}
                  onChange={updateFireInput}
                  fieldKey="currentFireAssets"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">
                  Liquid investments only — your primary home isn&rsquo;t counted. Add a planned
                  home sale below to include the proceeds.
                </p>
              </div>
            ) : null}
            <NumberField
              id="fire-annual-expenses"
              label="Annual retirement expenses"
              value={inputs.annualExpenses}
              step={1000}
              format="grouped"
              invalid={invalidFireFields.has("annualExpenses")}
              onChange={updateFireInput}
              fieldKey="annualExpenses"
            />
            <div className="flex min-h-12 items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 shadow-sm transition hover:bg-gray-50">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={inputs.expensesInflationAdjusted}
                  onChange={(event) =>
                    updateFireInput("expensesInflationAdjusted", event.target.checked)
                  }
                  className="mt-1"
                />
                Retirement expenses are inflation adjusted
              </label>
              <InfoPopover
                label="Retirement expenses are inflation adjusted"
                content={termHelp["Retirement expenses are inflation adjusted"]}
              />
            </div>
            <NumberField
              id="fire-passive-income"
              label="Annual passive/guaranteed income after FIRE"
              value={inputs.annualPassiveGuaranteedIncome}
              step={1000}
              format="grouped"
              invalid={invalidFireFields.has("annualPassiveGuaranteedIncome")}
              onChange={updateFireInput}
              fieldKey="annualPassiveGuaranteedIncome"
            />
            <div className="flex min-h-12 items-start justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 shadow-sm transition hover:bg-gray-50">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={inputs.passiveGuaranteedIncomeInflationAdjusted}
                  onChange={(event) =>
                    updateFireInput(
                      "passiveGuaranteedIncomeInflationAdjusted",
                      event.target.checked
                    )
                  }
                  className="mt-1"
                />
                Passive/guaranteed income is inflation adjusted
              </label>
              <InfoPopover
                label="Passive/guaranteed income is inflation adjusted"
                content={termHelp["Passive/guaranteed income is inflation adjusted"]}
              />
            </div>
            {!isIncomeStreamMode ? (
              <NumberField
                id="fire-annual-savings"
                label="Annual savings before FIRE"
                value={inputs.annualSavingsBeforeFire}
                step={1000}
                format="grouped"
                invalid={invalidFireFields.has("annualSavingsBeforeFire")}
                onChange={updateFireInput}
                fieldKey="annualSavingsBeforeFire"
              />
            ) : null}
            {!isIncomeStreamMode ? (
              <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <summary className="cursor-pointer text-sm font-medium text-gray-800">
                  Future home sale (optional)
                </summary>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  Your home isn&rsquo;t counted in FIRE assets. If you plan to sell or downsize,
                  add the proceeds here as a one-time cash inflow. Leave proceeds at 0 to skip.
                </p>
                <div className="mt-3 grid gap-4">
                  <NumberField
                    id="fire-home-sale-proceeds"
                    label="Net home sale proceeds"
                    value={inputs.homeSaleProceeds}
                    step={1000}
                    format="grouped"
                    invalid={invalidFireFields.has("homeSaleProceeds")}
                    onChange={updateFireInput}
                    fieldKey="homeSaleProceeds"
                  />
                  <NumberField
                    id="fire-home-sale-age"
                    label="Home sale age"
                    value={inputs.homeSaleAge}
                    step={1}
                    invalid={invalidFireFields.has("homeSaleAge")}
                    onChange={updateFireInput}
                    fieldKey="homeSaleAge"
                  />
                </div>
              </details>
            ) : null}
          </div>
        </Card>

        <Card className="p-6 sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900">Assumptions</h2>
          <div className="mt-5 grid gap-4">
            {!isIncomeStreamMode ? (
              <NumberField
                id="fire-portfolio-return"
                label={portfolioReturnLabel}
                value={inputs.expectedAnnualPortfolioReturnPercent}
                step={0.1}
                suffix="%"
                invalid={invalidFireFields.has("expectedAnnualPortfolioReturnPercent")}
                onChange={updateFireInput}
                fieldKey="expectedAnnualPortfolioReturnPercent"
              />
            ) : null}
            {isPrincipalPreservingMode ? (
              <NumberField
                id="fire-cash-generating-return"
                label="Cash yield (spendable)"
                value={inputs.expectedCashGeneratingReturnPercent}
                step={0.1}
                suffix="%"
                invalid={invalidFireFields.has("expectedCashGeneratingReturnPercent")}
                onChange={updateFireInput}
                fieldKey="expectedCashGeneratingReturnPercent"
              />
            ) : null}
            {isPrincipalPreservingMode ? (
              <p className="text-xs leading-relaxed text-gray-500">
                Total return = appreciation you keep + yield you can spend without selling. Enter them
                separately above.
              </p>
            ) : null}
            <NumberField
              id="fire-inflation-rate"
              label="Inflation rate"
              value={inputs.inflationRatePercent}
              step={0.1}
              suffix="%"
              invalid={invalidFireFields.has("inflationRatePercent")}
              onChange={updateFireInput}
              fieldKey="inflationRatePercent"
            />
            <div>
              <InfoLabel htmlFor="fire-tax-mode" label="Tax mode" />
              <select
                id="fire-tax-mode"
                value={inputs.taxMode}
                onChange={(event) => setTaxMode(event.target.value as Phase1TaxMode)}
                className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm transition focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
              >
                <option value="none">No tax adjustment</option>
                <option value="simple">Simple effective tax rate</option>
              </select>
            </div>
            {inputs.taxMode === "simple" ? (
              <NumberField
                id="fire-simple-tax-rate"
                label="Simple effective tax rate"
                value={inputs.simpleEffectiveTaxRatePercent}
                max={99.9}
                step={0.1}
                suffix="%"
                invalid={invalidFireFields.has("simpleEffectiveTaxRatePercent")}
                onChange={updateFireInput}
                fieldKey="simpleEffectiveTaxRatePercent"
              />
            ) : null}
          </div>
        </Card>

        <div className="grid gap-5 lg:col-span-3 xl:col-span-1">
          <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <summary className="cursor-pointer px-6 py-5 text-lg font-semibold tracking-tight text-gray-900 sm:px-7">
              Expense Categories (Optional)
            </summary>
            <div className="border-t border-gray-200 px-6 py-5 sm:px-7">
              <div className="grid gap-5">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-gray-500">
                    Keep the simple annual expense amount for quick planning. Turn this on only
                    when you want category-by-category timing for housing, healthcare, travel,
                    taxes, or other retirement expenses.
                  </p>
                  <label className="flex min-h-12 items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium leading-relaxed text-gray-800">
                    <input
                      type="checkbox"
                      checked={inputs.useExpenseCategoriesOverride}
                      onChange={(event) =>
                        updateFireInput("useExpenseCategoriesOverride", event.target.checked)
                      }
                      className="mt-1"
                    />
                    Use expense categories instead of the simple annual expense amount
                  </label>
                  <p className="text-xs leading-relaxed text-gray-500">
                    {inputs.useExpenseCategoriesOverride
                      ? "Detailed expense categories are active and replace the simple annual expense amount to avoid double counting."
                      : "Detailed expense categories are saved here but ignored until this override is turned on."}
                  </p>

                  {inputs.expenseCategories.length > 0 ? (
                    <div className="max-h-80 overflow-auto rounded-xl border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                          <tr>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3">Amount</th>
                            <th className="px-4 py-3">Ages</th>
                            <th className="px-4 py-3">Inflation</th>
                            <th className="px-4 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {inputs.expenseCategories.map((expenseCategory) => (
                            <tr key={expenseCategory.id}>
                              <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                                {expenseCategoryLabels[expenseCategory.type]}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                {formatCurrency(expenseCategory.annualAmount)}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                {expenseCategory.startAge}
                                {expenseCategory.endAge === undefined
                                  ? "+"
                                  : `-${expenseCategory.endAge}`}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                {expenseCategory.inflationAdjusted ? "Yes" : "No"}
                              </td>
                              <td className="whitespace-nowrap px-4 py-3">
                                <Button
                                  type="button"
                                  onClick={() => removeExpenseCategory(expenseCategory.id)}
                                  variant="ghost"
                                  size="sm"
                                >
                                  Delete
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm leading-relaxed text-gray-500">
                      No detailed expense categories yet.
                    </div>
                  )}
                </div>

                <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div>
                    <label
                      htmlFor="expense-category-type"
                      className="text-sm font-medium text-gray-800"
                    >
                      Expense category
                    </label>
                    <select
                      id="expense-category-type"
                      value={expenseCategoryDraft.type}
                      onChange={(event) =>
                        updateExpenseCategoryDraft(
                          "type",
                          event.target.value as Phase1ExpenseCategoryType
                        )
                      }
                      className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      {expenseCategoryTypes.map((expenseType) => (
                        <option key={expenseType} value={expenseType}>
                          {expenseCategoryLabels[expenseType]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="expense-category-amount"
                      className="text-sm font-medium text-gray-800"
                    >
                      Annual expense amount
                    </label>
                    <input
                      id="expense-category-amount"
                      type="text"
                      inputMode="decimal"
                      value={expenseCategoryDraft.annualAmount}
                      onChange={(event) =>
                        updateExpenseCategoryDraft("annualAmount", event.target.value)
                      }
                      onWheel={(event) => event.currentTarget.blur()}
                      placeholder="60,000"
                      className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                    <div>
                      <label
                        htmlFor="expense-category-start-age"
                        className="text-sm font-medium text-gray-800"
                      >
                        Expense start age
                      </label>
                      <input
                        id="expense-category-start-age"
                        type="text"
                        inputMode="numeric"
                        value={expenseCategoryDraft.startAge}
                        onChange={(event) =>
                          updateExpenseCategoryDraft("startAge", event.target.value)
                        }
                        onWheel={(event) => event.currentTarget.blur()}
                        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="expense-category-end-age"
                        className="text-sm font-medium text-gray-800"
                      >
                        Expense end age
                      </label>
                      <input
                        id="expense-category-end-age"
                        type="text"
                        inputMode="numeric"
                        value={expenseCategoryDraft.endAge}
                        onChange={(event) =>
                          updateExpenseCategoryDraft("endAge", event.target.value)
                        }
                        onWheel={(event) => event.currentTarget.blur()}
                        placeholder="Optional"
                        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                      />
                    </div>
                  </div>
                  <label className="flex min-h-12 items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 shadow-sm">
                    <input
                      type="checkbox"
                      checked={expenseCategoryDraft.inflationAdjusted}
                      onChange={(event) =>
                        updateExpenseCategoryDraft("inflationAdjusted", event.target.checked)
                      }
                      className="mt-1"
                    />
                    Expense category is inflation adjusted
                  </label>
                  {expenseCategoryDraftError ? (
                    <p className="text-sm font-medium text-[var(--danger)]">
                      {expenseCategoryDraftError}
                    </p>
                  ) : null}
                  <Button type="button" onClick={addExpenseCategory} className="w-full">
                    Add Expense Category
                  </Button>
                </div>
              </div>
            </div>
          </details>

      <details className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <summary className="cursor-pointer px-6 py-5 text-lg font-semibold tracking-tight text-gray-900 sm:px-7">
          Income Sources (Optional)
        </summary>
        <div className="border-t border-gray-200 px-6 py-5 sm:px-7">
          <div className="grid gap-5">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-gray-500">
                Keep the simple passive-income amount above for quick planning. Turn this on only
                when you want source-by-source timing for Social Security, rental income, pension,
                or other income.
              </p>
              <label className="flex min-h-12 items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-medium leading-relaxed text-gray-800">
                <input
                  type="checkbox"
                  checked={inputs.useIncomeSourcesOverride}
                  onChange={(event) =>
                    updateFireInput("useIncomeSourcesOverride", event.target.checked)
                  }
                  className="mt-1"
                />
                Use income sources instead of the simple passive income amount
              </label>
              <p className="text-xs leading-relaxed text-gray-500">
                {inputs.useIncomeSourcesOverride
                  ? "Detailed income sources are active and replace the simple passive-income amount to avoid double counting."
                  : "Detailed income sources are saved here but ignored until this override is turned on."}
              </p>

              {inputs.incomeSources.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <tr>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Owner</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Ages</th>
                        <th className="px-4 py-3">Inflation</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {inputs.incomeSources.map((incomeSource) => (
                        <tr key={incomeSource.id}>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                            {incomeSourceTypeLabels[incomeSource.type]}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {incomeSourceOwnerLabels[incomeSource.owner]}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {formatCurrency(incomeSource.annualAmount)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {incomeSource.startAge}
                            {incomeSource.endAge === undefined ? "+" : `-${incomeSource.endAge}`}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                            {incomeSource.inflationAdjusted ? "Yes" : "No"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Button
                              type="button"
                              onClick={() => removeIncomeSource(incomeSource.id)}
                              variant="ghost"
                              size="sm"
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm leading-relaxed text-gray-500">
                  No detailed income sources yet.
                </div>
              )}
            </div>

            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div>
                <label
                  htmlFor="income-source-type"
                  className="text-sm font-medium text-gray-800"
                >
                  Income source type
                </label>
                <select
                  id="income-source-type"
                  value={incomeSourceDraft.type}
                  onChange={(event) =>
                    updateIncomeSourceDraft(
                      "type",
                      event.target.value as Phase1IncomeSourceType
                    )
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  {incomeSourceTypes.map((sourceType) => (
                    <option key={sourceType} value={sourceType}>
                      {incomeSourceTypeLabels[sourceType]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="income-source-owner"
                  className="text-sm font-medium text-gray-800"
                >
                  Owner
                </label>
                <select
                  id="income-source-owner"
                  value={incomeSourceDraft.owner}
                  onChange={(event) =>
                    updateIncomeSourceDraft(
                      "owner",
                      event.target.value as Phase1IncomeSourceOwner
                    )
                  }
                  className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  {incomeSourceOwners.map((owner) => (
                    <option key={owner} value={owner}>
                      {incomeSourceOwnerLabels[owner]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="income-source-amount"
                  className="text-sm font-medium text-gray-800"
                >
                  Annual amount
                </label>
                <input
                  id="income-source-amount"
                  type="text"
                  inputMode="decimal"
                  value={incomeSourceDraft.annualAmount}
                  onChange={(event) =>
                    updateIncomeSourceDraft("annualAmount", event.target.value)
                  }
                  onWheel={(event) => event.currentTarget.blur()}
                  placeholder="40,000"
                  className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <div>
                  <label
                    htmlFor="income-source-start-age"
                    className="text-sm font-medium text-gray-800"
                  >
                    Start age
                  </label>
                  <input
                    id="income-source-start-age"
                    type="text"
                    inputMode="numeric"
                    value={incomeSourceDraft.startAge}
                    onChange={(event) =>
                      updateIncomeSourceDraft("startAge", event.target.value)
                    }
                    onWheel={(event) => event.currentTarget.blur()}
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="income-source-end-age"
                    className="text-sm font-medium text-gray-800"
                  >
                    End age
                  </label>
                  <input
                    id="income-source-end-age"
                    type="text"
                    inputMode="numeric"
                    value={incomeSourceDraft.endAge}
                    onChange={(event) => updateIncomeSourceDraft("endAge", event.target.value)}
                    onWheel={(event) => event.currentTarget.blur()}
                    placeholder="Optional"
                    className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                  />
                </div>
              </div>
              <label className="flex min-h-12 items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 shadow-sm">
                <input
                  type="checkbox"
                  checked={incomeSourceDraft.inflationAdjusted}
                  onChange={(event) =>
                    updateIncomeSourceDraft("inflationAdjusted", event.target.checked)
                  }
                  className="mt-1"
                />
                Income source is inflation adjusted
              </label>
              {incomeSourceDraftError ? (
                <p className="text-sm font-medium text-[var(--danger)]">
                  {incomeSourceDraftError}
                </p>
              ) : null}
              <Button type="button" onClick={addIncomeSource} className="w-full">
                Add Income Source
              </Button>
            </div>
          </div>
        </div>
      </details>
        </div>
      </div>

      <div
        className={cn(
          "flex flex-col gap-3 rounded-2xl border p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between",
          resultsStale
            ? "border-[var(--gold-border)] bg-[var(--gold-bg)]"
            : "border-[var(--border)] bg-[var(--surface)]"
        )}
      >
        <p className="text-sm leading-relaxed text-gray-700">
          {resultsStale
            ? "Edit mode: you changed inputs. The results below are from your last calculation. Click Calculate to update them."
            : "Results below are up to date with your inputs."}
        </p>
        <Button type="button" onClick={recalculateResults} className="sm:flex-none">
          {resultsStale ? "Calculate results" : "Recalculate"}
        </Button>
      </div>

      {friendlyFireError ? (
        <div
          id={fireInputErrorId}
          className="rounded-2xl border border-[var(--negative)] bg-[var(--negative-bg)] p-5 text-sm font-medium leading-relaxed text-[var(--negative)] shadow-sm"
        >
          {friendlyFireError}
        </div>
      ) : null}

      {isWithdrawalRateMode && withdrawalResult ? (
        <WithdrawalResults result={withdrawalResult} currentAge={inputs.currentAge} />
      ) : null}

      {isIncomeStreamMode && incomeStreamResult ? (
        <IncomeStreamResults result={incomeStreamResult} />
      ) : null}

      {isPrincipalPreservingMode && principalPreservingResult ? (
        <PrincipalPreservingResults
          result={principalPreservingResult}
          currentAge={inputs.currentAge}
        />
      ) : null}

      <StrategyCalculatorLinks excludeInvestment={isIncomeStreamMode} />

      <p className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Planning estimates only. Not financial, tax, or legal advice.
      </p>
    </div>
  );
}

function WithdrawalResults({
  result,
  currentAge
}: {
  result: NonNullable<Phase1PanelProps["fireResult"]>["withdrawalRate"];
  currentAge: number;
}) {
  const ageProgress = computeAgeProgress(currentAge, result.estimatedFireAge);
  const fireAge = result.estimatedFireAge === null ? "Not reached" : formatNumber(result.estimatedFireAge);
  const fireYear = result.estimatedFireYear === null ? "Not reached" : String(result.estimatedFireYear);
  const impliedWithdrawalRate =
    result.impliedWithdrawalRate === null ? "Not reached" : formatPercent(result.impliedWithdrawalRate);

  return (
    <section className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard
          label="Estimated FIRE age"
          value={fireAge}
          tone={result.targetReached ? "default" : "warning"}
        />
        <ResultCard
          label="FIRE year"
          value={fireYear}
          tone={result.targetReached ? "default" : "warning"}
        />
        <ResultCard label="Assets at FIRE" value={formatCurrency(result.assetsAtFire)} />
        <ResultCard label="Implied withdrawal rate" value={impliedWithdrawalRate} />
      </div>
      <ProgressBar
        label="Progress to FIRE age"
        value={ageProgress.percent}
        note={ageProgress.note}
      />
      <section aria-label="Cash flow by age" className="space-y-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          Money in vs. money out, year by year
        </h2>
        <StrategyCashFlowChart
          rows={result.projectionRows}
          fireAge={result.estimatedFireAge}
        />
      </section>
      <ProjectionTable
        label="Portfolio Drawdown FIRE projection"
        rows={result.projectionRows}
        incomeLabel="Income"
        incomeHelp={termHelp["Income / savings"]}
        investmentReturnLabel="Investment return"
        headerNote="How returns are treated here: Investment return is your full growth — price gains plus dividends and interest — shown in its own column. Income never includes investment returns: before FIRE it is the savings you add, after FIRE it is your passive/guaranteed income."
        showCashFlow={false}
        showInvestmentReturn
        showAnnualIncome
        showExpenses
        showAssetsWithdrawn
        showFireGap={false}
        auditNotes={[
          "The app tests each possible FIRE age and chooses the first one where assets can survive through life expectancy. Only liquid investments count — your home is excluded.",
          "Each year your assets earn the Investment return (total return), then you cover spending. Before FIRE, Income is what you add; after FIRE it is your passive/guaranteed income.",
          "Assets withdrawn is what you sell to cover the spending your income didn't, grossed up for simple tax when enabled. It is 0 when income already covers expenses — so your investment returns keep compounding and the balance grows.",
          "Expenses shows your retirement spending (grossed up for simple tax when enabled). Ending assets = starting + investment return − assets withdrawn (+ any home-sale proceeds)."
        ]}
      />
    </section>
  );
}

function IncomeStreamResults({ result }: { result: NonNullable<Phase1PanelProps["fireResult"]>["incomeStream"] }) {
  const progress = result.incomeCoverageRatio * 100;

  return (
    <section className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard
          label="Income coverage ratio"
          value={formatPercent(result.incomeCoverageRatio)}
          tone={result.incomeCoverageRatio >= 1 ? "success" : "warning"}
        />
        <ResultCard
          label="Annual surplus / shortfall"
          value={formatSignedCurrency(result.shortfallOrSurplus)}
          tone={result.shortfallOrSurplus < 0 ? "warning" : "success"}
          help="Your income sources — Social Security, pension, rental, annuity, and any other guaranteed income — minus your annual retirement expenses. Investment returns and savings are not counted in this mode. Positive means your income covers expenses; negative means a gap."
        />
        <ResultCard label="First shortfall age" value={result.firstShortfallAge ? formatNumber(result.firstShortfallAge) : "None"} tone={result.firstShortfallAge ? "warning" : "success"} />
        <ResultCard label="Coverage status" value={result.passes ? "Covered" : "Shortfall"} tone={result.passes ? "success" : "warning"} />
      </div>
      <ProgressBar
        label="Income coverage progress"
        value={progress}
        note={`${formatPercent(result.incomeCoverageRatio)} of annual expenses`}
      />
      <IncomeStreamProjectionTable
        label="Income Stream FIRE projection"
        rows={result.projectionRows}
        auditNotes={[
          "Income Stream FIRE ignores portfolio return and current assets.",
          "Before the Income Stream FIRE age, expenses and income-stream coverage are not tested.",
          "At and after the Income Stream FIRE age, the app compares income streams against annual retirement expenses.",
          "Positive surplus means income streams exceed expenses. Negative shortfall means income streams do not fully cover expenses."
        ]}
      />
    </section>
  );
}

function PrincipalPreservingResults({
  result,
  currentAge
}: {
  result: NonNullable<Phase1PanelProps["fireResult"]>["principalPreserving"];
  currentAge: number;
}) {
  const ageProgress = computeAgeProgress(currentAge, result.estimatedFireAge);
  const fireAge =
    result.estimatedFireAge === null ? "Not reached" : formatNumber(result.estimatedFireAge);
  const fireYear =
    result.estimatedFireYear === null ? "Not reached" : String(result.estimatedFireYear);

  return (
    <section className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <ResultCard
          label="Earliest Principal-Preserving FIRE age"
          value={fireAge}
          tone={result.passes ? "success" : "warning"}
        />
        <ResultCard
          label="FIRE year"
          value={fireYear}
          tone={result.passes ? "default" : "warning"}
        />
        <ResultCard
          label="Principal floor"
          value={formatCurrency(result.principalFloor)}
          tone={result.passes ? "default" : "warning"}
        />
        <ResultCard label="Spendable income" value={formatCurrency(result.spendableIncome)} />
        <ResultCard
          label="Annual surplus / shortfall"
          value={formatSignedCurrency(result.shortfallOrSurplus)}
          tone={result.shortfallOrSurplus < 0 ? "warning" : "success"}
          help="Your spendable income — guaranteed income (Social Security, pension, rent) plus the cash yield (dividends and interest) your investments pay out — minus your annual retirement expenses. It excludes selling principal. Positive means you can live on income without touching savings."
        />
        <ResultCard
          label="First principal dip age"
          value={result.firstPrincipalDipAge ? formatNumber(result.firstPrincipalDipAge) : "None"}
          tone={result.firstPrincipalDipAge ? "warning" : "success"}
        />
      </div>
      {result.passes ? null : (
        <div className="rounded-2xl border border-[var(--negative)] bg-[var(--negative-bg)] p-5 text-sm font-medium leading-relaxed text-[var(--negative)] shadow-sm">
          Not reached under current assumptions. No age from now through life expectancy keeps income
          plus cash-generating return at or above expenses while preserving the principal floor. The
          projection below shows the retire-now scenario, where assets first dip below the floor at age{" "}
          {result.firstPrincipalDipAge ? formatNumber(result.firstPrincipalDipAge) : "life expectancy"}.
          Try a higher savings rate, lower expenses, more income, or a higher cash-generating return.
        </div>
      )}
      <ProgressBar
        label="Progress to FIRE age"
        value={ageProgress.percent}
        note={ageProgress.note}
      />
      <ProjectionTable
        label="Principal-Preserving FIRE projection"
        rows={result.projectionRows}
        incomeLabel="Spendable income (incl. yield)"
        investmentReturnLabel="Appreciation (unspent)"
        cashGeneratingReturnLabel="Cash yield"
        headerNote="How returns are treated here: your total return is split in two. Appreciation (unspent) is price growth that stays invested and grows the principal you keep. Cash yield is dividends and interest — before FIRE it is reinvested (still shown in its own column), after FIRE it is spendable and counted inside Spendable income."
        showCashFlow={false}
        showInvestmentReturn
        showAnnualIncome
        showExpenses
        showCashGeneratingReturn
        showFireGap={false}
        highlightDip
        auditNotes={[
          "The app finds the earliest age where assets stay at or above the FIRE-age principal floor through life expectancy. The floor is shown in the cards above.",
          "Appreciation (unspent) is price growth only — it grows the principal you keep. Cash yield is the dividends and interest your assets paid that year.",
          "Before FIRE, cash yield is reinvested: assets grow by appreciation + cash yield + your savings. After FIRE you live on guaranteed income + cash yield without selling.",
          "Spendable income (incl. yield) after FIRE = passive/guaranteed income + cash yield. The mode passes only while assets stay at or above the floor.",
          "If no age qualifies, the projection shows the retire-now scenario and red-tints any year that would fall below the floor."
        ]}
      />
    </section>
  );
}

function ProjectionTable({
  label,
  rows,
  incomeLabel = "Income",
  incomeHelp,
  investmentReturnLabel = "Investment return",
  cashGeneratingReturnLabel = "Cash-generating return",
  headerNote,
  showCashFlow = true,
  showInvestmentReturn = false,
  showAnnualIncome = false,
  showExpenses = false,
  showAssetsWithdrawn = false,
  showCashGeneratingReturn = false,
  showFireTarget = false,
  showIncomeCoverage = false,
  showPrincipalFloor = false,
  showFireGap = true,
  highlightDip = false,
  auditNotes
}: {
  label: string;
  rows: Phase1ProjectionRow[];
  incomeLabel?: string;
  incomeHelp?: string;
  investmentReturnLabel?: string;
  cashGeneratingReturnLabel?: string;
  headerNote?: string;
  showCashFlow?: boolean;
  showInvestmentReturn?: boolean;
  showAnnualIncome?: boolean;
  showExpenses?: boolean;
  showAssetsWithdrawn?: boolean;
  showCashGeneratingReturn?: boolean;
  showFireTarget?: boolean;
  showIncomeCoverage?: boolean;
  showPrincipalFloor?: boolean;
  showFireGap?: boolean;
  highlightDip?: boolean;
  auditNotes: string[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Year-by-year projection</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          A compact audit trail for how assets move over time. Currency values are shown in compact
          form ($k / $M).
        </p>
        {headerNote ? (
          <p className="mt-2 rounded-xl bg-gray-50 px-3 py-2 text-sm leading-relaxed text-gray-600">
            {headerNote}
          </p>
        ) : null}
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table
          aria-label={label}
          className="min-w-full border-collapse text-sm [&_td]:border [&_td]:border-[var(--border)] [&_td]:text-center [&_th]:border [&_th]:border-[var(--border)] [&_th]:text-center"
        >
          <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">Age</th>
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel
                  label="Starting assets"
                  help="Projected FIRE assets at the beginning of the row."
                />
              </th>
              {showCashFlow ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="Cash flow" />
                </th>
              ) : null}
              {showInvestmentReturn ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label={investmentReturnLabel} />
                </th>
              ) : null}
              {showAnnualIncome ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label={incomeLabel} help={incomeHelp} />
                </th>
              ) : null}
              {showExpenses ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="Expenses" />
                </th>
              ) : null}
              {showAssetsWithdrawn ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="Assets withdrawn" />
                </th>
              ) : null}
              {showCashGeneratingReturn ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label={cashGeneratingReturnLabel} />
                </th>
              ) : null}
              {showFireTarget ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="FIRE target" />
                </th>
              ) : null}
              {showIncomeCoverage ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="Income coverage" />
                </th>
              ) : null}
              {showPrincipalFloor ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="Principal floor" />
                </th>
              ) : null}
              {showFireGap ? (
                <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">
                  <InfoLabel label="FIRE gap" />
                </th>
              ) : null}
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel
                  label="Ending assets"
                  help="Projected FIRE assets at the end of the row."
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => {
              const dipHighlight = highlightDip && row.principalPreserved === false;

              return (
                <tr
                  key={`${row.year}-${row.age}`}
                  className={
                    row.depleted || dipHighlight
                      ? "bg-[var(--negative-bg)]"
                      : "odd:bg-white even:bg-gray-50 hover:bg-[var(--green-50)]"
                  }
                >
                  <td className="whitespace-nowrap px-2.5 py-2.5 font-medium text-gray-900 tabular-nums sm:px-4 sm:py-3">
                    {row.age}
                  </td>
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                    {formatCompactCurrency(row.startingAssets)}
                  </td>
                  {showCashFlow ? (
                    <td
                      className={cn(
                        "whitespace-nowrap px-2.5 py-2.5 text-right font-medium tabular-nums sm:px-4 sm:py-3",
                        row.cashFlow >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                      )}
                    >
                      {formatSignedCompactCurrency(row.cashFlow)}
                    </td>
                  ) : null}
                  {showInvestmentReturn ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-[var(--positive)] tabular-nums sm:px-4 sm:py-3">
                      {formatSignedCompactCurrency(row.investmentReturn ?? 0)}
                    </td>
                  ) : null}
                  {showAnnualIncome ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.annualIncome ?? 0)}
                    </td>
                  ) : null}
                  {showExpenses ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.annualExpenses ?? 0)}
                    </td>
                  ) : null}
                  {showAssetsWithdrawn ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.assetsWithdrawn ?? 0)}
                    </td>
                  ) : null}
                  {showCashGeneratingReturn ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.cashGeneratingReturn ?? 0)}
                    </td>
                  ) : null}
                  {showFireTarget ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.fireTarget ?? 0)}
                    </td>
                  ) : null}
                  {showIncomeCoverage ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {row.incomeCoverageRatio === undefined
                        ? "--"
                        : formatPercent(row.incomeCoverageRatio)}
                    </td>
                  ) : null}
                  {showPrincipalFloor ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {row.principalFloor === undefined
                        ? "--"
                        : formatCompactCurrency(row.principalFloor)}
                    </td>
                  ) : null}
                  {showFireGap ? (
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                      {formatCompactCurrency(row.fireGap)}
                    </td>
                  ) : null}
                  <td className="whitespace-nowrap px-2.5 py-2.5 text-right font-semibold text-gray-900 tabular-nums sm:px-4 sm:py-3">
                    {formatCompactCurrency(row.endingAssets)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <details className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 sm:px-6">
        <summary className="cursor-pointer font-semibold text-gray-800">
          Calculation details
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          {auditNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </details>
    </Card>
  );
}

function IncomeStreamProjectionTable({
  label,
  rows,
  auditNotes
}: {
  label: string;
  rows: Phase1ProjectionRow[];
  auditNotes: string[];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-gray-200 p-5 sm:p-6">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">Year-by-year projection</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          A compact audit trail for income-stream coverage. Currency values are shown in compact
          form ($k / $M).
        </p>
      </div>
      <div className="max-h-[560px] overflow-auto">
        <table
          aria-label={label}
          className="min-w-full border-collapse text-sm [&_td]:border [&_td]:border-[var(--border)] [&_td]:text-center [&_th]:border [&_th]:border-[var(--border)] [&_th]:text-center"
        >
          <thead className="sticky top-0 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-2.5 py-2.5 sm:px-4 sm:py-3">Age</th>
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel label="Income" />
              </th>
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel label="Expenses" />
              </th>
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel label="Surplus / shortfall" />
              </th>
              <th className="px-2.5 py-2.5 text-right sm:px-4 sm:py-3">
                <InfoLabel label="Income coverage" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {rows.map((row) => (
              <tr
                key={`${row.year}-${row.age}`}
                className="odd:bg-white even:bg-gray-50 hover:bg-[var(--green-50)]"
              >
                <td className="whitespace-nowrap px-2.5 py-2.5 font-medium text-gray-900 tabular-nums sm:px-4 sm:py-3">
                  {row.age}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                  {formatCompactCurrency(row.annualIncome ?? 0)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                  {formatCompactCurrency(row.annualExpenses ?? 0)}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-2.5 py-2.5 text-right font-medium tabular-nums sm:px-4 sm:py-3",
                    row.cashFlow >= 0 ? "text-[var(--positive)]" : "text-[var(--negative)]"
                  )}
                >
                  {formatSignedCompactCurrency(row.cashFlow)}
                </td>
                <td className="whitespace-nowrap px-2.5 py-2.5 text-right text-gray-700 tabular-nums sm:px-4 sm:py-3">
                  {row.incomeCoverageRatio === undefined
                    ? "--"
                    : formatPercent(row.incomeCoverageRatio)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <details className="border-t border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 sm:px-6">
        <summary className="cursor-pointer font-semibold text-gray-800">
          Calculation details
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          {auditNotes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </div>
      </details>
    </Card>
  );
}
