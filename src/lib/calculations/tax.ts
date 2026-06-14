// 2026 federal income-tax estimate (current-year), with retirement-account
// handling, long-term capital gains stacked via the standard Qualified
// Dividends & Capital Gain worksheet method, the Child Tax Credit (applied as a
// nonrefundable credit), and a user-entered flat state rate.
//
// Pure, framework-free functions so both the client calculator and the test
// suite can import them. All constants come from tax-2026.ts (IRS Rev. Proc.
// 2025-32). This estimate deliberately omits AMT, NIIT, itemized deductions,
// state-specific rules, payroll/FICA, and most other credits — see the
// disclaimer in the UI.

import {
  ADDITIONAL_STD_DEDUCTION_65_2026,
  CAPITAL_GAINS_THRESHOLDS_2026,
  CHILD_TAX_CREDIT_2026,
  ORDINARY_BRACKETS_2026,
  STANDARD_DEDUCTION_2026,
  type FilingStatus
} from "@/lib/data/tax-2026";

export type TaxInput = {
  filingStatus: FilingStatus;
  // Wages and other ordinary income (interest, non-qualified dividends, etc.).
  ordinaryIncome: number;
  // Traditional (pre-tax) retirement withdrawals — taxed as ordinary income.
  traditionalWithdrawals: number;
  // Pre-tax retirement/HSA contributions — deducted from ordinary income.
  pretaxContributions: number;
  // Long-term capital gains plus qualified dividends.
  longTermGains: number;
  // Number of qualifying children for the Child Tax Credit.
  children: number;
  // Count of people age 65+ getting the additional standard deduction. Single:
  // 0 or 1. MFJ: 0, 1, or 2 (per qualifying spouse).
  seniors65: number;
  // Flat state income-tax rate the user enters, as a percent (e.g. 5 = 5%).
  stateRatePercent: number;
};

export type TaxResult = {
  standardDeduction: number;
  ordinaryTaxableIncome: number;
  totalTaxableIncome: number;
  ordinaryTax: number;
  // Breakdown of the long-term gains stacking.
  capitalGains: {
    taxedAt0: number;
    taxedAt15: number;
    taxedAt20: number;
    tax: number;
  };
  federalTaxBeforeCredits: number;
  childTaxCredit: number;
  federalTaxAfterCredits: number;
  stateTax: number;
  totalTax: number;
  grossIncome: number;
  afterTaxIncome: number;
  effectiveTaxRate: number; // total tax / gross income, as a decimal
  marginalOrdinaryRate: number; // top ordinary bracket rate applied, as a decimal
};

// Total standard deduction = base + per-person 65+ add-on. seniors65 is clamped
// to the valid range for the filing status (1 for single, 2 for MFJ).
export function standardDeductionFor(filingStatus: FilingStatus, seniors65: number): number {
  const maxSeniors = filingStatus === "mfj" ? 2 : 1;
  const seniors = Math.min(Math.max(Math.floor(seniors65), 0), maxSeniors);
  return (
    STANDARD_DEDUCTION_2026[filingStatus] +
    seniors * ADDITIONAL_STD_DEDUCTION_65_2026[filingStatus]
  );
}

// Progressive (marginal) tax on ordinary taxable income.
export function ordinaryTaxFor(taxableIncome: number, filingStatus: FilingStatus): number {
  const income = Math.max(0, taxableIncome);
  let tax = 0;
  for (const bracket of ORDINARY_BRACKETS_2026[filingStatus]) {
    if (income <= bracket.lower) break;
    const slice = Math.min(income, bracket.upper) - bracket.lower;
    tax += slice * bracket.rate;
  }
  return tax;
}

