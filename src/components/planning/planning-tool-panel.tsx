"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { estimateSocialSecurityBenefit } from "@/lib/calculations/social-security";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { cn } from "@/lib/utils";
import {
  ClaimAgeComparisonChart,
  InvestmentChart,
  MortgageChart,
  MortgagePaymentDonut
} from "@/components/charts/calculator-charts";
import { HealthcareCostPanel } from "@/components/planning/healthcare-cost-panel";
import { relatedPlanningTools, type PlanningTool } from "@/lib/data/planning-tools";

export type { PlanningTool };

// Gates a memoized value behind a Calculate button: results only update when
// the user clicks Calculate. Editing inputs produces a new memoized `live`
// reference, which marks the shown value stale (edit mode).
export function useCalculateGate<T>(live: T) {
  const [committed, setCommitted] = useState(live);
  return {
    value: committed,
    stale: live !== committed,
    recalculate: () => setCommitted(live)
  };
}

export function CalculateBar({ stale, onRecalculate }: { stale: boolean; onRecalculate: () => void }) {
  return (
    <div
      className={
        stale
          ? "flex flex-col gap-3 rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-bg)] p-4 text-sm leading-relaxed text-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between"
          : "flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 text-sm leading-relaxed text-gray-600 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      }
    >
      <span>
        {stale
          ? "Edit mode: you changed an input. Hit Calculate to refresh the results below."
          : "Results below are up to date with your inputs."}
      </span>
      <Button type="button" onClick={onRecalculate} className="sm:flex-none">
        {stale ? "Calculate" : "Recalculate"}
      </Button>
    </div>
  );
}

const currencyFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const currencyWithCentsFormatter = new Intl.NumberFormat(undefined, {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2
});

export function formatCurrency(value: number, cents = false) {
  return (cents ? currencyWithCentsFormatter : currencyFormatter).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(value);
}

export function percentToDecimal(value: number) {
  return value / 100;
}

const toolFieldHelp: Record<string, string> = {
  "Loan amount":
    "How much you're borrowing — the home price minus your down payment. Don't include taxes or insurance.",
  "Annual interest rate":
    "The yearly rate on your loan quote or statement (e.g. 6.5). Use the note rate, not APR, for the closest principal-and-interest match.",
  "Loan term":
    "Years to pay the loan off — usually 30 or 15. A shorter term means higher monthly payments but much less total interest.",
  "Property tax (per year)":
    "Your annual property tax bill. Roughly 0.5%–2% of home value depending on the state; check the listing or county assessor.",
  "Home insurance (per year)":
    "Annual homeowner's insurance premium. Typically $1,000–$3,000; use your actual quote if you have one.",
  "PMI rate":
    "Private mortgage insurance, charged when your down payment is under 20%. Usually 0.3%–1.5% of the loan per year; it drops off automatically once you reach 20% equity. Enter 0 if you put 20%+ down.",
  "Monthly HOA":
    "Homeowners-association dues, if any (condos and some neighborhoods). Enter 0 if none.",
  "Start year":
    "The calendar year payments begin. Only shifts the year labels on the payoff chart.",
  "Starting balance": "The amount already invested before future contributions and growth.",
  "Monthly contribution": "The amount added each month before investment growth is applied.",
  "Annual return": "The annual growth assumption used for the investment projection.",
  "Time horizon": "The number of years included in the projection.",
  "Birth year": "Used to estimate Social Security eligibility year and full retirement age.",
  "Work start year": "The first year of covered earnings included in the simplified record.",
  "Work end year": "The last year of covered earnings included in the simplified record.",
  "Starting annual covered earnings": "The first year's Social Security-covered earnings before applying annual growth and taxable maximum limits.",
  "Annual earnings growth": "How quickly the simplified earnings estimate grows each year.",
  "Annual earnings by year": "Optional year-by-year Social Security wages. Manual year values override the simplified earnings projection for those years."
};

export type MortgageScheduleRow = {
  year: number;
  principal: number;
  interest: number;
  taxesAndFees: number;
  balance: number;
};

export function calculateMortgage({
  loanAmount,
  annualInterestRatePercent,
  termYears,
  startYear = new Date().getFullYear(),
  homeValue,
  propertyTaxAnnual = 0,
  pmiAnnualPercent = 0,
  homeInsuranceAnnual = 0,
  monthlyHoa = 0,
  loanType = "conventional"
}: {
  loanAmount: number;
  annualInterestRatePercent: number;
  termYears: number;
  startYear?: number;
  // Original home value (purchase price / appraised value). PMI cancellation is
  // pinned to the ORIGINAL value, not the loan. When omitted we assume a 10%
  // down payment (value = loan / 0.9) so a bare call still behaves sensibly.
  homeValue?: number;
  propertyTaxAnnual?: number;
  pmiAnnualPercent?: number;
  homeInsuranceAnnual?: number;
  monthlyHoa?: number;
  loanType?: string;
}) {
  const monthlyRate = percentToDecimal(annualInterestRatePercent) / 12;
  const paymentCount = Math.max(1, Math.round(termYears * 12));
  const monthlyPrincipalInterest =
    monthlyRate === 0
      ? loanAmount / paymentCount
      : (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -paymentCount));
  const monthlyTax = propertyTaxAnnual / 12;
  const monthlyInsurance = homeInsuranceAnnual / 12;
  const pmiMonthly = (loanAmount * percentToDecimal(pmiAnnualPercent)) / 12;
  const originalHomeValue = homeValue && homeValue > 0 ? homeValue : loanAmount / 0.9;
  // VA loans carry no PMI. For conventional loans, PMI cancels once you reach
  // 20% equity — i.e. the balance drops to 80% of the ORIGINAL home value
  // (borrower-requested at 80%, auto-terminating by 78% under the Homeowners
  // Protection Act / CFPB). FHA mortgage insurance generally runs the life of
  // the loan, so it never cancels here. We remove PMI at the first year-end the
  // balance reaches the 80%-of-value threshold.
  const pmiEligible = loanType !== "va" && pmiAnnualPercent > 0;
  const pmiCanCancel = loanType !== "fha";
  const pmiCancelBalance = 0.8 * originalHomeValue;

  const schedule: MortgageScheduleRow[] = [];
  let balance = loanAmount;
  let totalInterest = 0;
  let totalTaxesAndFees = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearBaseFees = 0;
  let monthsThisYear = 0;

  for (let month = 1; month <= paymentCount; month += 1) {
    const interest = balance * monthlyRate;
    const principal = Math.min(balance, monthlyPrincipalInterest - interest);
    balance -= principal;
    const baseFees = monthlyTax + monthlyInsurance + monthlyHoa;
    yearPrincipal += principal;
    yearInterest += interest;
    yearBaseFees += baseFees;
    monthsThisYear += 1;
    totalInterest += interest;

    if (month % 12 === 0 || month === paymentCount) {
      // PMI for the year is dropped once the year-end balance reaches 80% of the
      // original home value (or always, for FHA, until the loan is paid off).
      const pmiThisYear =
        pmiEligible && (!pmiCanCancel || balance > pmiCancelBalance)
          ? pmiMonthly * monthsThisYear
          : 0;
      const yearFees = yearBaseFees + pmiThisYear;
      totalTaxesAndFees += yearFees;
      schedule.push({
        year: startYear + Math.ceil(month / 12) - 1,
        principal: yearPrincipal,
        interest: yearInterest,
        taxesAndFees: yearFees,
        balance: Math.max(0, balance)
      });
      yearPrincipal = 0;
      yearInterest = 0;
      yearBaseFees = 0;
      monthsThisYear = 0;
    }
  }

  const monthlyTaxesAndFees =
    monthlyTax + monthlyInsurance + monthlyHoa + (pmiEligible ? pmiMonthly : 0);

  return {
    monthlyPrincipalInterest,
    monthlyTaxesAndFees,
    monthlyPayment: monthlyPrincipalInterest + monthlyTaxesAndFees,
    totalInterest,
    totalTaxesAndFees,
    totalPaid: monthlyPrincipalInterest * paymentCount,
    schedule
  };
}

