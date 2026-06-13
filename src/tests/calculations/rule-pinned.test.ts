/**
 * RULE-PINNED VALIDATION TESTS
 *
 * Each test below pins a *known input → known output* derived independently from
 * a primary authority (SSA, IRS, CMS/Medicare, healthcare.gov, CFPB, KFF) or a
 * standard finance formula. If a future edit changes a constant or a formula,
 * the matching test breaks with a message pointing at the rule.
 *
 * Companion report: docs/product-strategy/CALCULATION_VALIDATION.md
 * Source audit:     docs/product-strategy/CALCULATION_AUDIT.md
 *
 * PASSING tests = behaviors confirmed correct against the rule, now locked.
 * `it.skip` tests = CONFIRMED BUGS (audit findings reproduced by running the
 *   real code). Each skipped body asserts the value the *rule* requires, with a
 *   comment citing the audit section, the expected figure, and the actual figure
 *   produced today. Flip `it.skip` → `it` once the calculator is fixed. These
 *   are skipped so the suite stays green while the bug is queued.
 */
import { describe, expect, it } from "vitest";
import {
  applyClaimingAdjustment,
  calculateAime,
  calculatePia,
  estimateSocialSecurityBenefit
} from "@/lib/calculations/social-security";
import {
  acaApplicablePercent,
  estimateHealthcareCosts,
  estimatePremiumTaxCredit,
  selectIrmaaTier,
  type HealthcareCostInput
} from "@/lib/calculations/healthcare-cost";
import {
  ACA_OOP_MAX_2026_SELF_ONLY,
  FPL_2025_48_STATES,
  IRMAA_TIERS_2026,
  PART_B_BASE_PREMIUM_2026,
  PART_B_DEDUCTIBLE_2026,
  csrSilverOopMaxPerPerson,
  federalPovertyLevel
} from "@/lib/calculations/healthcare-data";
import {
  calculateInvestment,
  calculateMortgage
} from "@/components/planning/planning-tool-panel";
import {
  calculateSimpleFireNumber,
  evaluateCandidateRetirementDate,
  taxAdjustedWithdrawal
} from "@/lib/calculations/fire";
import { buildMonthlyBlockBootstrapPath } from "@/lib/calculations/monte-carlo";
import { historicalMonthlyReturns } from "@/lib/data/historical-returns";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import type { Phase1FireInputs } from "@/types/phase1";
import { samplePlan } from "@/lib/data/sample-plan";

