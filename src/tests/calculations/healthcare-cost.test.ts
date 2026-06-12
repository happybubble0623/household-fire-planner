import { describe, expect, it } from "vitest";
import {
  acaApplicablePercent,
  applyMetalTierPreset,
  estimateBenchmarkPremium,
  estimateHealthcareCosts,
  estimatePremiumTaxCredit,
  selectIrmaaTier,
  type HealthcareCostInput
} from "@/lib/calculations/healthcare-cost";
import {
  DEFAULT_REAL_DISCOUNT_RATE,
  MEDICAID_FPL_THRESHOLD,
  MEDICARE_LOW_INCOME_FPL_THRESHOLD,
  METAL_TIER_PRESETS,
  NATIONAL_BENCHMARK_SILVER_BASE_21,
  OOP_USAGE_PRESETS,
  PART_B_BASE_PREMIUM_2026,
  REGION_MULTIPLIERS,
  acaAgeCurveFactor,
  federalPovertyLevel
} from "@/lib/calculations/healthcare-data";

function baseInput(overrides: Partial<HealthcareCostInput> = {}): HealthcareCostInput {
  return {
    household: "single",
    currentAge: 50,
    fireAge: 50,
    medicareAge: 65,
    planToAge: 90,
    annualMagi: 40_000,
    benchmarkSlcspMonthly: 600,
    chosenPlanMonthly: 550,
    acaDeductible: 4_000,
    acaOutOfPocketMax: 9_000,
    acaOopUsage: "moderate",
    acaInflation: 0.055,
    medicareCoverage: "medigap",
    medigapMonthly: 160,
    partDMonthly: 40,
    advantageMonthly: 0,
    medicareOutOfPocketMax: 6_000,
    medicareOopUsage: "moderate",
    medigapPlanLetter: "G",
    medicareInflation: 0.05,
    generalInflation: 0.03,
    hsaBalance: 0,
    hsaGrowth: 0.04,
    hsaStrategy: "off",
    travelMode: "off",
    daysAbroadPerYear: 0,
    travelAnnualPremium: 0,
    ...overrides
  };
}

describe("ACA applicable percentage", () => {
  it("hits the published 2026 table nodes", () => {
    expect(acaApplicablePercent(1.5)).toBeCloseTo(0.0419, 4);
    expect(acaApplicablePercent(2.0)).toBeCloseTo(0.066, 4);
    expect(acaApplicablePercent(2.5)).toBeCloseTo(0.0844, 4);
    expect(acaApplicablePercent(3.0)).toBeCloseTo(0.0996, 4);
    expect(acaApplicablePercent(3.5)).toBeCloseTo(0.0996, 4);
  });

  it("floors below 150% FPL and interpolates between nodes", () => {
    expect(acaApplicablePercent(1.2)).toBeCloseTo(0.021, 4);
    // Halfway between 150% (4.19%) and 200% (6.60%).
    expect(acaApplicablePercent(1.75)).toBeCloseTo((0.0419 + 0.066) / 2, 4);
  });

  it("returns null at or above the 400% FPL cliff", () => {
    expect(acaApplicablePercent(4.0)).toBeNull();
    expect(acaApplicablePercent(4.5)).toBeNull();
  });
});

describe("premium tax credit", () => {
  it("equals benchmark minus the required contribution and never goes negative", () => {
    const fpl = federalPovertyLevel(1);
    const magi = fpl * 2.0; // 200% FPL -> 6.60%
    const result = estimatePremiumTaxCredit({
      annualMagi: magi,
      householdSize: 1,
      benchmarkAnnual: 7_200
    });
    expect(result.applicablePercent).toBeCloseTo(0.066, 4);
    expect(result.requiredContribution).toBeCloseTo(magi * 0.066, 2);
    expect(result.premiumTaxCredit).toBeCloseTo(7_200 - magi * 0.066, 2);
    expect(result.premiumTaxCredit).toBeGreaterThan(0);
  });

  it("drops the credit to zero one dollar over the 400% FPL cliff", () => {
    const fpl = federalPovertyLevel(1);
    const justUnder = estimatePremiumTaxCredit({
      annualMagi: fpl * 4 - 100,
      householdSize: 1,
      benchmarkAnnual: 9_000
    });
    const justOver = estimatePremiumTaxCredit({
      annualMagi: fpl * 4 + 100,
      householdSize: 1,
      benchmarkAnnual: 9_000
    });
    expect(justUnder.premiumTaxCredit).toBeGreaterThan(0);
    expect(justOver.premiumTaxCredit).toBe(0);
    expect(justOver.aboveSubsidyCliff).toBe(true);
  });

  it("floors the credit at zero when income is high but still under the cliff", () => {
    const fpl = federalPovertyLevel(1);
    const result = estimatePremiumTaxCredit({
      annualMagi: fpl * 3.5,
      householdSize: 1,
      benchmarkAnnual: 3_000 // cheap benchmark < required contribution
    });
    expect(result.premiumTaxCredit).toBe(0);
    expect(result.aboveSubsidyCliff).toBe(false);
  });
});

