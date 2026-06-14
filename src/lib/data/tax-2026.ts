// 2026 U.S. federal income-tax constants — tax year 2026 (returns filed in
// early 2027).
//
// SOURCE: IRS Revenue Procedure 2025-32 (the annual inflation-adjustment
// release for tax year 2026), as tabulated by the Tax Foundation. Every figure
// below is the official, inflation-adjusted 2026 amount — NOT a projection.
// These are the numbers the tax calculator pins with rule-based tests so a
// future edit can't silently change them. If you update a value here, update
// the matching pinned test in src/tests/planning/tax-calc.test.ts.
//
// Framework-free (no "use client") so both the calc module and the test suite
// can import these without pulling in any client runtime.

export type FilingStatus = "single" | "mfj";

// One marginal bracket: `rate` (as a decimal) applies to taxable income from
// `lower` up to `upper`. The top bracket uses Infinity as its upper bound.
export type TaxBracket = { rate: number; lower: number; upper: number };

// Ordinary-income brackets, by filing status — applied to ORDINARY taxable
// income (after the standard deduction). Progressive/marginal: each slice of
// income is taxed at its bracket's rate.
export const ORDINARY_BRACKETS_2026: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { rate: 0.1, lower: 0, upper: 12_400 },
    { rate: 0.12, lower: 12_400, upper: 50_400 },
    { rate: 0.22, lower: 50_400, upper: 105_700 },
    { rate: 0.24, lower: 105_700, upper: 201_775 },
    { rate: 0.32, lower: 201_775, upper: 256_225 },
    { rate: 0.35, lower: 256_225, upper: 640_600 },
    { rate: 0.37, lower: 640_600, upper: Infinity }
  ],
  mfj: [
    { rate: 0.1, lower: 0, upper: 24_800 },
    { rate: 0.12, lower: 24_800, upper: 100_800 },
    { rate: 0.22, lower: 100_800, upper: 211_400 },
    { rate: 0.24, lower: 211_400, upper: 403_550 },
    { rate: 0.32, lower: 403_550, upper: 512_450 },
    { rate: 0.35, lower: 512_450, upper: 768_700 },
    { rate: 0.37, lower: 768_700, upper: Infinity }
  ]
};

// Base standard deduction by filing status.
export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  single: 16_100,
  mfj: 32_200
};

// Additional standard deduction for age 65+ (and/or blind), per qualifying
// person. Single uses the (higher) unmarried amount; MFJ uses the per-spouse
// married amount, so two 65+ spouses get twice the MFJ add-on.
export const ADDITIONAL_STD_DEDUCTION_65_2026: Record<FilingStatus, number> = {
  single: 2_050,
  mfj: 1_650
};

// Long-term capital-gain / qualified-dividend rate thresholds, by filing
// status, based on TOTAL taxable income. `rate15Threshold` is the total
// taxable income at which the 15% rate begins (income below it is taxed at 0%);
// `rate20Threshold` is where the 20% rate begins.
export const CAPITAL_GAINS_THRESHOLDS_2026: Record<
  FilingStatus,
  { rate15Threshold: number; rate20Threshold: number }
> = {
  single: { rate15Threshold: 49_450, rate20Threshold: 545_500 },
  mfj: { rate15Threshold: 98_900, rate20Threshold: 613_700 }
};

// Child Tax Credit (2026). $2,200 per qualifying child, of which up to $1,700
// is refundable (the Additional Child Tax Credit). This estimate applies the
// CTC as a NONREFUNDABLE credit (it can't push federal tax below $0). The
// credit phases out above a MAGI threshold by $50 for each $1,000 — or
// fraction of $1,000 — that MAGI exceeds the threshold.
export const CHILD_TAX_CREDIT_2026 = {
  perChild: 2_200,
  refundablePerChild: 1_700,
  phaseoutThreshold: { single: 200_000, mfj: 400_000 } as Record<FilingStatus, number>,
  // Reduction per $1,000 (or fraction) of MAGI over the threshold.
  phaseoutPerThousand: 50
};

// FICA payroll tax (EMPLOYEE side), 2026. Applies ONLY to earned W-2 wages —
// not to retirement withdrawals, capital gains, or other unearned income. Pre-tax
// 401(k)/HSA contributions do NOT reduce the FICA wage base. Self-employed (SECA)
// pays both the employee and employer halves; that is not modeled here.
//
// SOURCE: SSA 2026 Cost-of-Living Adjustment (Social Security wage base) and the
// fixed statutory FICA/Additional-Medicare rates (IRC §§ 3101, 3121, 1401).
export const FICA_2026 = {
  // Social Security: 6.2% on wages up to the annual wage base ($184,500 for 2026).
  // Max employee SS tax = 0.062 × 184,500 = $11,439.
  socialSecurity: {
    rate: 0.062,
    wageBase: 184_500,
    maxTax: 11_439
  },
  // Medicare: 1.45% on ALL wages (no cap).
  medicare: {
    rate: 0.0145
  },
  // Additional Medicare: 0.9% on wages above a filing-status threshold. These
  // thresholds are fixed by law (NOT inflation-adjusted).
  additionalMedicare: {
    rate: 0.009,
    threshold: { single: 200_000, mfj: 250_000 } as Record<FilingStatus, number>
  }
};

// Net Investment Income Tax (NIIT), 2026 — 3.8% on the LESSER of net investment
// income or the amount by which MAGI exceeds a filing-status threshold. The
// thresholds are fixed by law (NOT inflation-adjusted). For this calculator, net
// investment income = the long-term capital gains / qualified dividends input.
//
// SOURCE: IRC § 1411.
export const NIIT_2026 = {
  rate: 0.038,
  threshold: { single: 200_000, mfj: 250_000 } as Record<FilingStatus, number>
};