// ===========================================================================
// 1. SOCIAL SECURITY  (src/lib/calculations/social-security.ts)
// ===========================================================================
describe("Social Security — rule-pinned (SSA)", () => {
  // §1.1 AIME = highest 35 indexed years ÷ 420 months, zero-filled.
  // Source: SSA Benefits computation; POMS RS 00605.015.
  it("SS-1: AIME drops the lowest years and divides by 420 (40 yrs × $50k → $4,166)", () => {
    const earnings = Array.from({ length: 40 }, (_, i) => ({ year: 1985 + i, indexedEarnings: 50_000 }));
    // 35 × 50,000 / 420 = 1,750,000 / 420 = 4,166.66 → floor = 4,166.
    expect(calculateAime(earnings)).toBe(4_166);
  });

  it("SS-1b: AIME zero-fills missing years into the 420 divisor (20 yrs × $50k → $2,380)", () => {
    const earnings = Array.from({ length: 20 }, (_, i) => ({ year: 1985 + i, indexedEarnings: 50_000 }));
    // 20 × 50,000 / 420 = 1,000,000 / 420 = 2,380.95 → floor = 2,380 (15 zero years in divisor).
    expect(calculateAime(earnings)).toBe(2_380);
  });

  // §1.2 PIA bend-point formula 90/32/15 with 2026 bend points $1,286 / $7,749,
  // rounded down to the next dime. Source: ssa.gov/oact/cola/piaformula.html.
  it("SS-2: PIA = 0.9/0.32/0.15 layers, rounded down to a dime (AIME $6,000 → $2,665.80)", () => {
    // 0.9×1,286 + 0.32×(6,000−1,286) = 1,157.40 + 1,508.48 = 2,665.88 → $2,665.80.
    expect(calculatePia(6_000, { first: 1_286, second: 7_749 })).toBe(2_665.8);
  });

  it("SS-2b: PIA spans all three bend layers (AIME $10,000 → $3,563.20)", () => {
    // 1,157.40 + 0.32×6,463 + 0.15×2,251 = 1,157.40 + 2,068.16 + 337.65 = 3,563.21 → $3,563.20.
    expect(calculatePia(10_000, { first: 1_286, second: 7_749 })).toBe(3_563.2);
  });

  // §1.5 Claiming adjustments: early 5/9%/mo (first 36) + 5/12%/mo; DRC 2/3%/mo.
  // Source: ssa.gov early/delayed retirement tables.
  it("SS-3: claiming adjustments (FRA 67, PIA $2,000) → 62=$1,400, 67=$2,000, 70=$2,480", () => {
    expect(applyClaimingAdjustment(2_000, 67, 62)).toBeCloseTo(1_400, 2); // −30%
    expect(applyClaimingAdjustment(2_000, 67, 67)).toBeCloseTo(2_000, 2); // FRA
    expect(applyClaimingAdjustment(2_000, 67, 70)).toBeCloseTo(2_480, 2); // +24%
  });

  // §1.5 FRA by birth year. Source: ssa.gov/oact/progdata/nra.html.
  it("SS-4: full retirement age by birth year (1954→66, 1955→66y2m, 1960→67)", () => {
    const fra = (birthYear: number) =>
      estimateSocialSecurityBenefit({
        birthYear, claimingAge: 67, workStartYear: birthYear + 25, workEndYear: birthYear + 60,
        startingAnnualCoveredEarnings: 50_000, annualEarningsGrowth: 0, wageGrowthAssumption: 0,
        displayMode: "today_dollars"
      }).fullRetirementAge;
    expect(fra(1954)).toBe(66);
    expect(fra(1955)).toBeCloseTo(66 + 2 / 12, 4);
    expect(fra(1960)).toBe(67);
  });

  // §1.1/§1.4 constants guard — fail loudly if a statutory constant drifts.
  it("SS-5: 2026 statutory constant guards", () => {
    // PIA bend points are private; assert them indirectly via the PIA formula:
    // an AIME below the first bend point pays 90% (so bend1 ≥ that AIME).
    expect(calculatePia(1_286, { first: 1_286, second: 7_749 })).toBe(1_157.4); // 0.9 × 1,286
  });

  // §1.7 (CONFIRMED BUG) Final monthly benefit must floor to a whole dollar.
  // Source: ssa.gov/oact/cola/Benefits.html ("round down to the next lower dollar").
  // Expected: integer dollars. ACTUAL today: $6,676.50 (rounded to cents, not floored).
  it("SS-6 [BUG §1.7]: final monthly benefit floors to a whole dollar", () => {
    const est = estimateSocialSecurityBenefit({
      birthYear: 1985, claimingAge: 67, workStartYear: 2010, workEndYear: 2049,
      startingAnnualCoveredEarnings: 80_000, annualEarningsGrowth: 0.03, wageGrowthAssumption: 0.03,
      displayMode: "today_dollars"
    });
    // Rule: SSA pays whole dollars. Code returns 6676.5 → not an integer.
    expect(Number.isInteger(est.estimatedMonthlyBenefitFutureDollars)).toBe(true);
  });
});

// ===========================================================================
// 2. HEALTHCARE / ACA / MEDICARE  (healthcare-cost.ts, healthcare-data.ts)
// ===========================================================================
function hcInput(overrides: Partial<HealthcareCostInput> = {}): HealthcareCostInput {
  return {
    household: "single", currentAge: 65, fireAge: 65, medicareAge: 65, planToAge: 65,
    annualMagi: 60_000, benchmarkSlcspMonthly: 600, chosenPlanMonthly: 550, acaDeductible: 4_000,
    acaOutOfPocketMax: 9_000, acaOopUsage: "moderate", acaInflation: 0.055, medicareCoverage: "medigap",
    medigapMonthly: 160, partDMonthly: 40, advantageMonthly: 0, medicareOutOfPocketMax: 6_000,
    medicareOopUsage: "moderate", medigapPlanLetter: "G", medicareInflation: 0.05, generalInflation: 0.03,
    hsaBalance: 0, hsaGrowth: 0.04, hsaStrategy: "off", travelMode: "off", daysAbroadPerYear: 0,
    travelAnnualPremium: 0, ...overrides
  };
}