export type InvestmentScheduleRow = {
  year: number;
  contributed: number;
  growth: number;
  balance: number;
};

export function calculateInvestment({
  startingBalance,
  monthlyContribution,
  annualReturnPercent,
  years,
  feePercent = 0
}: {
  startingBalance: number;
  monthlyContribution: number;
  annualReturnPercent: number;
  years: number;
  // Annual fund fee / expense ratio (percent). The effective return is the
  // gross return minus this fee: net = gross − fee. Defaults to 0 so callers
  // that don't model fees are unchanged.
  feePercent?: number;
}) {
  const monthlyReturn = percentToDecimal(annualReturnPercent - feePercent) / 12;
  const months = Math.max(0, Math.round(years * 12));
  const startYear = new Date().getFullYear();
  let balance = startingBalance;
  let contributions = 0;
  const schedule: InvestmentScheduleRow[] = [
    { year: startYear, contributed: startingBalance, growth: 0, balance: startingBalance }
  ];

  for (let month = 1; month <= months; month += 1) {
    balance = balance * (1 + monthlyReturn) + monthlyContribution;
    contributions += monthlyContribution;
    if (month % 12 === 0 || month === months) {
      const contributed = startingBalance + contributions;
      schedule.push({
        year: startYear + Math.ceil(month / 12),
        contributed,
        growth: balance - contributed,
        balance
      });
    }
  }

  return {
    endingBalance: balance,
    totalContributions: startingBalance + contributions,
    investmentGrowth: balance - startingBalance - contributions,
    schedule
  };
}

