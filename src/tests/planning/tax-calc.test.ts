import { describe, expect, it } from "vitest";
import {
  capitalGainsTaxFor,
  childTaxCreditFor,
  computeTax,
  marginalOrdinaryRateFor,
  ordinaryTaxFor,
  standardDeductionFor,
  type TaxInput
} from "@/lib/calculations/tax";
import {
  ADDITIONAL_STD_DEDUCTION_65_2026,
  CAPITAL_GAINS_THRESHOLDS_2026,
  CHILD_TAX_CREDIT_2026,
  ORDINARY_BRACKETS_2026,
  STANDARD_DEDUCTION_2026
} from "@/lib/data/tax-2026";

// A complete, valid input with everything zeroed — tests override only the
// fields they care about.
function baseInput(overrides: Partial<TaxInput> = {}): TaxInput {
  return {
    filingStatus: "single",
    ordinaryIncome: 0,
    traditionalWithdrawals: 0,
    pretaxContributions: 0,
    longTermGains: 0,
    children: 0,
    seniors65: 0,
    stateRatePercent: 0,
    ...overrides
  };
}

// ---------------------------------------------------------------------------
// Rule-pinned constants: a future edit to the 2026 numbers must break a test,
// not silently change everyone's estimate. (IRS Rev. Proc. 2025-32.)
// ---------------------------------------------------------------------------
describe("2026 constants (pinned to IRS Rev. Proc. 2025-32)", () => {
  it("pins the standard deduction", () => {
    expect(STANDARD_DEDUCTION_2026.single).toBe(16_100);
    expect(STANDARD_DEDUCTION_2026.mfj).toBe(32_200);
  });

  it("pins the 65+ additional standard deduction", () => {
    expect(ADDITIONAL_STD_DEDUCTION_65_2026.single).toBe(2_050);
    expect(ADDITIONAL_STD_DEDUCTION_65_2026.mfj).toBe(1_650);
  });

  it("pins the single ordinary brackets", () => {
    expect(ORDINARY_BRACKETS_2026.single).toEqual([
      { rate: 0.1, lower: 0, upper: 12_400 },
      { rate: 0.12, lower: 12_400, upper: 50_400 },
      { rate: 0.22, lower: 50_400, upper: 105_700 },
      { rate: 0.24, lower: 105_700, upper: 201_775 },
      { rate: 0.32, lower: 201_775, upper: 256_225 },
      { rate: 0.35, lower: 256_225, upper: 640_600 },
      { rate: 0.37, lower: 640_600, upper: Infinity }
    ]);
  });

  it("pins the MFJ ordinary brackets", () => {
    expect(ORDINARY_BRACKETS_2026.mfj).toEqual([
      { rate: 0.1, lower: 0, upper: 24_800 },
      { rate: 0.12, lower: 24_800, upper: 100_800 },
      { rate: 0.22, lower: 100_800, upper: 211_400 },
      { rate: 0.24, lower: 211_400, upper: 403_550 },
      { rate: 0.32, lower: 403_550, upper: 512_450 },
      { rate: 0.35, lower: 512_450, upper: 768_700 },
      { rate: 0.37, lower: 768_700, upper: Infinity }
    ]);
  });

  it("pins the long-term cap-gains thresholds", () => {
    expect(CAPITAL_GAINS_THRESHOLDS_2026.single).toEqual({
      rate15Threshold: 49_450,
      rate20Threshold: 545_500
    });
    expect(CAPITAL_GAINS_THRESHOLDS_2026.mfj).toEqual({
      rate15Threshold: 98_900,
      rate20Threshold: 613_700
    });
  });

  it("pins the Child Tax Credit amounts", () => {
    expect(CHILD_TAX_CREDIT_2026.perChild).toBe(2_200);
    expect(CHILD_TAX_CREDIT_2026.refundablePerChild).toBe(1_700);
    expect(CHILD_TAX_CREDIT_2026.phaseoutThreshold.mfj).toBe(400_000);
    expect(CHILD_TAX_CREDIT_2026.phaseoutThreshold.single).toBe(200_000);
    expect(CHILD_TAX_CREDIT_2026.phaseoutPerThousand).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// Standard deduction + 65+ add-ons.
// ---------------------------------------------------------------------------
describe("standardDeductionFor", () => {
  it("returns the base deduction with no seniors", () => {
    expect(standardDeductionFor("single", 0)).toBe(16_100);
    expect(standardDeductionFor("mfj", 0)).toBe(32_200);
  });

  it("adds the single 65+ add-on once", () => {
    expect(standardDeductionFor("single", 1)).toBe(16_100 + 2_050); // 18,150
  });

  it("adds the MFJ 65+ add-on per qualifying spouse", () => {
    expect(standardDeductionFor("mfj", 1)).toBe(32_200 + 1_650); // 33,850
    expect(standardDeductionFor("mfj", 2)).toBe(32_200 + 2 * 1_650); // 35,500
  });

  it("clamps seniors to the valid range for the filing status", () => {
    expect(standardDeductionFor("single", 5)).toBe(16_100 + 2_050);
    expect(standardDeductionFor("mfj", 9)).toBe(32_200 + 2 * 1_650);
  });
});

// ---------------------------------------------------------------------------
// PINNED SCENARIO 1: Single, $100,000 ordinary income, nothing else.
// OTI = 100,000 − 16,100 = 83,900.
// Tax = 10%·12,400 + 12%·(50,400−12,400) + 22%·(83,900−50,400)
//     = 1,240 + 4,560 + 7,370 = 13,170.
// ---------------------------------------------------------------------------
describe("pinned: single $100k ordinary income", () => {
  it("computes OTI = 83,900 and ordinary tax = 13,170", () => {
    const result = computeTax(baseInput({ ordinaryIncome: 100_000 }));
    expect(result.ordinaryTaxableIncome).toBe(83_900);
    expect(result.ordinaryTax).toBeCloseTo(1_240 + 4_560 + 7_370, 6);
    expect(result.ordinaryTax).toBeCloseTo(13_170, 6);
    // No gains, no credits, no state → federal == ordinary, total == federal.
    expect(result.capitalGains.tax).toBe(0);
    expect(result.federalTaxBeforeCredits).toBeCloseTo(13_170, 6);
    expect(result.federalTaxAfterCredits).toBeCloseTo(13_170, 6);
    expect(result.stateTax).toBe(0);
    expect(result.totalTax).toBeCloseTo(13_170, 6);
    expect(result.marginalOrdinaryRate).toBe(0.22);
    expect(result.effectiveTaxRate).toBeCloseTo(13_170 / 100_000, 6);
  });

  it("matches the standalone ordinaryTaxFor helper", () => {
    expect(ordinaryTaxFor(83_900, "single")).toBeCloseTo(13_170, 6);
  });
});

// ---------------------------------------------------------------------------
// PINNED SCENARIO 2: MFJ LTCG stacking. OTI = 80,000, LTCG = 40,000.
// MFJ thresholds: 15% from 98,900, 20% from 613,700.
//   amt0  = clamp(98,900 − 80,000, 0, 40,000) = 18,900
//   amt15 = clamp(613,700 − max(80,000, 98,900), 0, 40,000 − 18,900) = 21,100
//   amt20 = 0
//   tax   = 21,100 · 0.15 = 3,165
// ---------------------------------------------------------------------------
describe("pinned: MFJ LTCG stacking (OTI 80k, LTCG 40k)", () => {
  it("splits the gain 18,900 at 0% and 21,100 at 15%", () => {
    const split = capitalGainsTaxFor(80_000, 40_000, "mfj");
    expect(split.taxedAt0).toBe(18_900);
    expect(split.taxedAt15).toBe(21_100);
    expect(split.taxedAt20).toBe(0);
    expect(split.tax).toBeCloseTo(3_165, 6);
  });

  it("flows through computeTax with the standard deduction applied", () => {
    // Drive OTI to exactly 80,000 from wages: wages = 80,000 + std deduction.
    const std = standardDeductionFor("mfj", 0); // 32,200
    const result = computeTax(
      baseInput({
        filingStatus: "mfj",
        ordinaryIncome: 80_000 + std,
        longTermGains: 40_000
      })
    );
    expect(result.ordinaryTaxableIncome).toBe(80_000);
    expect(result.totalTaxableIncome).toBe(120_000);
    expect(result.capitalGains.taxedAt0).toBe(18_900);
    expect(result.capitalGains.taxedAt15).toBe(21_100);
    expect(result.capitalGains.tax).toBeCloseTo(3_165, 6);
  });

  it("pushes gains into the 20% band when total income is high enough (single)", () => {
    // Single, OTI = 545,500 (exactly the 20% threshold) → all gain at 20%.
    const split = capitalGainsTaxFor(545_500, 10_000, "single");
    expect(split.taxedAt0).toBe(0);
    expect(split.taxedAt15).toBe(0);
    expect(split.taxedAt20).toBe(10_000);
    expect(split.tax).toBeCloseTo(2_000, 6);
  });
});

// ---------------------------------------------------------------------------
// PINNED SCENARIO 3: Child Tax Credit phaseout above the MFJ $400k threshold.
// $50 reduction per $1,000 OR FRACTION over the threshold.
// ---------------------------------------------------------------------------
describe("pinned: Child Tax Credit phaseout", () => {
  it("gives the full credit at or below the threshold", () => {
    expect(childTaxCreditFor(2, 400_000, "mfj")).toBe(4_400);
    expect(childTaxCreditFor(3, 200_000, "single")).toBe(6_600);
  });

  it("reduces by $50 per whole $1,000 over the MFJ threshold", () => {
    // MAGI 410,000 → 10,000 over → 10 steps → $500 off → 4,400 − 500 = 3,900.
    expect(childTaxCreditFor(2, 410_000, "mfj")).toBe(3_900);
  });

  it("rounds a partial $1,000 step UP (the 'or fraction' rule)", () => {
    // MAGI 410,500 → 10,500 over → ceil(10.5) = 11 steps → $550 off → 3,850.
    expect(childTaxCreditFor(2, 410_500, "mfj")).toBe(3_850);
  });

  it("never goes below $0", () => {
    expect(childTaxCreditFor(1, 1_000_000, "mfj")).toBe(0);
  });

  it("applies the phaseout end-to-end through computeTax", () => {
    const result = computeTax(
      baseInput({
        filingStatus: "mfj",
        ordinaryIncome: 410_500,
        children: 2
      })
    );
    expect(result.childTaxCredit).toBe(3_850);
    // Credit is nonrefundable: federal-after = max(0, before − credit).
    expect(result.federalTaxAfterCredits).toBeCloseTo(
      Math.max(0, result.federalTaxBeforeCredits - 3_850),
      6
    );
  });
});

// ---------------------------------------------------------------------------
// Retirement-account handling, state tax, and aggregate outputs.
// ---------------------------------------------------------------------------
describe("computeTax integration", () => {
  it("adds traditional withdrawals to and subtracts pre-tax contributions from OTI", () => {
    const result = computeTax(
      baseInput({
        ordinaryIncome: 90_000,
        traditionalWithdrawals: 20_000,
        pretaxContributions: 10_000
      })
    );
    // OTI = 90,000 + 20,000 − 10,000 − 16,100 = 83,900 → same 13,170 as scenario 1.
    expect(result.ordinaryTaxableIncome).toBe(83_900);
    expect(result.ordinaryTax).toBeCloseTo(13_170, 6);
  });

  it("never lets ordinary taxable income go negative", () => {
    const result = computeTax(baseInput({ ordinaryIncome: 5_000 }));
    expect(result.ordinaryTaxableIncome).toBe(0);
    expect(result.ordinaryTax).toBe(0);
  });

  it("applies the flat state rate to total taxable income (ordinary + gains)", () => {
    const result = computeTax(
      baseInput({
        filingStatus: "mfj",
        ordinaryIncome: 80_000 + 32_200,
        longTermGains: 40_000,
        stateRatePercent: 5
      })
    );
    // Taxable income = 80,000 + 40,000 = 120,000; 5% → 6,000.
    expect(result.totalTaxableIncome).toBe(120_000);
    expect(result.stateTax).toBeCloseTo(6_000, 6);
    expect(result.totalTax).toBeCloseTo(result.federalTaxAfterCredits + 6_000, 6);
  });

  it("reports effective rate over gross income and after-tax income", () => {
    const result = computeTax(baseInput({ ordinaryIncome: 100_000 }));
    expect(result.grossIncome).toBe(100_000);
    expect(result.afterTaxIncome).toBeCloseTo(100_000 - 13_170, 6);
    expect(result.effectiveTaxRate).toBeCloseTo(0.1317, 6);
  });
});

describe("marginalOrdinaryRateFor", () => {
  it("returns the lowest bracket for $0 income", () => {
    expect(marginalOrdinaryRateFor(0, "single")).toBe(0.1);
  });

  it("returns the bracket containing the income", () => {
    expect(marginalOrdinaryRateFor(83_900, "single")).toBe(0.22);
    expect(marginalOrdinaryRateFor(700_000, "single")).toBe(0.37);
  });
});