describe("Healthcare / ACA / Medicare — rule-pinned (IRS / CMS / healthcare.gov)", () => {
  // §2.4 ACA applicable % ≥150% FPL and the PTC formula.
  // Source: Rev. Proc. 2025-25. HH 1, MAGI $40,000 = 255.6% FPL → ~8.61%.
  it("HC-1: ACA PTC at 255.6% FPL, benchmark $7,000 → ~$3,556 (8.61% applicable)", () => {
    const ptc = estimatePremiumTaxCredit({ annualMagi: 40_000, householdSize: 1, benchmarkAnnual: 7_000 });
    expect(ptc.applicablePercent).toBeCloseTo(0.0861, 4);
    // 7,000 − 40,000 × 0.086099 = 7,000 − 3,443.99 = 3,556.01.
    expect(ptc.premiumTaxCredit).toBeCloseTo(3_556.01, 1);
  });

  // §2.4 400% FPL subsidy cliff (enhanced subsidies lapsed 2025-12-31).
  it("HC-2: PTC is $0 at/above the 400% FPL cliff", () => {
    expect(acaApplicablePercent(4.01)).toBeNull();
    const ptc = estimatePremiumTaxCredit({ annualMagi: federalPovertyLevel(1) * 4.01, householdSize: 1, benchmarkAnnual: 9_000 });
    expect(ptc.premiumTaxCredit).toBe(0);
    expect(ptc.aboveSubsidyCliff).toBe(true);
  });

  // §2.2 IRMAA 2026 brackets (single). Source: CMS 2026 IRMAA; thresholds
  // $109k/$137k/$171k/$205k/$500k; multipliers 1.0/1.4/2.0/2.6/3.2/3.4.
  // NOTE: the audit's worked example paired MAGI $200,000 with the 2.0× tier;
  // that is the audit's error — $200k exceeds the $171k ceiling, so the engine
  // (correctly) returns the 2.6× tier. The 2.0× values belong to MAGI ≤ $171k.
  it("HC-3: IRMAA single tiers — $100k→base, $150k→2.0×, $200k→2.6×", () => {
    const t100 = selectIrmaaTier(100_000, "single");
    expect(t100.index).toBe(0);
    expect(t100.tier.partDMonthlySurcharge).toBe(0);

    const t150 = selectIrmaaTier(150_000, "single");
    expect(t150.index).toBe(2);
    expect(PART_B_BASE_PREMIUM_2026 * t150.tier.partBMultiplier).toBeCloseTo(405.8, 2);
    expect(t150.tier.partDMonthlySurcharge).toBe(37.5);

    const t200 = selectIrmaaTier(200_000, "single");
    expect(t200.index).toBe(3);
    expect(PART_B_BASE_PREMIUM_2026 * t200.tier.partBMultiplier).toBeCloseTo(527.54, 2);
    expect(t200.tier.partDMonthlySurcharge).toBe(60.4);
  });

  // §2.3 / §2.7 constants guards.
  it("HC-4: 2026 statutory constant guards (Part B / deductible / OOP / FPL)", () => {
    expect(PART_B_BASE_PREMIUM_2026).toBe(202.9);
    expect(PART_B_DEDUCTIBLE_2026).toBe(283);
    expect(ACA_OOP_MAX_2026_SELF_ONLY).toBe(10_600);
    expect(FPL_2025_48_STATES.base).toBe(15_650);
    expect(FPL_2025_48_STATES.perAdditionalPerson).toBe(5_500);
    expect(federalPovertyLevel(2)).toBe(21_150);
    // IRMAA multiplier ladder.
    expect(IRMAA_TIERS_2026.map((t) => t.partBMultiplier)).toEqual([1.0, 1.4, 2.0, 2.6, 3.2, 3.4]);
    expect(IRMAA_TIERS_2026.map((t) => t.partDMonthlySurcharge)).toEqual([0, 14.5, 37.5, 60.4, 83.3, 91]);
  });

  // §2.5 (CONFIRMED BUG) ACA applicable % below 150% FPL is NOT flat.
  // Source: Rev. Proc. 2025-25 — 133%→3.14%, 138%→3.45%, 150%→4.19%.
  // HH 1, MAGI $22,000 = 140.6% FPL → rule ≈ 3.61%. ACTUAL today: 2.10% (flat floor).
  // Impact: required contribution $462 vs $794 → subsidy overstated ≈ $332/yr.
  it("HC-5 [BUG §2.5]: applicable % at 140.6% FPL interpolates to ~3.61%, not the 2.10% floor", () => {
    expect(acaApplicablePercent(22_000 / federalPovertyLevel(1))).toBeCloseTo(0.0361, 3);
  });

  // §2.6 (CONFIRMED BUG, FIXED) CSR reduces the Silver OOP max for 100–250% FPL.
  // Source: Fed. Reg. 2025-11606 — ≤150% & 151–200% FPL Silver → $3,500 self-only;
  // 201–250% → $8,450; >250% → standard $10,600.
  // Was: a flat $8,500 Silver OOP max with no FPL adjustment.
  it("HC-6 [BUG §2.6]: 175% FPL silver CSR OOP max is $3,500, not $8,500", () => {
    // The CSR band table the engine must honor.
    expect(csrSilverOopMaxPerPerson(1.75)).toBe(3_500); // 100–200% FPL
    expect(csrSilverOopMaxPerPerson(2.3)).toBe(8_450); // 201–250% FPL
    expect(csrSilverOopMaxPerPerson(3.0)).toBeNull(); // >250% FPL → standard
    // The engine applies it: a Silver plan at 175% FPL caps OOP at $3,500/person,
    // so high-usage expected OOP is 0.85 × 3,500 = 2,975 (not 0.85 × 8,500 = 7,225).
    const magi175 = Math.round(federalPovertyLevel(1) * 1.75);
    const r = estimateHealthcareCosts(
      hcInput({
        household: "single",
        currentAge: 60,
        fireAge: 60,
        medicareAge: 65,
        planToAge: 64,
        annualMagi: magi175,
        acaMetalTier: "silver",
        acaOutOfPocketMax: 8_500,
        acaOopUsage: "high"
      })
    );
    expect(r.csrSilverApplied).toBe(true);
    expect(r.acaOutOfPocketMaxApplied).toBe(3_500);
    expect(r.rows[0].outOfPocket).toBeCloseTo(0.85 * 3_500, 0);
  });

  // §2.1 (CONFIRMED BUG, CRITICAL) Original Medicare + Medigap Plan G has no OOP
  // max; real medical OOP ≈ the $283 Part B deductible. Source: medicare.gov
  // Medigap; CMS Part B deductible 2026.
  // ACTUAL today: 0.30 × $6,000 (an MA-style OOP-max) = $1,800/yr/person.
  // Impact: ≈ $1,517/yr/person overstatement, compounding over the Medicare years.
  it("HC-7 [BUG §2.1]: Medigap Plan G annual medical OOP ≈ Part B deductible (~$283), not $1,800", () => {
    // DVH pinned to 0 so this isolates the medical cost-sharing (the bug under
    // test); routine dental/vision/hearing is a separate, non-medical add-on.
    const r = estimateHealthcareCosts(
      hcInput({ medicareCoverage: "medigap", medicareOopUsage: "moderate", dentalVisionHearingAnnual: 0 })
    );
    // Year-0 (no inflation) Medicare OOP for a single Plan G enrollee.
    expect(r.rows[0].outOfPocket).toBeLessThanOrEqual(300);
  });
});