export function NumberInput({
  id,
  label,
  value,
  onChange,
  suffix,
  step = 1,
  help,
  note
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
  help?: string;
  // Short, always-visible basis/caption text shown under the field (e.g. the
  // source and year for a sourced default). Unlike `help` (tooltip-only), this
  // stays visible so users can immediately trust and edit a prefilled default.
  note?: ReactNode;
}) {
  const [draftValue, setDraftValue] = useState(() => String(value));
  const [isEditing, setIsEditing] = useState(false);
  const [hasUncommittedDraft, setHasUncommittedDraft] = useState(false);
  const displayedValue = isEditing || hasUncommittedDraft ? draftValue : String(value);
  const handleInputValue = (rawValue: string) => {
    setIsEditing(true);
    setDraftValue(rawValue);
    const parsed = parseEditableNumber(rawValue);
    if (Number.isFinite(parsed)) {
      setHasUncommittedDraft(false);
      onChange(parsed);
    } else {
      setHasUncommittedDraft(true);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <label htmlFor={id}>{label}</label>
        <InfoPopover
          label={label}
          content={
            help ??
            toolFieldHelp[label] ??
            "This assumption feeds the calculator result. Change it to compare planning scenarios."
          }
        />
      </div>
      <div className="mt-2 flex min-h-12 items-center rounded-xl border border-gray-200 bg-white px-4 shadow-sm focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          min={0}
          step={step}
          value={displayedValue}
          onChange={(event) => {
            handleInputValue(event.target.value);
          }}
          onInput={(event) => {
            handleInputValue(event.currentTarget.value);
          }}
          onFocus={() => {
            if (!hasUncommittedDraft) {
              setDraftValue(String(value));
            }
            setIsEditing(true);
          }}
          onBlur={() => {
            setIsEditing(false);
            setHasUncommittedDraft(!Number.isFinite(parseEditableNumber(draftValue)));
          }}
          onWheel={(event) => event.currentTarget.blur()}
          className="min-h-11 w-full border-0 bg-transparent py-2 text-base font-medium text-gray-900 outline-none"
        />
        {suffix ? <span className="pl-2 text-sm font-medium text-gray-500">{suffix}</span> : null}
      </div>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{note}</p> : null}
    </div>
  );
}

function parseEditableNumber(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return Number.NaN;
  return Number(trimmedValue);
}

// KPI result card (REDESIGN_SPEC §4): caption label, big tabular value,
// optional context line. `hero` bumps the value size for the headline number;
// `highlight` swaps the accent to gold (e.g. the best claiming age).
export function ResultCard({
  label,
  value,
  help,
  context,
  hero = false,
  highlight = false
}: {
  label: string;
  value: string;
  help?: string;
  context?: string;
  hero?: boolean;
  highlight?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-t-2 p-5",
        highlight ? "border-t-[var(--gold)]" : "border-t-[var(--primary)]"
      )}
    >
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
        <span>{label}</span>
        {help ? <InfoPopover label={label} content={help} /> : null}
      </p>
      <p
        className={cn(
          "mt-2 font-extrabold tracking-tight text-gray-900 tabular-nums",
          hero ? "text-4xl" : "text-[28px] leading-9"
        )}
      >
        {value}
      </p>
      {context ? (
        <p className="mt-1.5 text-xs font-semibold text-[var(--primary)]">{context}</p>
      ) : null}
    </Card>
  );
}

