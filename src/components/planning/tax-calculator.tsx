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
  const [ordinaryIncome, setOrdinaryIncome] = useState(100_000);
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
      ordinaryIncome,
      traditionalWithdrawals,
      pretaxContributions,
      longTermGains,
      children,
      seniors65,
      stateRatePercent
    }),
    [
      filingStatus,
      ordinaryIncome,
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
          Estimate your 2026 federal income tax with retirement accounts, long-term capital gains,
          dependents, and a flat state rate. Built on the official 2026 figures (IRS Rev. Proc.
          2025-32): the brackets, standard deduction, capital-gains rates, and Child Tax Credit.
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
            id="tax-ordinary-income"
            label="Wages / other ordinary income"
            value={ordinaryIncome}
            onChange={setOrdinaryIncome}
            suffix="per year"
            step={1_000}
            help="Gross wages plus other ordinary income — interest, non-qualified dividends, taxable pensions, and the like. Don't include long-term capital gains or Roth withdrawals here."
            note="Taxed at the ordinary 2026 brackets after the standard deduction."
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
            help="Pre-tax contributions to a traditional 401(k), traditional IRA, or HSA. These come out of income before tax is figured, so they lower your taxable income. Don't enter Roth contributions here."
            note="Subtracted from your ordinary income before tax is calculated."
          />

          <NumberInput
            id="tax-ltcg"
            label="Long-term capital gains / qualified dividends"
            value={longTermGains}
            onChange={setLongTermGains}
            suffix="per year"
            step={1_000}
            help="Gains on assets held more than a year, plus qualified dividends. These get the lower 0%/15%/20% rates, stacked on top of your ordinary income based on total taxable income."
            note="Stacked on top of ordinary income, then taxed at 0% / 15% / 20%."
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
            context={`federal ${formatCurrency(result.federalTaxAfterCredits)} + state ${formatCurrency(
              result.stateTax
            )}`}
          />
          <ResultCard
            label="After-tax income"
            value={formatCurrency(result.afterTaxIncome)}
            context={`on ${formatCurrency(result.grossIncome)} of gross income`}
          />
          <ResultCard
            label="Effective tax rate"
            value={PERCENT_FORMATTER.format(result.effectiveTaxRate)}
            help="Total tax divided by gross income. It's lower than your top bracket because only the income inside each bracket is taxed at that bracket's rate."
            context={`marginal bracket: ${PERCENT_FORMATTER.format(result.marginalOrdinaryRate)}`}
          />
          <ResultCard
            label="Total taxable income"
            value={formatCurrency(result.totalTaxableIncome)}
            context={`standard deduction: ${formatCurrency(result.standardDeduction)}`}
            description={
              <>
                Ordinary tax {formatCurrency(result.ordinaryTax)} + capital-gains tax{" "}
                {formatCurrency(result.capitalGains.tax)}
                {result.childTaxCredit > 0
                  ? ` − Child Tax Credit ${formatCurrency(result.childTaxCredit)}`
                  : ""}
                .
              </>
            }
          />
        </div>
      </div>

      <p className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Estimate only — not tax advice. 2026 federal rules (IRS Rev. Proc. 2025-32) + a flat state
        rate you enter. Does not include AMT, NIIT, itemized deductions, state-specific rules,
        payroll/FICA, or every credit. Consult a tax professional.
      </p>
    </div>
  );
}