// ===========================================================================
// 3. MORTGAGE  (calculateMortgage in planning-tool-panel.tsx)
// ===========================================================================
describe("Mortgage — rule-pinned (standard amortization / CFPB)", () => {
  // §3.1 Amortization M = P·r / (1 − (1+r)^−n). Source: standard formula.
  it("MTG-1: $500,000 / 6.5% / 30 yr → P&I $3,160.34", () => {
    const m = calculateMortgage({ loanAmount: 500_000, annualInterestRatePercent: 6.5, termYears: 30 });
    expect(m.monthlyPrincipalInterest).toBeCloseTo(3_160.34, 1);
  });

  it("MTG-2: zero-rate loan amortizes linearly ($360,000 / 0% / 30 yr → $1,000.00)", () => {
    const m = calculateMortgage({ loanAmount: 360_000, annualInterestRatePercent: 0, termYears: 30 });
    expect(m.monthlyPrincipalInterest).toBeCloseTo(1_000, 2);
  });

  // §3.2 (CONFIRMED BUG) PMI cancels at 80% of the ORIGINAL HOME VALUE, not the
  // original loan. Source: Homeowners Protection Act via CFPB.
  // Scenario: $400,000 value, $360,000 loan, 6.5%, 30 yr, PMI 0.5% ($150/mo).
  // Rule: PMI line is $0 once balance ≤ $320,000 (80% of $400k value) ≈ year 2033.
  // ACTUAL today: still charged at $320k (cancels only at ≤$288,000 ≈ year 2038).
  // Impact: ~5 extra years × $1,800/yr ≈ $9,000 over-charged; no home-value input.
  it("MTG-3 [BUG §3.2]: PMI cancels at 80% of original home VALUE ($320k), not 80% of loan", () => {
    const m = calculateMortgage({ loanAmount: 360_000, annualInterestRatePercent: 6.5, termYears: 30, pmiAnnualPercent: 0.5 });
    // The first year the balance is at/under 80% of the $400k value: PMI must be gone.
    const yearAt320 = m.schedule.find((r) => r.balance <= 320_000)!;
    // taxesAndFees here is PMI-only (no tax/insurance/HOA supplied), so it must be ~0.
    expect(yearAt320.taxesAndFees).toBeLessThan(1);
  });
});