function formatSocialSecurityBenefit(result: ReturnType<typeof estimateSocialSecurityBenefit>) {
  if (!result.retirementEligible) return "Not eligible";
  return formatCurrency(result.estimatedMonthlyBenefitTodayDollars, true);
}

export function PlanningToolPanel({ tool }: { tool: PlanningTool }) {
  if (tool === "mortgage") return <MortgageCalculator />;
  if (tool === "investment") return <InvestmentCalculator />;
  if (tool === "healthcare") return <HealthcareCostPanel />;
  return <SocialSecurityCalculator />;
}

// "More planning tools" footer linking to the sibling calculators. Single
// source of truth is PLANNING_TOOLS, so adding a tool updates every surface.
export function RelatedTools({ current }: { current: PlanningTool }) {
  const tools = relatedPlanningTools(current);
  if (tools.length === 0) return null;

  return (
    <nav aria-label="More planning tools" className="space-y-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
        More planning tools
      </h2>
      <div className="grid gap-4 md:grid-cols-3">
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
    </nav>
  );
}

export function ToolShell({
  title,
  description,
  currentTool,
  children
}: {
  title: string;
  description: string;
  currentTool: PlanningTool;
  children: ReactNode;
}) {
  return (
    <div className="space-y-8">
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
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-500">{description}</p>
      </div>
      {children}
      <RelatedTools current={currentTool} />
      <p className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Planning estimates only. Not financial, tax, or legal advice.
      </p>
    </div>
  );
}

