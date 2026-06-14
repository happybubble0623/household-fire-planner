"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import {
  CalculateBar,
  NumberInput,
  ResultCard,
  formatCurrency,
  useCalculateGate
} from "@/components/planning/planning-tool-panel";
import { computeTax, type TaxInput } from "@/lib/calculations/tax";
import type { FilingStatus } from "@/lib/data/tax-2026";

// Standalone 2026 federal income-tax estimator. Like the expense calculator, it
// is intentionally self-contained: it does NOT register in PLANNING_TOOLS (so it
// stays out of the hub grid and the per-tool footer) and feeds no other tool —
// it just produces a clean tax estimate. The header/footer chrome mirrors the
// sibling calculators so it looks identical.

// Small select field styled to match the inline <select> used in the mortgage
// panel, with the same label + InfoPopover treatment as NumberInput.
function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  help,
  note
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  help: string;
  note?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <label htmlFor={id}>{label}</label>
        <InfoPopover label={label} content={help} />
      </div>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{note}</p> : null}
    </div>
  );
}

// One line in the tax breakdown: a label on the left, a currency amount on the
// right. `emphasis` styles the total row; `muted` styles credits/subtractions.
function BreakdownRow({
  label,
  value,
  emphasis = false,
  muted = false
}: {
  label: ReactNode;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <div
      className={
        emphasis
          ? "flex items-baseline justify-between gap-4 border-t border-gray-200 pt-3 text-sm font-semibold text-gray-900"
          : "flex items-baseline justify-between gap-4 text-sm text-gray-700"
      }
    >
      <span className={muted ? "text-gray-500" : undefined}>{label}</span>
      <span
        className={
          emphasis
            ? "shrink-0 font-bold tabular-nums"
            : muted
              ? "shrink-0 tabular-nums text-gray-500"
              : "shrink-0 tabular-nums"
        }
      >
        {value}
      </span>
    </div>
  );
}