// The top ordinary bracket rate that applies at this taxable income (the
// marginal rate), as a decimal. Returns the lowest rate for $0 income.
export function marginalOrdinaryRateFor(
  taxableIncome: number,
  filingStatus: FilingStatus
): number {
  const income = Math.max(0, taxableIncome);
  const brackets = ORDINARY_BRACKETS_2026[filingStatus];
  let rate = brackets[0].rate;
  for (const bracket of brackets) {
    if (income > bracket.lower) {
      rate = bracket.rate;
    } else {
      break;
    }
  }
  return rate;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Long-term gains taxed via the stacking method: gains sit ON TOP of ordinary
// taxable income within the cap-gains brackets, based on total taxable income.
export function capitalGainsTaxFor(
  ordinaryTaxableIncome: number,
  longTermGains: number,
  filingStatus: FilingStatus
): { taxedAt0: number; taxedAt15: number; taxedAt20: number; tax: number } {
  const oti = Math.max(0, ordinaryTaxableIncome);
  const g = Math.max(0, longTermGains);
  const { rate15Threshold: t15, rate20Threshold: t20 } = CAPITAL_GAINS_THRESHOLDS_2026[
    filingStatus
  ];

  const taxedAt0 = clamp(t15 - oti, 0, g);
  const taxedAt15 = clamp(t20 - Math.max(oti, t15), 0, g - taxedAt0);
  const taxedAt20 = g - taxedAt0 - taxedAt15;
  const tax = taxedAt15 * 0.15 + taxedAt20 * 0.2;

  return { taxedAt0, taxedAt15, taxedAt20, tax };
}

// Child Tax Credit before applying it against tax: per-child amount reduced by
// the MAGI phaseout ($50 per $1,000, or fraction, over the threshold). Never
// below $0.
export function childTaxCreditFor(
  children: number,
  magi: number,
  filingStatus: FilingStatus
): number {
  const count = Math.max(0, Math.floor(children));
  if (count === 0) return 0;
  const base = count * CHILD_TAX_CREDIT_2026.perChild;
  const threshold = CHILD_TAX_CREDIT_2026.phaseoutThreshold[filingStatus];
  const excess = magi - threshold;
  if (excess <= 0) return base;
  // $50 per $1,000 OR FRACTION over the threshold → round the step count up.
  const steps = Math.ceil(excess / 1_000);
  const reduction = steps * CHILD_TAX_CREDIT_2026.phaseoutPerThousand;
  return Math.max(0, base - reduction);
}

export function computeTax(input: TaxInput): TaxResult {
  const filingStatus = input.filingStatus;
  const ordinaryIncome = Math.max(0, input.ordinaryIncome);
  const withdrawals = Math.max(0, input.traditionalWithdrawals);
  const contributions = Math.max(0, input.pretaxContributions);
  const longTermGains = Math.max(0, input.longTermGains);
  const children = Math.max(0, Math.floor(input.children));
  const stateRate = Math.max(0, input.stateRatePercent) / 100;

  const standardDeduction = standardDeductionFor(filingStatus, input.seniors65);

  // 1. Ordinary taxable income.
  const ordinaryTaxableIncome = Math.max(
    0,
    ordinaryIncome + withdrawals - contributions - standardDeduction
  );

  // 2. Ordinary tax.
  const ordinaryTax = ordinaryTaxFor(ordinaryTaxableIncome, filingStatus);

  // 3. Long-term gains, stacked on top of ordinary taxable income.
  const capitalGains = capitalGainsTaxFor(ordinaryTaxableIncome, longTermGains, filingStatus);

  // 4. Federal tax before credits.
  const federalTaxBeforeCredits = ordinaryTax + capitalGains.tax;

  // 5. Child Tax Credit (nonrefundable here). MAGI ≈ AGI.
  const magi = ordinaryIncome + withdrawals + longTermGains - contributions;
  const childTaxCredit = childTaxCreditFor(children, magi, filingStatus);
  const federalTaxAfterCredits = Math.max(0, federalTaxBeforeCredits - childTaxCredit);

  // 6. State tax — simplified flat rate on taxable income (ordinary + gains).
  const totalTaxableIncome = ordinaryTaxableIncome + longTermGains;
  const stateTax = stateRate * totalTaxableIncome;

  // 7. Totals and rates.
  const totalTax = federalTaxAfterCredits + stateTax;
  const grossIncome = ordinaryIncome + withdrawals + longTermGains;
  const afterTaxIncome = grossIncome - totalTax;
  const effectiveTaxRate = grossIncome > 0 ? totalTax / grossIncome : 0;
  const marginalOrdinaryRate = marginalOrdinaryRateFor(ordinaryTaxableIncome, filingStatus);

  return {
    standardDeduction,
    ordinaryTaxableIncome,
    totalTaxableIncome,
    ordinaryTax,
    capitalGains,
    federalTaxBeforeCredits,
    childTaxCredit,
    federalTaxAfterCredits,
    stateTax,
    totalTax,
    grossIncome,
    afterTaxIncome,
    effectiveTaxRate,
    marginalOrdinaryRate
  };
}