function MortgageCalculator() {
  const [loanAmount, setLoanAmount] = useState(500_000);
  const [homeValue, setHomeValue] = useState(600_000);
  const [annualInterestRatePercent, setAnnualInterestRatePercent] = useState(6.5);
  const [termYears, setTermYears] = useState(30);
  const [startYear, setStartYear] = useState(new Date().getFullYear());
  // National-average starting points (see the visible basis notes at each field):
  // property tax ≈ 0.9% of a $500k home (ATTOM 2025 national avg); insurance ≈
  // the 2025 US average homeowner premium. Both vary widely and are editable.
  const [propertyTaxAnnual, setPropertyTaxAnnual] = useState(4_500);
  const [homeInsuranceAnnual, setHomeInsuranceAnnual] = useState(2_400);
  const [pmiAnnualPercent, setPmiAnnualPercent] = useState(0.5);
  const [monthlyHoa, setMonthlyHoa] = useState(0);
  const [loanType, setLoanType] = useState("conventional");
  // One switch to exclude the whole optional block without zeroing each field.
  // Typed values are preserved so toggling back restores them.
  const [includeFees, setIncludeFees] = useState(true);
  const liveResult = useMemo(
    () =>
      calculateMortgage({
        loanAmount,
        homeValue,
        annualInterestRatePercent,
        termYears,
        startYear,
        propertyTaxAnnual: includeFees ? propertyTaxAnnual : 0,
        homeInsuranceAnnual: includeFees ? homeInsuranceAnnual : 0,
        pmiAnnualPercent: includeFees ? pmiAnnualPercent : 0,
        monthlyHoa: includeFees ? monthlyHoa : 0,
        loanType
      }),
    [
      annualInterestRatePercent,
      homeInsuranceAnnual,
      homeValue,
      includeFees,
      loanAmount,
      loanType,
      monthlyHoa,
      pmiAnnualPercent,
      propertyTaxAnnual,
      startYear,
      termYears
    ]
  );
  const gate = useCalculateGate(liveResult);
  const result = gate.value;

  return (
    <ToolShell
      title="Mortgage calculator"
      currentTool="mortgage"
      description="Estimate the full monthly payment — principal, interest, taxes, insurance, PMI, and HOA — and see how the loan pays down over time."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-4 p-6 sm:p-7">
          <NumberInput
            id="mortgage-loan"
            label="Loan amount"
            value={loanAmount}
            onChange={setLoanAmount}
            step={1000}
            note="Your number — the home price minus your down payment (not the price)."
          />
          <NumberInput
            id="mortgage-home-value"
            label="Home value (purchase price)"
            value={homeValue}
            onChange={setHomeValue}
            step={1000}
            help="The home's purchase price or appraised value. PMI is removed once your loan reaches 20% equity — 80% of this original value — so it sets when PMI drops off. The gap between this and the loan amount is your down payment."
            note="Your number — the purchase price. PMI drops once the balance falls to 80% of this value (the CFPB/HPA rule, 2026)."
          />
          <NumberInput
            id="mortgage-rate"
            label="Annual interest rate"
            value={annualInterestRatePercent}
            onChange={setAnnualInterestRatePercent}
            suffix="%"
            step={0.1}
            note="Default 6.5% — near the mid-2026 average 30-yr fixed rate (Freddie Mac PMMS). Rates change daily — use your quote."
          />
          <NumberInput
            id="mortgage-term"
            label="Loan term"
            value={termYears}
            onChange={setTermYears}
            suffix="years"
            note="Default 30 years — the most common term; 15-year cuts total interest sharply but raises the payment."
          />
          <details className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3" open={includeFees}>
            <summary className="cursor-pointer text-sm font-medium text-gray-800">
              Taxes, insurance &amp; fees (optional)
            </summary>
            <div className="mt-3 grid gap-4">
              <label className="flex min-h-12 items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium leading-relaxed text-gray-800 shadow-sm">
                <input
                  type="checkbox"
                  checked={includeFees}
                  onChange={(event) => setIncludeFees(event.target.checked)}
                  className="mt-1"
                />
                Include taxes, insurance &amp; fees in the payment
              </label>
              {includeFees ? (
                <>
                  <NumberInput
                    id="mortgage-property-tax"
                    label="Property tax (per year)"
                    value={propertyTaxAnnual}
                    onChange={setPropertyTaxAnnual}
                    step={100}
                    note="Default ≈ 0.9% of home value — the US average effective rate (ATTOM 2025). Varies widely by county; check the listing."
                  />
                  <NumberInput
                    id="mortgage-home-insurance"
                    label="Home insurance (per year)"
                    value={homeInsuranceAnnual}
                    onChange={setHomeInsuranceAnnual}
                    step={100}
                    note="Default ~$2,400/yr — near the 2025 US average premium (NerdWallet/Bankrate). Varies a lot by state & risk — use your quote."
                  />
                  <NumberInput
                    id="mortgage-pmi"
                    label="PMI rate"
                    value={pmiAnnualPercent}
                    onChange={setPmiAnnualPercent}
                    suffix="%"
                    step={0.1}
                    note="Default 0.5%/yr — mid-range PMI (typically 0.3%–1.5% when under 20% down). Drops at 20% equity; set 0 for VA or 20%+ down."
                  />
                  <NumberInput
                    id="mortgage-hoa"
                    label="Monthly HOA"
                    value={monthlyHoa}
                    onChange={setMonthlyHoa}
                    step={10}
                    note="Default $0 — set your condo/community dues if any."
                  />
                </>
              ) : (
                <p className="text-xs leading-relaxed text-gray-500">
                  Excluded — the monthly payment below is principal &amp; interest only. Your typed
                  values are kept and come back when you re-enable this.
                </p>
              )}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                  <label htmlFor="mortgage-loan-type">Loan type</label>
                  <InfoPopover
                    label="Loan type"
                    content="Pick whatever your lender quoted. Conventional: the standard loan; PMI applies under 20% down and drops at 20% equity. FHA: government-insured, easier to qualify, but its mortgage insurance often lasts the life of the loan (approximated here by the PMI rate). VA: for veterans/service members — no monthly mortgage insurance. If you're unsure, choose Conventional."
                  />
                </div>
                <select
                  id="mortgage-loan-type"
                  value={loanType}
                  onChange={(event) => setLoanType(event.target.value)}
                  className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
                >
                  <option value="conventional">Conventional</option>
                  <option value="fha">FHA</option>
                  <option value="va">VA (no PMI)</option>
                </select>
              </div>
              <NumberInput
                id="mortgage-start-year"
                label="Start year"
                value={startYear}
                onChange={setStartYear}
                step={1}
                note="Defaults to this year — only shifts the year labels on the payoff chart."
              />
            </div>
          </details>
        </Card>
        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard
            label="Estimated monthly payment"
            value={formatCurrency(result.monthlyPayment, true)}
            hero
            context={includeFees ? "principal, interest, taxes & fees" : "principal & interest only"}
          />
          <MortgagePaymentDonut
            principalInterest={result.monthlyPrincipalInterest}
            taxesAndFees={includeFees ? result.monthlyTaxesAndFees : 0}
            monthlyPayment={result.monthlyPayment}
          />
          <ResultCard label="Principal & interest / mo" value={formatCurrency(result.monthlyPrincipalInterest, true)} />
          {includeFees ? (
            <ResultCard label="Taxes, insurance & fees / mo" value={formatCurrency(result.monthlyTaxesAndFees, true)} />
          ) : null}
          <ResultCard
            label="Total interest"
            value={formatCurrency(result.totalInterest)}
            context={`over the ${termYears}-year term`}
          />
        </div>
      </div>
      <MortgageChart data={result.schedule} />
    </ToolShell>
  );
}