// ===========================================================================
// 4. INVESTMENT  (calculateInvestment in planning-tool-panel.tsx)
// ===========================================================================
describe("Investment — rule-pinned (future value of an ordinary annuity)", () => {
  // §4.1 Monthly compounding at APR/12 with end-of-period contributions.
  it("INV-1: $100,000 + $2,000/mo, 7%, 15 yr → ≈ $918,819 nominal; contributions $460,000", () => {
    const inv = calculateInvestment({ startingBalance: 100_000, monthlyContribution: 2_000, annualReturnPercent: 7, years: 15 });
    // FV = 100,000×(1+.07/12)^180 + 2,000×[((1+.07/12)^180 − 1)/(.07/12)] ≈ 918,819.
    expect(inv.endingBalance).toBeCloseTo(918_819.27, 0);
    expect(inv.totalContributions).toBe(100_000 + 2_000 * 180);
    expect(inv.investmentGrowth).toBeCloseTo(inv.endingBalance - 460_000, 2);
  });

  // §4.3 fee sensitivity — proves a 0.5% lower net return materially cuts the
  // 15-year balance, motivating an expense-ratio input (currently absent).
  it("INV-2: a 0.5% lower net return (7%→6.5%) cuts the 15-yr balance ~5.1%", () => {
    const gross = calculateInvestment({ startingBalance: 100_000, monthlyContribution: 2_000, annualReturnPercent: 7, years: 15 });
    const net = calculateInvestment({ startingBalance: 100_000, monthlyContribution: 2_000, annualReturnPercent: 6.5, years: 15 });
    const drop = (gross.endingBalance - net.endingBalance) / gross.endingBalance;
    expect(drop).toBeCloseTo(0.051, 2);
  });

  // §4.3 (FIXED) expense-ratio / fee input. The effective return is the gross
  // return minus the annual fee (net = gross − fee), so a fee reduces the ending
  // balance by exactly the amount of running the projection at the lower net rate.
  it("INV-fee [§4.3]: an annual fee reduces the return (net = gross − fee)", () => {
    const gross = calculateInvestment({
      startingBalance: 100_000,
      monthlyContribution: 2_000,
      annualReturnPercent: 7,
      years: 15
    });
    const withFee = calculateInvestment({
      startingBalance: 100_000,
      monthlyContribution: 2_000,
      annualReturnPercent: 7,
      years: 15,
      feePercent: 0.2
    });
    // A 0.20% fee on a 7% gross return must equal a 6.80% net projection exactly.
    const equivalentNet = calculateInvestment({
      startingBalance: 100_000,
      monthlyContribution: 2_000,
      annualReturnPercent: 6.8,
      years: 15
    });
    expect(withFee.endingBalance).toBeCloseTo(equivalentNet.endingBalance, 4);
    expect(withFee.endingBalance).toBeLessThan(gross.endingBalance);
    // Contributions are unchanged — only growth is reduced by the fee.
    expect(withFee.totalContributions).toBe(gross.totalContributions);
  });
});