describe("IRMAA tier selection", () => {
  it("returns the base tier below the first threshold", () => {
    const { tier, index } = selectIrmaaTier(80_000, "single");
    expect(index).toBe(0);
    expect(tier.partBMultiplier).toBe(1.0);
    expect(tier.partDMonthlySurcharge).toBe(0);
  });

  it("selects tiers at the single-filer boundaries", () => {
    expect(selectIrmaaTier(109_000, "single").index).toBe(0);
    expect(selectIrmaaTier(109_001, "single").index).toBe(1);
    expect(selectIrmaaTier(205_000, "single").index).toBe(3);
    expect(selectIrmaaTier(600_000, "single").index).toBe(5);
  });

  it("uses the higher married-filing-jointly thresholds", () => {
    expect(selectIrmaaTier(218_000, "couple").index).toBe(0);
    expect(selectIrmaaTier(218_001, "couple").index).toBe(1);
    expect(selectIrmaaTier(750_001, "couple").index).toBe(5);
  });
});

describe("healthcare cost projection", () => {
  it("classifies pre-65 years as ACA and 65+ as Medicare", () => {
    const result = estimateHealthcareCosts(baseInput({ fireAge: 55, planToAge: 90 }));
    expect(result.acaYears).toBe(10); // ages 55..64
    expect(result.medicareYears).toBe(26); // ages 65..90
    expect(result.rows[0].phase).toBe("aca");
    expect(result.rows.find((row) => row.age === 65)?.phase).toBe("medicare");
  });

  it("skips the ACA phase when retiring at or after 65", () => {
    const result = estimateHealthcareCosts(baseInput({ fireAge: 67, planToAge: 90 }));
    expect(result.acaYears).toBe(0);
    expect(result.rows.every((row) => row.phase === "medicare")).toBe(true);
  });

  it("applies the ACA subsidy to the net premium and reports the FPL snapshot", () => {
    const fpl = federalPovertyLevel(1);
    const result = estimateHealthcareCosts(
      baseInput({ annualMagi: fpl * 2.0, fireAge: 60, planToAge: 64 })
    );
    expect(result.incomePctFpl).toBeCloseTo(2.0, 4);
    expect(result.applicablePercent).toBeCloseTo(0.066, 4);
    expect(result.firstYearSubsidy).toBeGreaterThan(0);
    // Net premium in the first ACA year is below the unsubsidized premium.
    expect(result.rows[0].premium).toBeLessThan(550 * 12);
  });

  it("charges the full premium with no subsidy above the 400% FPL cliff", () => {
    const fpl = federalPovertyLevel(1);
    const result = estimateHealthcareCosts(
      baseInput({ annualMagi: fpl * 5, currentAge: 60, fireAge: 60, planToAge: 64 })
    );
    expect(result.aboveSubsidyCliff).toBe(true);
    expect(result.totalSubsidy).toBe(0);
    // First ACA year premium equals the unsubsidized chosen-plan premium (real terms, year 0).
    expect(result.rows[0].premium).toBeCloseTo(550 * 12, 2);
  });

  it("prices Part B at the base premium in the lowest IRMAA tier", () => {
    const result = estimateHealthcareCosts(baseInput({ annualMagi: 40_000, fireAge: 65 }));
    expect(result.irmaaTierIndex).toBe(0);
    expect(result.partBMonthlyPerPerson).toBeCloseTo(PART_B_BASE_PREMIUM_2026, 2);
  });

  it("raises Part B and adds a Part D surcharge in higher IRMAA tiers", () => {
    const base = estimateHealthcareCosts(baseInput({ annualMagi: 40_000, fireAge: 65 }));
    const high = estimateHealthcareCosts(baseInput({ annualMagi: 150_000, fireAge: 65 }));
    expect(high.irmaaTierIndex).toBeGreaterThan(base.irmaaTierIndex);
    expect(high.partBMonthlyPerPerson).toBeGreaterThan(base.partBMonthlyPerPerson);
    const baseFirstMedicare = base.rows.find((row) => row.phase === "medicare")!;
    const highFirstMedicare = high.rows.find((row) => row.phase === "medicare")!;
    expect(highFirstMedicare.premium).toBeGreaterThan(baseFirstMedicare.premium);
  });

  it("doubles per-person Medicare premiums for couples and uses household-of-two FPL", () => {
    const single = estimateHealthcareCosts(baseInput({ household: "single", fireAge: 65 }));
    const couple = estimateHealthcareCosts(baseInput({ household: "couple", fireAge: 65 }));
    const singleMed = single.rows.find((row) => row.phase === "medicare")!;
    const coupleMed = couple.rows.find((row) => row.phase === "medicare")!;
    // Premiums scale with people (Part B + coverage + surcharge), OOP also scales.
    expect(coupleMed.premium).toBeCloseTo(singleMed.premium * 2, 1);
  });

  it("returns a single nominal series whose rows sum to the nominal lifetime total", () => {
    const result = estimateHealthcareCosts(baseInput());
    // The stored rows are nominal (future, inflated) dollars and add up to the
    // nominal lifetime total — the future-dollars headline.
    const summed = result.rows.reduce((total, row) => total + row.grossCost, 0);
    expect(result.totalGrossCost).toBeCloseTo(summed, 0);
    expect(result.totalGrossCost).toBeCloseTo(result.nominalLifetimeTotal, 0);
    // Nominal exceeds the discounted present value (today's-dollar headline).
    expect(result.nominalLifetimeTotal).toBeGreaterThan(result.presentValueTotal);
  });

  it("draws down the HSA, reports the depletion age, and never funds Medigap premiums", () => {
    const result = estimateHealthcareCosts(
      baseInput({
        fireAge: 60,
        planToAge: 90,
        hsaBalance: 50_000,
        hsaStrategy: "gap_first",
        medicareCoverage: "medigap"
      })
    );
    expect(result.totalHsaUsed).toBeGreaterThan(0);
    expect(result.totalNetPortfolioCost).toBeLessThan(result.totalGrossCost);
    // Net portfolio cost + HSA used reconstructs the gross cost.
    expect(result.totalNetPortfolioCost + result.totalHsaUsed).toBeCloseTo(
      result.totalGrossCost,
      0
    );

    // With a medigap plan, the HSA can never cover the full Medicare premium
    // (Medigap premium is excluded), so some premium always hits the portfolio.
    const medigapYear = result.rows.find((row) => row.phase === "medicare" && row.hsaDraw > 0);
    if (medigapYear) {
      expect(medigapYear.hsaDraw).toBeLessThan(medigapYear.grossCost);
    }
  });

  it("reserves the HSA for Medicare years under the medicare_first strategy", () => {
    const result = estimateHealthcareCosts(
      baseInput({ fireAge: 60, planToAge: 90, hsaBalance: 30_000, hsaStrategy: "medicare_first" })
    );
    const acaDraws = result.rows.filter((row) => row.phase === "aca").map((row) => row.hsaDraw);
    expect(acaDraws.every((draw) => draw === 0)).toBe(true);
    expect(result.totalHsaUsed).toBeGreaterThan(0);
  });

  it("adds the travel premium in supplement mode and replaces the baseline in replace mode", () => {
    const off = estimateHealthcareCosts(baseInput({ fireAge: 60, planToAge: 64, travelMode: "off" }));
    const supplement = estimateHealthcareCosts(
      baseInput({
        fireAge: 60,
        planToAge: 64,
        travelMode: "supplement",
        travelAnnualPremium: 5_000
      })
    );
    const replace = estimateHealthcareCosts(
      baseInput({
        fireAge: 60,
        planToAge: 64,
        travelMode: "replace",
        travelAnnualPremium: 5_000
      })
    );

    expect(supplement.totalGrossCost).toBeGreaterThan(off.totalGrossCost);
    // Replace drops the US net premium; its premium column is zero in ACA years.
    expect(replace.rows[0].premium).toBe(0);
    expect(replace.rows[0].travelPremium).toBeGreaterThan(0);
  });

  it("flags that ACA coverage is not required when abroad 330+ days", () => {
    expect(estimateHealthcareCosts(baseInput({ daysAbroadPerYear: 200 })).acaNotRequiredAbroad).toBe(
      false
    );
    expect(estimateHealthcareCosts(baseInput({ daysAbroadPerYear: 330 })).acaNotRequiredAbroad).toBe(
      true
    );
  });

  it("uses an explicit out-of-pocket override when provided", () => {
    const preset = estimateHealthcareCosts(baseInput({ currentAge: 60, fireAge: 60, planToAge: 60 }));
    const explicit = estimateHealthcareCosts(
      baseInput({
        currentAge: 60,
        fireAge: 60,
        planToAge: 60,
        acaOopUsage: { expectedAnnualOop: 1_234 }
      })
    );
    expect(explicit.rows[0].outOfPocket).toBeCloseTo(1_234, 2);
    expect(explicit.rows[0].outOfPocket).not.toBeCloseTo(preset.rows[0].outOfPocket, 2);
  });

  it("scales Medicare out-of-pocket by the number of people (couple = single ×2)", () => {
    // currentAge = fireAge = planToAge = 65 keeps the first year at growth factor
    // 1 (year 0), so the OOP figure is exact and free of inflation rounding.
    const single = estimateHealthcareCosts(
      baseInput({ household: "single", currentAge: 65, fireAge: 65, planToAge: 65 })
    );
    const couple = estimateHealthcareCosts(
      baseInput({ household: "couple", currentAge: 65, fireAge: 65, planToAge: 65 })
    );
    const singleMed = single.rows[0];
    const coupleMed = couple.rows[0];
    // The couple-OOP fix: per-person OOP is multiplied by people, like premiums.
    expect(singleMed.outOfPocket).toBeCloseTo(0.3 * 6_000, 2); // 30% of per-person ceiling
    expect(coupleMed.outOfPocket).toBeCloseTo(singleMed.outOfPocket * 2, 2);
  });

  it("uses a retuned 30% moderate out-of-pocket preset (was 45%)", () => {
    expect(OOP_USAGE_PRESETS.moderate).toBe(0.3);
    const result = estimateHealthcareCosts(
      baseInput({ household: "single", currentAge: 65, fireAge: 65, planToAge: 65 })
    );
    // Year-0 Medicare OOP = 30% of the $6,000 per-person ceiling.
    expect(result.rows[0].outOfPocket).toBeCloseTo(0.3 * 6_000, 2);
  });

  describe("present-value headline", () => {
    it("discounts the lifetime real cost to a present value below the undiscounted sum", () => {
      const result = estimateHealthcareCosts(baseInput({ fireAge: 55, planToAge: 90 }));
      expect(result.realDiscountRate).toBeCloseTo(DEFAULT_REAL_DISCOUNT_RATE, 6);
      expect(result.presentValueTotal).toBeGreaterThan(0);
      // Discounting future years makes the PV strictly smaller than the
      // undiscounted today's-dollar lifetime sum.
      expect(result.presentValueTotal).toBeLessThan(result.todayDollarsLifetimeTotal);
      // PV phase splits add up to the PV total.
      expect(result.presentValueAcaCost + result.presentValueMedicareCost).toBeCloseTo(
        result.presentValueTotal,
        0
      );
    });

    it("reports an average today's-dollar cost per year and a larger nominal total", () => {
      const result = estimateHealthcareCosts(baseInput({ fireAge: 55, planToAge: 90 }));
      const years = result.acaYears + result.medicareYears;
      expect(result.averageAnnualTodayDollars).toBeCloseTo(
        result.todayDollarsLifetimeTotal / years,
        0
      );
      // Nominal (future-dollar) cumulative total exceeds the today's-dollar sum.
      expect(result.nominalLifetimeTotal).toBeGreaterThan(result.todayDollarsLifetimeTotal);
    });

    it("is basis-independent — one call yields every headline figure", () => {
      const result = estimateHealthcareCosts(baseInput());
      // The nominal stored series, the discounted present value, and the
      // undiscounted real sum all come from a single computation.
      expect(result.nominalLifetimeTotal).toBeGreaterThan(result.todayDollarsLifetimeTotal);
      expect(result.todayDollarsLifetimeTotal).toBeGreaterThan(result.presentValueTotal);
      expect(result.totalGrossCost).toBeCloseTo(result.nominalLifetimeTotal, 0);
    });
  });

  // The hero headline, the year-by-year rows, the chart, and the avg-per-year
  // sub-line must all reconcile in whichever dollar basis the view selects. The
  // view scales the single nominal series by a per-row deflator, exactly as the
  // panel does, so these assertions mirror what the user sees.
  describe("year-by-year reconciliation across display bases", () => {
    const input = baseInput({ fireAge: 55, planToAge: 90, hsaBalance: 40_000, hsaStrategy: "gap_first" });
    const result = estimateHealthcareCosts(input);
    const years = result.acaYears + result.medicareYears;

    it("(a) future mode: per-year nominal gross rows sum to the nominal headline", () => {
      const summed = result.rows.reduce((total, row) => total + row.grossCost, 0);
      expect(summed).toBeCloseTo(result.nominalLifetimeTotal, 0);
    });

    it("(b) today mode: per-year discounted-PV rows sum to the present-value headline", () => {
      const summedPv = result.rows.reduce(
        (total, row) => total + row.grossCost * row.presentValueDeflator,
        0
      );
      expect(summedPv).toBeCloseTo(result.presentValueTotal, 0);
    });

    it("(c) avg-per-year × years ≈ headline in each mode", () => {
      // The panel derives avg = headline / years, so avg × years reproduces the
      // headline by construction in both bases.
      const nominalAvg = result.nominalLifetimeTotal / years;
      const pvAvg = result.presentValueTotal / years;
      expect(nominalAvg * years).toBeCloseTo(result.nominalLifetimeTotal, 6);
      expect(pvAvg * years).toBeCloseTo(result.presentValueTotal, 6);
    });

    it("net + HSA used reconciles to the gross headline in each basis", () => {
      // Future (nominal) basis.
      const netNominal = result.rows.reduce((total, row) => total + row.netPortfolioCost, 0);
      const hsaNominal = result.rows.reduce((total, row) => total + row.hsaDraw, 0);
      expect(netNominal + hsaNominal).toBeCloseTo(result.nominalLifetimeTotal, 0);
      // Today's (present-value) basis: scale both sides by the per-row deflator.
      const netPv = result.rows.reduce(
        (total, row) => total + row.netPortfolioCost * row.presentValueDeflator,
        0
      );
      const hsaPv = result.rows.reduce(
        (total, row) => total + row.hsaDraw * row.presentValueDeflator,
        0
      );
      expect(netPv + hsaPv).toBeCloseTo(result.presentValueTotal, 0);
    });
  });

  describe("low-income public coverage", () => {
    const fpl = federalPovertyLevel(1);

    it("flags Medicaid pre-65 below 138% FPL and models ACA premiums and OOP as ~free", () => {
      const result = estimateHealthcareCosts(
        baseInput({ annualMagi: fpl * 1.2, currentAge: 55, fireAge: 55, planToAge: 64 })
      );
      expect(result.incomePctFpl).toBeLessThan(MEDICAID_FPL_THRESHOLD);
      expect(result.medicaidEligiblePre65).toBe(true);
      expect(result.rows.every((row) => row.phase === "aca")).toBe(true);
      expect(result.totalAcaCost).toBe(0);
      expect(result.rows[0].premium).toBe(0);
      expect(result.rows[0].outOfPocket).toBe(0);
    });

    it("flags Medicare Savings Programs below 135% FPL and models Medicare cost as ~free", () => {
      const result = estimateHealthcareCosts(
        baseInput({ annualMagi: fpl * 1.2, currentAge: 65, fireAge: 65, planToAge: 90 })
      );
      expect(result.incomePctFpl).toBeLessThan(MEDICARE_LOW_INCOME_FPL_THRESHOLD);
      expect(result.medicareLowIncome).toBe(true);
      expect(result.totalMedicareCost).toBe(0);
      expect(result.rows[0].premium).toBe(0);
      expect(result.rows[0].outOfPocket).toBe(0);
    });

    it("makes low income cost far less than mid income (fixing the old backwards result)", () => {
      const low = estimateHealthcareCosts(
        baseInput({ annualMagi: fpl * 1.2, fireAge: 55, planToAge: 90 })
      );
      const mid = estimateHealthcareCosts(
        baseInput({ annualMagi: fpl * 2.5, fireAge: 55, planToAge: 90 })
      );
      expect(low.medicaidEligiblePre65).toBe(true);
      expect(mid.medicaidEligiblePre65).toBe(false);
      expect(low.presentValueTotal).toBeLessThan(mid.presentValueTotal);
      expect(low.presentValueTotal).toBe(0);
    });

    it("does not flag low-income coverage at a comfortable mid income", () => {
      const result = estimateHealthcareCosts(baseInput({ annualMagi: fpl * 2.5, fireAge: 55 }));
      expect(result.medicaidEligiblePre65).toBe(false);
      expect(result.medicareLowIncome).toBe(false);
    });
  });
});