function InvestmentCalculator() {
  const [startingBalance, setStartingBalance] = useState(100_000);
  const [monthlyContribution, setMonthlyContribution] = useState(2_000);
  const [annualReturnPercent, setAnnualReturnPercent] = useState(7);
  const [years, setYears] = useState(15);
  const [feePercent, setFeePercent] = useState(0.1);
  const liveResult = useMemo(
    () =>
      calculateInvestment({
        startingBalance,
        monthlyContribution,
        annualReturnPercent,
        years,
        feePercent
      }),
    [annualReturnPercent, feePercent, monthlyContribution, startingBalance, years]
  );
  const gate = useCalculateGate(liveResult);
  const result = gate.value;

  return (
    <ToolShell
      title="Investment calculator"
      currentTool="investment"
      description="Project how a portfolio could grow from starting assets, monthly contributions, return, and time."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-4 p-6 sm:p-7">
          <NumberInput
            id="investment-starting-balance"
            label="Starting balance"
            value={startingBalance}
            onChange={setStartingBalance}
            step={1000}
            note="Your number — what's already invested today."
          />
          <NumberInput
            id="investment-monthly-contribution"
            label="Monthly contribution"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            step={100}
            note="Your number — what you add each month going forward."
          />
          <NumberInput
            id="investment-return"
            label="Annual return"
            value={annualReturnPercent}
            onChange={setAnnualReturnPercent}
            suffix="%"
            step={0.1}
            note="Default 7%/yr — ≈ the S&P 500's long-run real (after-inflation) return; before subtracting inflation it has averaged ~10% since 1926. An assumption, not a guarantee — try 5–6% too."
          />
          <NumberInput
            id="investment-fee"
            label="Annual fee / expense ratio"
            value={feePercent}
            onChange={setFeePercent}
            suffix="%"
            step={0.01}
            help="The yearly cost of your funds and any advisor, charged as a percent of assets. It's subtracted straight from your return (net = return − fee), so even a small fee compounds into a meaningfully lower balance over time."
            note="Default 0.10%/yr — a typical low-cost index fund expense ratio. Broad index ETFs run ~0.03–0.10%; actively managed funds or an advisor can be 0.5–1%+. Use your fund's figure."
          />
          <NumberInput
            id="investment-years"
            label="Time horizon"
            value={years}
            onChange={setYears}
            suffix="years"
            note="Your number — how long the money stays invested."
          />
        </Card>
        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard
            label="Projected ending balance"
            value={formatCurrency(result.endingBalance)}
            hero
            context={`in ${years} years`}
          />
          <ResultCard label="Total contributions" value={formatCurrency(result.totalContributions)} />
          <ResultCard
            label="Investment growth"
            value={formatCurrency(result.investmentGrowth)}
            context={
              result.totalContributions > 0
                ? `${Math.round((result.investmentGrowth / result.totalContributions) * 100)}% on top of what you put in`
                : undefined
            }
          />
        </div>
      </div>
      <InvestmentChart data={result.schedule} />
    </ToolShell>
  );
}

