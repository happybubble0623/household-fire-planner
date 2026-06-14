// 2026 federal-tax estimate (current-year), with retirement-account handling,
// long-term capital gains stacked via the standard Qualified Dividends & Capital
// Gain worksheet method, the Child Tax Credit (applied as a nonrefundable
// credit), employee-side FICA payroll tax, the Net Investment Income Tax (NIIT),
// and a user-entered flat state rate.
//
// Pure, framework-free functions so both the client calculator and the test
// suite can import them. All constants come from tax-2026.ts (IRS Rev. Proc.
// 2025-32 for income-tax figures; SSA/IRC statutory rates for FICA and NIIT).
// This estimate deliberately omits AMT, itemized deductions, state-specific
// rules, self-employment/SECA tax, and most other credits — see the disclaimer
// in the UI.

import {
  ADDITIONAL_STD_DEDUCTION_65_2026,
  CAPITAL_GAINS_THRESHOLDS_2026,
  CHILD_TAX_CREDIT_2026,
  FICA_2026,
  NIIT_2026,
  ORDINARY_BRACKETS_2026,
  STANDARD_DEDUCTION_2026,
  type FilingStatus
} from "@/lib/data/tax-2026";

export type TaxInput = {
  filingStatus: FilingStatus;
  // W-2 wages (salary). Counts as ordinary income AND is the base for FICA.
  w2Wages: number;
  // Other ordinary income (pensions, interest, non-qualified dividends, etc.) —
  // ordinary income, but NOT subject to FICA.
  otherOrdinaryIncome: number;
  // Traditional (pre-tax) retirement withdrawals — taxed as ordinary income,
  // NOT subject to FICA.
  traditionalWithdrawals: number;
  // Pre-tax retirement/HSA contributions — deducted from ordinary income. These
  // lower income tax but do NOT reduce the FICA wage base.
  pretaxContributions: number;
  // Long-term capital gains plus qualified dividends — capital-gains rates plus
  // NIIT, NOT subject to FICA.
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
  // Employee-side FICA payroll tax on W-2 wages only.
  fica: {
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    total: number;
  };
  // Net Investment Income Tax (3.8%) on long-term gains above the MAGI threshold.
  niit: number;
  // MAGI (≈ AGI) used for the CTC phaseout and the NIIT threshold.
  magi: number;
  // How much of the CTC phaseout reduction is attributable to capital gains +
  // traditional withdrawals raising MAGI (0 when the phaseout doesn't bite or
  // there are no gains/withdrawals to blame).
  childTaxCreditReductionFromInvestment: number;
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

// Employee-side FICA payroll tax on W-2 wages. Social Security is 6.2% up to the
// annual wage base; Medicare is 1.45% on all wages; Additional Medicare is 0.9%
// on wages above the filing-status threshold. Applies to GROSS wages — pre-tax
// 401(k)/HSA contributions do NOT reduce the FICA base.
export function ficaFor(
  w2Wages: number,
  filingStatus: FilingStatus
): { socialSecurity: number; medicare: number; additionalMedicare: number; total: number } {
  const wages = Math.max(0, w2Wages);
  const socialSecurity =
    FICA_2026.socialSecurity.rate * Math.min(wages, FICA_2026.socialSecurity.wageBase);
  const medicare = FICA_2026.medicare.rate * wages;
  const addlThreshold = FICA_2026.additionalMedicare.threshold[filingStatus];
  const additionalMedicare =
    FICA_2026.additionalMedicare.rate * Math.max(0, wages - addlThreshold);
  const total = socialSecurity + medicare + additionalMedicare;
  return { socialSecurity, medicare, additionalMedicare, total };
}

// Net Investment Income Tax: 3.8% on the LESSER of net investment income or the
// amount by which MAGI exceeds the filing-status threshold.
export function niitFor(
  netInvestmentIncome: number,
  magi: number,
  filingStatus: FilingStatus
): number {
  const nii = Math.max(0, netInvestmentIncome);
  const excess = Math.max(0, magi - NIIT_2026.threshold[filingStatus]);
  return NIIT_2026.rate * Math.min(nii, excess);
}

export function computeTax(input: TaxInput): TaxResult {
  const filingStatus = input.filingStatus;
  const w2Wages = Math.max(0, input.w2Wages);
  const otherOrdinaryIncome = Math.max(0, input.otherOrdinaryIncome);
  const withdrawals = Math.max(0, input.traditionalWithdrawals);
  const contributions = Math.max(0, input.pretaxContributions);
  const longTermGains = Math.max(0, input.longTermGains);
  const children = Math.max(0, Math.floor(input.children));
  const stateRate = Math.max(0, input.stateRatePercent) / 100;

  // Combined ordinary income (wages + non-wage ordinary income), before
  // deductions. FICA is applied separately to gross wages only.
  const ordinaryIncome = w2Wages + otherOrdinaryIncome;

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

  // 4. Federal income tax before credits.
  const federalTaxBeforeCredits = ordinaryTax + capitalGains.tax;

  // 5. Child Tax Credit (nonrefundable here). MAGI ≈ AGI. Pre-tax contributions
  // reduce MAGI; gains + withdrawals raise it (which can trigger the phaseout).
  const magi = ordinaryIncome + withdrawals + longTermGains - contributions;
  const childTaxCredit = childTaxCreditFor(children, magi, filingStatus);
  const federalTaxAfterCredits = Math.max(0, federalTaxBeforeCredits - childTaxCredit);

  // 5b. How much of the CTC phaseout is caused by gains + withdrawals raising
  // MAGI? Compare the credit with vs. without that unearned income.
  const magiExInvestment = ordinaryIncome - contributions;
  const childTaxCreditExInvestment = childTaxCreditFor(children, magiExInvestment, filingStatus);
  const childTaxCreditReductionFromInvestment = Math.max(
    0,
    childTaxCreditExInvestment - childTaxCredit
  );

  // 6. FICA — employee side, on GROSS W-2 wages only (not reduced by pre-tax
  // contributions, not charged on withdrawals or gains).
  const fica = ficaFor(w2Wages, filingStatus);

  // 7. NIIT — 3.8% on the lesser of net investment income (the LTCG input) or
  // MAGI over the threshold.
  const niit = niitFor(longTermGains, magi, filingStatus);

  // 8. State tax — simplified flat rate on taxable income (ordinary + gains).
  const totalTaxableIncome = ordinaryTaxableIncome + longTermGains;
  const stateTax = stateRate * totalTaxableIncome;

  // 9. Totals and rates. Total tax now includes FICA + NIIT.
  const totalTax = federalTaxAfterCredits + fica.total + niit + stateTax;
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
    fica,
    niit,
    magi,
    childTaxCreditReductionFromInvestment,
    stateTax,
    totalTax,
    grossIncome,
    afterTaxIncome,
    effectiveTaxRate,
    marginalOrdinaryRate
  };
}