describe("benchmark premium estimate", () => {
  it("anchors the CMS age curve at 21 = 1.0 and caps 64+ at 3.0", () => {
    expect(acaAgeCurveFactor(21)).toBe(1.0);
    expect(acaAgeCurveFactor(64)).toBe(3.0);
    expect(acaAgeCurveFactor(70)).toBe(3.0);
    expect(acaAgeCurveFactor(18)).toBe(1.0); // clamped to 21
    expect(acaAgeCurveFactor(40)).toBeCloseTo(1.278, 3);
  });

  it("estimates the benchmark from age, household size, and region", () => {
    const single21 = estimateBenchmarkPremium({ ages: [21], region: "average" });
    expect(single21).toBeCloseTo(NATIONAL_BENCHMARK_SILVER_BASE_21, 2);

    const single64 = estimateBenchmarkPremium({ ages: [64], region: "average" });
    expect(single64).toBeCloseTo(NATIONAL_BENCHMARK_SILVER_BASE_21 * 3, 2);

    const couple55 = estimateBenchmarkPremium({ ages: [55, 55], region: "average" });
    expect(couple55).toBeCloseTo(NATIONAL_BENCHMARK_SILVER_BASE_21 * 2.23 * 2, 1);

    const high = estimateBenchmarkPremium({ ages: [40], region: "high" });
    const low = estimateBenchmarkPremium({ ages: [40], region: "low" });
    expect(high).toBeCloseTo(NATIONAL_BENCHMARK_SILVER_BASE_21 * 1.278 * REGION_MULTIPLIERS.high, 1);
    expect(low).toBeCloseTo(NATIONAL_BENCHMARK_SILVER_BASE_21 * 1.278 * REGION_MULTIPLIERS.low, 1);
  });

  it("fills chosen-plan economics from a metal tier", () => {
    const fill = applyMetalTierPreset({ tier: "bronze", benchmarkMonthly: 1000, people: 1 });
    expect(fill.chosenPlanMonthly).toBeCloseTo(1000 * METAL_TIER_PRESETS.bronze.premiumVsBenchmark, 2);
    expect(fill.acaDeductible).toBe(METAL_TIER_PRESETS.bronze.deductiblePerPerson);
    expect(fill.acaOutOfPocketMax).toBe(METAL_TIER_PRESETS.bronze.oopMaxPerPerson);

    const coupleGold = applyMetalTierPreset({ tier: "gold", benchmarkMonthly: 1000, people: 2 });
    expect(coupleGold.chosenPlanMonthly).toBeCloseTo(1200, 2);
    expect(coupleGold.acaDeductible).toBe(METAL_TIER_PRESETS.gold.deductiblePerPerson * 2);
    expect(coupleGold.acaOutOfPocketMax).toBe(METAL_TIER_PRESETS.gold.oopMaxPerPerson * 2);
  });

  it("feeds the existing subsidy math unchanged", () => {
    const benchmark = estimateBenchmarkPremium({ ages: [55], region: "average" });
    const ptc = estimatePremiumTaxCredit({
      annualMagi: 40_000,
      householdSize: 1,
      benchmarkAnnual: benchmark * 12
    });
    expect(ptc.aboveSubsidyCliff).toBe(false);
    expect(ptc.premiumTaxCredit).toBeGreaterThan(0);
    expect(ptc.premiumTaxCredit).toBeCloseTo(
      benchmark * 12 - 40_000 * ptc.applicablePercent,
      2
    );
  });
});