function SocialSecurityCalculator() {
  const [birthYear, setBirthYear] = useState(1985);
  const [workStartYear, setWorkStartYear] = useState(2010);
  const [workEndYear, setWorkEndYear] = useState(2052);
  const [startingAnnualCoveredEarnings, setStartingAnnualCoveredEarnings] = useState(80_000);
  const [annualEarningsGrowthPercent, setAnnualEarningsGrowthPercent] = useState(3);
  const [annualEarningsOverrides, setAnnualEarningsOverrides] = useState<Record<string, string>>({});
  const annualEarningsByYear = useMemo(
    () => parseAnnualEarningsByYear(annualEarningsOverrides),
    [annualEarningsOverrides]
  );
  const annualEarningsRows = useMemo(
    () =>
      buildAnnualEarningsRows({
        workStartYear,
        workEndYear,
        startingAnnualCoveredEarnings,
        annualEarningsGrowthPercent
      }),
    [
      annualEarningsGrowthPercent,
      startingAnnualCoveredEarnings,
      workEndYear,
      workStartYear
    ]
  );
  const hasAnnualEarningsByYear = Object.keys(annualEarningsByYear).length > 0;
  const socialSecurityInputBase = useMemo(
    () => ({
      birthYear,
      workStartYear,
      workEndYear,
      startingAnnualCoveredEarnings,
      annualEarningsGrowth: percentToDecimal(annualEarningsGrowthPercent),
      displayMode: "today_dollars" as const,
      annualEarningsByYear: hasAnnualEarningsByYear ? annualEarningsByYear : undefined
    }),
    [
      annualEarningsByYear,
      annualEarningsGrowthPercent,
      birthYear,
      hasAnnualEarningsByYear,
      startingAnnualCoveredEarnings,
      workEndYear,
      workStartYear
    ]
  );
  const gate = useCalculateGate(socialSecurityInputBase);
  const committedInput = gate.value;
  const baseResult = useMemo(
    () => estimateSocialSecurityBenefit({ ...committedInput, claimingAge: 67 }),
    [committedInput]
  );
  const age62Result = useMemo(
    () => estimateSocialSecurityBenefit({ ...committedInput, claimingAge: 62 }),
    [committedInput]
  );
  const fullRetirementAgeResult = useMemo(
    () =>
      estimateSocialSecurityBenefit({
        ...committedInput,
        claimingAge: baseResult.fullRetirementAge
      }),
    [baseResult.fullRetirementAge, committedInput]
  );
  const age70Result = useMemo(
    () => estimateSocialSecurityBenefit({ ...committedInput, claimingAge: 70 }),
    [committedInput]
  );

  return (
    <ToolShell
      title="Social Security benefit calculator"
      currentTool="social-security"
      description="Estimate an unofficial worker benefit from covered earnings and compare common claiming ages."
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-4 p-6 sm:p-7">
          <NumberInput
            id="ss-birth-year"
            label="Birth year"
            value={birthYear}
            onChange={setBirthYear}
            note="Your number — sets your full retirement age (67 if born 1960 or later, per SSA) and eligibility year."
          />
          <NumberInput
            id="ss-work-start"
            label="Work start year"
            value={workStartYear}
            onChange={setWorkStartYear}
            note="Your number — the first year you had Social Security-covered earnings."
          />
          <NumberInput
            id="ss-work-end"
            label="Work end year"
            value={workEndYear}
            onChange={setWorkEndYear}
            note="Your number — the last year you expect covered earnings."
          />
          <NumberInput
            id="ss-starting-earnings"
            label="Starting annual covered earnings"
            value={startingAnnualCoveredEarnings}
            onChange={setStartingAnnualCoveredEarnings}
            step={1000}
            note="Your number — first-year wages; capped each year at the SSA taxable maximum ($184,500 in 2026)."
          />
          <NumberInput
            id="ss-earnings-growth"
            label="Annual earnings growth"
            value={annualEarningsGrowthPercent}
            onChange={setAnnualEarningsGrowthPercent}
            suffix="%"
            step={0.1}
            note="Default 3%/yr — a conservative long-run wage-growth basis (SSA's 2025 Trustees intermediate projection is ~3.6%)."
          />
          <details className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <summary className="cursor-pointer font-semibold text-gray-800">
              Improve accuracy with annual earnings
            </summary>
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
                <span>Annual earnings by year</span>
                <InfoPopover
                  label="Annual earnings by year"
                  content={toolFieldHelp["Annual earnings by year"]}
                />
              </div>
              <p className="text-xs leading-relaxed text-gray-500">
                Leave a year blank to use the projected wage. Enter a Social Security wage for a
                year to override the projection for that year.
              </p>
              <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white">
                <div className="grid min-w-[360px] grid-cols-[96px_minmax(0,1fr)] border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <span>Year</span>
                  <span>Social Security wage</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {annualEarningsRows.map((row) => {
                    const key = String(row.year);
                    const inputId = `ss-wage-${row.year}`;

                    return (
                      <div
                        key={row.year}
                        className="grid min-w-[360px] grid-cols-[96px_minmax(0,1fr)] items-center gap-3 px-4 py-3"
                      >
                        <label htmlFor={inputId} className="font-medium text-gray-700">
                          {row.year}
                          <span className="sr-only"> Social Security wage for {row.year}</span>
                        </label>
                        <input
                          id={inputId}
                          type="text"
                          inputMode="decimal"
                          value={annualEarningsOverrides[key] ?? ""}
                          placeholder={`Projected ${formatCurrency(row.projectedEarnings)}`}
                          aria-label={`Social Security wage for ${row.year}`}
                          onChange={(event) => {
                            const value = event.target.value;
                            setAnnualEarningsOverrides((current) => {
                              const next = { ...current };
                              if (value.trim()) {
                                next[key] = value;
                              } else {
                                delete next[key];
                              }
                              return next;
                            });
                          }}
                          onWheel={(event) => event.currentTarget.blur()}
                          className="min-h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </details>
        </Card>
        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard label="Full retirement age" value={formatNumber(baseResult.fullRetirementAge)} />
          <ResultCard
            label="Credit eligibility"
            value={`${baseResult.estimatedCredits} / ${baseResult.requiredCredits} credits`}
          />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <ResultCard
              label="At age 62"
              value={formatSocialSecurityBenefit(age62Result)}
              context="claim early, smaller check"
            />
            <ResultCard
              label="At full retirement age"
              value={formatSocialSecurityBenefit(fullRetirementAgeResult)}
              context="your unreduced benefit"
            />
            <ResultCard
              label="At age 70"
              value={formatSocialSecurityBenefit(age70Result)}
              highlight={age70Result.retirementEligible}
              context={age70Result.retirementEligible ? "largest monthly check" : undefined}
            />
          </div>
          {!baseResult.retirementEligible ? (
            <p className="rounded-2xl border border-[var(--negative)] bg-[var(--negative-bg)] p-5 text-sm font-medium leading-relaxed text-[var(--negative)] shadow-sm">
              Needs 40 Social Security credits before retirement benefits can be estimated.
            </p>
          ) : null}
          <p className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
            This calculator estimates one worker benefit. Spouse, divorced-spouse, and survivor
            benefit modeling needs spouse-specific inputs and should be added as a separate
            household Social Security enhancement.
          </p>
          <p className="rounded-2xl border border-gray-200 bg-white p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
            {baseResult.warning}
          </p>
        </div>
      </div>
      {baseResult.retirementEligible ? (
        <section aria-label="Claiming age comparison" className="mt-6 space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
            Monthly benefit by claiming age
          </h2>
          <ClaimAgeComparisonChart
            data={[
              {
                label: "Age 62",
                monthly: age62Result.estimatedMonthlyBenefitTodayDollars
              },
              {
                label: `Full retirement age (${formatNumber(baseResult.fullRetirementAge)})`,
                monthly: fullRetirementAgeResult.estimatedMonthlyBenefitTodayDollars
              },
              {
                label: "Age 70",
                monthly: age70Result.estimatedMonthlyBenefitTodayDollars
              }
            ]}
          />
        </section>
      ) : null}
      {/* The "How this estimate works" Q&A now lives server-rendered on the route
          page (src/lib/data/social-security-faq.ts) so crawlers see it without JS
          and it powers the FAQPage JSON-LD — not duplicated here in the client panel. */}
    </ToolShell>
  );
}

function parseAnnualEarningsByYear(value: Record<string, string>) {
  const rows: Record<string, number> = {};

  for (const [yearKey, amountValue] of Object.entries(value)) {
    const year = Number(yearKey);
    const amount = Number(amountValue.replace(/[$,\s]/g, ""));

    if (Number.isInteger(year) && year >= 1900 && Number.isFinite(amount) && amount >= 0) {
      rows[String(year)] = amount;
    }
  }

  return rows;
}

function buildAnnualEarningsRows({
  workStartYear,
  workEndYear,
  startingAnnualCoveredEarnings,
  annualEarningsGrowthPercent
}: {
  workStartYear: number;
  workEndYear: number;
  startingAnnualCoveredEarnings: number;
  annualEarningsGrowthPercent: number;
}) {
  const startYear = Math.min(workStartYear, workEndYear);
  const endYear = Math.max(workStartYear, workEndYear);
  const annualEarningsGrowth = percentToDecimal(annualEarningsGrowthPercent);

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => {
    const year = startYear + index;
    const yearsWorked = Math.max(0, year - workStartYear);

    return {
      year,
      projectedEarnings:
        startingAnnualCoveredEarnings * Math.pow(1 + annualEarningsGrowth, yearsWorked)
    };
  });
}