// ===========================================================================
// 5. FIRE ENGINES  (calculations/fire.ts, phase1/fire.ts, monte-carlo.ts)
// ===========================================================================
describe("FIRE engines — rule-pinned", () => {
  // §5.1 Phase-1 deterministic drawdown reference (the well-built engine).
  it("FIRE-1: phase-1 drawdown finds the earliest surviving FIRE age (documented case)", () => {
    const inputs: Phase1FireInputs = {
      currentAge: 40, lifeExpectancy: 90, passiveIncomeFireAge: 60, fireRuleMode: "withdrawal_rate",
      currentFireAssets: 1_000_000, annualExpenses: 100_000, expensesInflationAdjusted: true,
      useExpenseCategoriesOverride: false, expenseCategories: [], annualPassiveGuaranteedIncome: 0,
      passiveGuaranteedIncomeInflationAdjusted: true, useIncomeSourcesOverride: false, incomeSources: [],
      annualSavingsBeforeFire: 50_000, expectedAnnualPortfolioReturnPercent: 0, expectedCashGeneratingReturnPercent: 2,
      inflationRatePercent: 0, withdrawalRatePercent: 5, taxMode: "none", simpleEffectiveTaxRatePercent: 10
    };
    const r = calculatePhase1Fire(inputs).withdrawalRate;
    expect(r.estimatedFireAge).toBe(68);
    expect(r.assetsAtFire).toBe(2_400_000);
    expect(r.firstYearPortfolioDraw).toBe(100_000);
    expect(r.endingBalanceAtLifeExpectancy).toBe(100_000);
  });

  // §5.3 The 4% rule (25× expenses): the canonical headline the app's copy uses.
  it("FIRE-2: simple FIRE number at 4% = 25× the spending gap", () => {
    expect(calculateSimpleFireNumber(60_000, 12_000, 0.04)).toBe(1_200_000); // 48,000 / 0.04
  });

  // §6.1 Simple tax gross-up: gross = afterTaxGap / (1 − rate).
  it("FIRE-3: simple tax gross-up ($40,000 gap @ 15% → $47,058.82; 0% → unchanged)", () => {
    expect(
      taxAdjustedWithdrawal(40_000, { mode: "simple_blended", simpleEffectiveTaxRate: 0.15, accountWithdrawalMethod: "pro_rata" })
    ).toBeCloseTo(47_058.82, 2);
    expect(taxAdjustedWithdrawal(40_000, { mode: "none", accountWithdrawalMethod: "pro_rata" })).toBe(40_000);
  });

  // §5.4 Monte-Carlo seeded RNG reproducibility (sound, deterministic).
  it("FIRE-4: block-bootstrap path is deterministic for a fixed seed", () => {
    const a = buildMonthlyBlockBootstrapPath({ rows: historicalMonthlyReturns, monthsNeeded: 360, seed: 123 });
    const b = buildMonthlyBlockBootstrapPath({ rows: historicalMonthlyReturns, monthsNeeded: 360, seed: 123 });
    expect(a).toHaveLength(360);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  // §5.3 (CONFIRMED BUG) The simple-FIRE-number DEFAULT withdrawal rate is 5%
  // (20× expenses), not the app's headline 4% rule (25×).
  // Rule/app framing: default → 4% → $1,200,000. ACTUAL today: $960,000 (5%).
  it("FIRE-5 [BUG §5.3]: default simple FIRE number uses the 4% rule", () => {
    // 4% rule → 25× the spending gap: (60,000 − 12,000) / 0.04 = 1,200,000.
    expect(calculateSimpleFireNumber(60_000, 12_000)).toBe(1_200_000);
  });

  // §5.2 (CONFIRMED BUG, CRITICAL) The saved-path deterministic evaluator sums
  // raw expense amounts with NO inflation and ignores each expense's
  // `inflationAdjusted` flag, while compounding the portfolio at a nominal
  // return — overstating survival. monte-carlo.ts and phase1/fire.ts both inflate
  // spending correctly. Rule: two plans differing only in `inflationAdjusted`
  // must NOT produce identical results. ACTUAL today: identical (flag ignored).
  it("FIRE-6 [BUG §5.2]: saved-path evaluator inflates spending (respects inflationAdjusted)", async () => {
    const mk = (inflationAdjusted: boolean) => ({
      ...samplePlan.savedPaths[0],
      assumptions: { ...samplePlan.savedPaths[0].assumptions, fireRuleMode: "withdrawal_rate" as const },
      expenses: [
        {
          id: "e1", name: "Flat spend", category: "Living", amount: 50_000, frequency: "annual" as const,
          startTiming: { type: "exact_date" as const, date: "2026-01-01" }, inflationAdjusted,
          isEssential: true, includedInFirePath: true
        }
      ],
      incomeStreams: []
    });
    const adj = await evaluateCandidateRetirementDate(samplePlan, mk(true), "2026-01-01", "deterministic");
    const flat = await evaluateCandidateRetirementDate(samplePlan, mk(false), "2026-01-01", "deterministic");
    // Under correct behavior the inflation-adjusted plan spends more over time and
    // ends lower. Today they are byte-identical (inflation never applied).
    expect(adj.endingBalance).not.toBe(flat.endingBalance);
  });
});