const PERCENT_FORMATTER = new Intl.NumberFormat(undefined, {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const FILING_OPTIONS: ReadonlyArray<{ value: FilingStatus; label: string }> = [
  { value: "single", label: "Single" },
  { value: "mfj", label: "Married filing jointly" }
];

export function TaxCalculator() {
  const [filingStatus, setFilingStatus] = useState<FilingStatus>("single");
  const [w2Wages, setW2Wages] = useState(100_000);
  const [otherOrdinaryIncome, setOtherOrdinaryIncome] = useState(0);
  const [traditionalWithdrawals, setTraditionalWithdrawals] = useState(0);
  const [pretaxContributions, setPretaxContributions] = useState(0);
  const [longTermGains, setLongTermGains] = useState(0);
  const [children, setChildren] = useState(0);
  const [seniors65, setSeniors65] = useState(0);
  const [stateRatePercent, setStateRatePercent] = useState(0);

  const switchFiling = (next: FilingStatus) => {
    if (next === filingStatus) return;
    // Single allows at most one 65+ person; clamp when narrowing from MFJ.
    if (next === "single" && seniors65 > 1) setSeniors65(1);
    setFilingStatus(next);
  };

  const seniorOptions =
    filingStatus === "mfj"
      ? [
          { value: "0", label: "Neither of us" },
          { value: "1", label: "One of us" },
          { value: "2", label: "Both of us" }
        ]
      : [
          { value: "0", label: "No" },
          { value: "1", label: "Yes" }
        ];

  const input: TaxInput = useMemo(
    () => ({
      filingStatus,
      w2Wages,
      otherOrdinaryIncome,
      traditionalWithdrawals,
      pretaxContributions,
      longTermGains,
      children,
      seniors65,
      stateRatePercent
    }),
    [
      filingStatus,
      w2Wages,
      otherOrdinaryIncome,
      traditionalWithdrawals,
      pretaxContributions,
      longTermGains,
      children,
      seniors65,
      stateRatePercent
    ]
  );

  const liveResult = useMemo(() => computeTax(input), [input]);
  const gate = useCalculateGate(liveResult);
  const result = gate.value;

  // The credit actually applied against tax (nonrefundable, so it can't exceed
  // tax before credits). Keeps the breakdown's arithmetic exact.
  const appliedChildTaxCredit = result.federalTaxBeforeCredits - result.federalTaxAfterCredits;

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
          Tax calculator
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-500">
          Estimate your 2026 federal tax with retirement accounts, long-term capital gains,
          dependents, FICA payroll tax, the Net Investment Income Tax, and a flat state rate. Built
          on the official 2026 figures (IRS Rev. Proc. 2025-32): the brackets, standard deduction,
          capital-gains rates, and Child Tax Credit.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.85fr)]">
        <Card className="grid gap-5 p-6 sm:p-7">
          {/* Filing status — segmented pill toggle. */}
          <div>
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
              <span>Filing status</span>
              <InfoPopover
                label="Filing status"
                content="Single or Married filing jointly. It sets your tax brackets, standard deduction, and the income thresholds for capital-gains rates and the Child Tax Credit."
              />
            </div>
            <div
              className="mt-2 inline-flex w-full gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1"
              role="group"
              aria-label="Filing status"
            >
              {FILING_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => switchFiling(option.value)}
                  aria-pressed={filingStatus === option.value}
                  className={
                    filingStatus === option.value
                      ? "flex-1 rounded-lg bg-white px-3 py-2.5 text-[13px] font-semibold text-[var(--primary-hover)] shadow-sm"
                      : "flex-1 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-gray-600"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <NumberInput
            id="tax-w2-wages"
            label="W-2 wages (salary)"
            value={w2Wages}
            onChange={setW2Wages}
            suffix="per year"
            step={1_000}
            help="Gross salary from a W-2 job, before any deductions. This is taxed as ordinary income AND is the base for FICA payroll tax (Social Security + Medicare). Don't include capital gains, retirement withdrawals, or non-wage income here."
            note="Ordinary income + the base for FICA payroll tax."
          />

          <NumberInput
            id="tax-other-ordinary-income"
            label="Other ordinary income"
            value={otherOrdinaryIncome}
            onChange={setOtherOrdinaryIncome}
            suffix="per year"
            step={1_000}
            help="Non-wage ordinary income — taxable pensions, interest, non-qualified dividends, and the like. Taxed at the ordinary brackets but NOT subject to FICA. Don't include long-term capital gains or Roth withdrawals here."
            note="Ordinary income, but not subject to FICA payroll tax."
          />

          <NumberInput
            id="tax-trad-withdrawals"
            label="Traditional retirement withdrawals"
            value={traditionalWithdrawals}
            onChange={setTraditionalWithdrawals}
            suffix="per year"
            step={1_000}
            help="Withdrawals from traditional (pre-tax) 401(k)s and IRAs. These are taxed as ordinary income in the year you take them. Leave at 0 for Roth withdrawals, which are generally tax-free."
            note="Added to your ordinary income — taxed at regular rates, not the gains rates."
          />

          <NumberInput
            id="tax-pretax-contributions"
            label="Pre-tax contributions (401k / IRA / HSA)"
            value={pretaxContributions}
            onChange={setPretaxContributions}
            suffix="per year"
            step={1_000}
            help="Pre-tax contributions to a traditional 401(k), traditional IRA, or HSA. These come out of income before income tax is figured, so they lower your taxable income — but they do NOT reduce the FICA wage base, so payroll tax still applies to your full gross wages. Don't enter Roth contributions here."
            note="Lowers income tax, but not the FICA wage base."
          />

          <NumberInput
            id="tax-ltcg"
            label="Long-term capital gains / qualified dividends"
            value={longTermGains}
            onChange={setLongTermGains}
            suffix="per year"
            step={1_000}
            help="Gains on assets held more than a year, plus qualified dividends. These get the lower 0%/15%/20% rates, stacked on top of your ordinary income based on total taxable income. At higher incomes they also incur the 3.8% Net Investment Income Tax (NIIT)."
            note="Taxed at 0% / 15% / 20%, plus 3.8% NIIT above the MAGI threshold."
          />

          <NumberInput
            id="tax-children"
            label="Qualifying children"
            value={children}
            onChange={setChildren}
            step={1}
            help="Number of qualifying children under 17 for the Child Tax Credit ($2,200 each in 2026). The credit phases out at higher incomes."
            note="Each is worth a $2,200 credit, reduced at higher incomes."
          />

          <SelectField
            id="tax-seniors"
            label="Age 65 or older"
            value={String(seniors65)}
            onChange={(value) => setSeniors65(Number(value))}
            options={seniorOptions}
            help="Age 65+ adds to your standard deduction — $2,050 (single) or $1,650 per qualifying spouse (married filing jointly) for 2026."
            note="Adds the 2026 age-65 standard deduction amount."
          />

          <NumberInput
            id="tax-state-rate"
            label="State income tax rate"
            value={stateRatePercent}
            onChange={setStateRatePercent}
            suffix="%"
            step={0.5}
            help="A single flat rate you enter, applied to your taxable income (ordinary income plus gains). This is a simplification — real state taxes have their own brackets, deductions, and rules. Enter 0 for no-income-tax states."
            note="Simplified flat-rate estimate — not a state-specific calculation."
          />
        </Card>

        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard
            label="Estimated total tax"
            value={formatCurrency(result.totalTax)}
            hero
            context={`federal ${formatCurrency(
              result.federalTaxAfterCredits
            )} + FICA ${formatCurrency(result.fica.total)}${
              result.niit > 0 ? ` + NIIT ${formatCurrency(result.niit)}` : ""
            } + state ${formatCurrency(result.stateTax)}`}
          />
          <ResultCard
            label="After-tax income"
            value={formatCurrency(result.afterTaxIncome)}
            context={`on ${formatCurrency(result.grossIncome)} of gross income`}
          />
          <ResultCard
            label="Effective tax rate"
            value={PERCENT_FORMATTER.format(result.effectiveTaxRate)}
            help="Total tax (income tax + capital-gains tax + NIIT + FICA + state) divided by gross income. It's lower than your top bracket because only the income inside each bracket is taxed at that bracket's rate."
            context={`marginal bracket: ${PERCENT_FORMATTER.format(result.marginalOrdinaryRate)}`}
          />

          {/* Full line-item breakdown of every component that sums to total tax. */}
          <Card className="grid gap-3 p-6 sm:p-7">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              <span>Tax breakdown</span>
              <InfoPopover
                label="Tax breakdown"
                content="Every component that makes up your estimated total tax. Federal income tax uses the ordinary brackets; capital-gains tax uses the 0/15/20% rates; NIIT is the 3.8% Net Investment Income Tax; FICA is employee-side Social Security + Medicare payroll tax on wages; state is your flat rate."
              />
            </div>

            <BreakdownRow
              label="Federal income tax (ordinary)"
              value={formatCurrency(result.ordinaryTax)}
            />
            <BreakdownRow
              label="Capital-gains tax"
              value={formatCurrency(result.capitalGains.tax)}
            />
            {appliedChildTaxCredit > 0 ? (
              <BreakdownRow
                label="Child Tax Credit"
                value={`− ${formatCurrency(appliedChildTaxCredit)}`}
                muted
              />
            ) : null}
            <BreakdownRow label="NIIT (3.8%)" value={formatCurrency(result.niit)} />
            <BreakdownRow
              label="FICA (Social Security + Medicare)"
              value={formatCurrency(result.fica.total)}
            />
            <BreakdownRow label="State income tax" value={formatCurrency(result.stateTax)} />
            <BreakdownRow label="Total tax" value={formatCurrency(result.totalTax)} emphasis />

            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              Total taxable income {formatCurrency(result.totalTaxableIncome)} after a{" "}
              {formatCurrency(result.standardDeduction)} standard deduction. FICA is the employee
              half only ({formatCurrency(result.fica.socialSecurity)} Social Security +{" "}
              {formatCurrency(result.fica.medicare)} Medicare
              {result.fica.additionalMedicare > 0
                ? ` + ${formatCurrency(result.fica.additionalMedicare)} Additional Medicare`
                : ""}
              ).
            </p>

            {result.childTaxCreditReductionFromInvestment > 0 ? (
              <p className="rounded-xl bg-[var(--soft)] px-3.5 py-3 text-xs leading-relaxed text-gray-600">
                Capital gains &amp; withdrawals raised your MAGI to{" "}
                {formatCurrency(result.magi)}, reducing your Child Tax Credit by{" "}
                {formatCurrency(result.childTaxCreditReductionFromInvestment)}.
              </p>
            ) : null}
          </Card>
        </div>
      </div>

      <p className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Estimate only — not tax advice. 2026 federal rules (IRS Rev. Proc. 2025-32) + a flat state
        rate you enter. FICA is the employee-side payroll tax (Social Security + Medicare) on W-2
        wages only; the employer half isn&apos;t shown and self-employment (SECA) tax isn&apos;t
        modeled. NIIT (3.8%) is included. Does not include AMT, itemized deductions, state-specific
        rules, or every credit. Consult a tax professional.
      </p>
    </div>
  );
}
