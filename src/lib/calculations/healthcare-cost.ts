import {
  ACA_APPLICABLE_PERCENT_FLOOR_2026,
  ACA_APPLICABLE_PERCENT_NODES_2026,
  ACA_SUBSIDY_CLIFF_FPL,
  DEFAULT_REAL_DISCOUNT_RATE,
  IRMAA_TIERS_2026,
  MEDICAID_FPL_THRESHOLD,
  MEDICARE_AGE,
  MEDICARE_LOW_INCOME_FPL_THRESHOLD,
  METAL_TIER_PRESETS,
  NATIONAL_BENCHMARK_SILVER_BASE_21,
  OOP_USAGE_PRESETS,
  PART_B_BASE_PREMIUM_2026,
  REGION_MULTIPLIERS,
  acaAgeCurveFactor,
  federalPovertyLevel,
  type IrmaaTier,
  type MetalTier,
  type OopUsageLevel,
  type RegionCostLevel
} from "@/lib/calculations/healthcare-data";

export type HealthcareHousehold = "single" | "couple";
export type MedicareCoverage = "medigap" | "advantage";
export type HsaStrategy = "gap_first" | "medicare_first" | "off";
export type TravelMode = "off" | "supplement" | "replace";
export type HealthcarePhase = "aca" | "medicare";

// Either a preset usage level or an explicit expected annual out-of-pocket
// amount (in today's dollars).
export type OopUsage = OopUsageLevel | { expectedAnnualOop: number };

export type HealthcareCostInput = {
  household: HealthcareHousehold;
  currentAge: number;
  fireAge: number;
  medicareAge: number;
  planToAge: number;

  // Shared income driver (today's dollars).
  annualMagi: number;
  // Optional separate MAGI for the IRMAA tier lookup; defaults to annualMagi.
  medicareMagi?: number;

  // ACA gap-year inputs (premiums are HOUSEHOLD totals).
  benchmarkSlcspMonthly: number;
  chosenPlanMonthly: number;
  acaDeductible: number;
  acaOutOfPocketMax: number;
  acaOopUsage: OopUsage;
  acaInflation: number;

  // Medicare inputs (premiums are PER PERSON).
  medicareCoverage: MedicareCoverage;
  medigapMonthly: number;
  partDMonthly: number;
  advantageMonthly: number;
  medicareOutOfPocketMax: number;
  medicareOopUsage: OopUsage;
  medigapPlanLetter?: string;
  medicareInflation: number;

  // General price inflation, used to convert nominal medical costs to today's
  // dollars. Defaults to 3%.
  generalInflation?: number;

  // HSA.
  hsaBalance: number;
  hsaGrowth: number;
  hsaStrategy: HsaStrategy;

  // Travel / abroad.
  travelMode: TravelMode;
  daysAbroadPerYear: number;
  travelAnnualPremium: number;
};

export type HealthcareYearRow = {
  year: number;
  age: number;
  phase: HealthcarePhase;
  // All dollar fields below are NOMINAL (future, inflated) dollars — the actual
  // sticker price in that future year. The view layer multiplies by one of the
  // two deflators to present today's-dollar figures, so a single basis-
  // independent series drives every display without recomputing.
  //
  // Premium the household actually pays (ACA net of subsidy; Medicare Part B +
  // coverage + Part D IRMAA), before HSA funding.
  premium: number;
  // ACA premium tax credit applied this year (0 during Medicare).
  subsidy: number;
  outOfPocket: number;
  travelPremium: number;
  hsaDraw: number;
  // Total economic cost this year.
  grossCost: number;
  // Cost funded from the portfolio after HSA drawdown.
  netPortfolioCost: number;
  // Multiply any nominal field by this to get the undiscounted today's-dollar
  // (real) value: 1 / (1 + general inflation)^years.
  realDeflator: number;
  // Multiply any nominal field by this to get the discounted present value in
  // today's dollars: 1 / ((1 + general inflation)(1 + real discount rate))^years.
  // Summing grossCost × presentValueDeflator across rows reproduces
  // presentValueTotal, so the year-by-year rows reconcile to the headline.
  presentValueDeflator: number;
};

export type HealthcareCostResult = {
  rows: HealthcareYearRow[];
  acaYears: number;
  medicareYears: number;
  totalGrossCost: number;
  totalNetPortfolioCost: number;
  totalAcaCost: number;
  totalMedicareCost: number;
  totalSubsidy: number;
  totalHsaUsed: number;
  hsaDepletedAge: number | null;
  averageAcaAnnualCost: number;
  averageMedicareAnnualCost: number;
  // --- Present-value headline (today's dollars). ---
  // Each future year's real cost discounted to today at the real discount rate
  // and summed: "what to set aside today to cover a lifetime of healthcare".
  presentValueTotal: number;
  presentValueAcaCost: number;
  presentValueMedicareCost: number;
  // Undiscounted average yearly cost in today's dollars (the sub-line figure).
  averageAnnualTodayDollars: number;
  // Undiscounted real (today's-dollar) lifetime sum, for reference.
  todayDollarsLifetimeTotal: number;
  // Nominal cumulative lifetime total (full medical trend) — the labeled
  // "future (inflated) dollars" figure, available in either display mode.
  nominalLifetimeTotal: number;
  realDiscountRate: number;
  // Low-income public-coverage flags driving the Medicaid/MSP callout.
  medicaidEligiblePre65: boolean;
  medicareLowIncome: boolean;
  // ACA snapshot (real, first ACA year) for headline callouts.
  incomePctFpl: number;
  applicablePercent: number;
  aboveSubsidyCliff: boolean;
  firstYearSubsidy: number;
  // Medicare snapshot.
  irmaaTierIndex: number;
  partBMonthlyPerPerson: number;
  // Travel.
  acaNotRequiredAbroad: boolean;
};

const DEFAULT_GENERAL_INFLATION = 0.03;

// 2026 applicable percentage: piecewise-linear interpolation across the table
// nodes, floored at 2.10% below 150% FPL, with no credit at or above the 400%
// FPL cliff. Source: Rev. Proc. 2025-25.
export function acaApplicablePercent(incomePctFpl: number): number | null {
  if (incomePctFpl >= ACA_SUBSIDY_CLIFF_FPL) return null; // subsidy cliff
  const nodes = ACA_APPLICABLE_PERCENT_NODES_2026;
  // Below 150% FPL the percentage floors at 2.10%; at exactly 150% it picks up
  // the first table node (4.19%).
  if (incomePctFpl < nodes[0].fplPct) return ACA_APPLICABLE_PERCENT_FLOOR_2026;

  for (let i = 1; i < nodes.length; i += 1) {
    const prev = nodes[i - 1];
    const next = nodes[i];
    if (incomePctFpl <= next.fplPct) {
      const span = next.fplPct - prev.fplPct;
      const ratio = span === 0 ? 0 : (incomePctFpl - prev.fplPct) / span;
      return prev.percent + ratio * (next.percent - prev.percent);
    }
  }

  return nodes[nodes.length - 1].percent;
}

// Estimate the household's monthly benchmark (SLCSP) premium from the covered
// adults' ages and an area cost band, so users don't need to window-shop
// healthcare.gov before getting a useful subsidy estimate.
// benchmark = base-at-21 × CMS age factor (per person, summed) × region band.
export function estimateBenchmarkPremium({
  ages,
  region
}: {
  ages: number[];
  region: RegionCostLevel;
}) {
  const regionMultiplier = REGION_MULTIPLIERS[region];
  const total = ages.reduce(
    (sum, age) => sum + NATIONAL_BENCHMARK_SILVER_BASE_21 * acaAgeCurveFactor(age),
    0
  );
  return round2(total * regionMultiplier);
}

// Fill chosen-plan premium, deductible, and out-of-pocket max from a metal
// tier, given the household benchmark premium and number of covered people.
export function applyMetalTierPreset({
  tier,
  benchmarkMonthly,
  people
}: {
  tier: MetalTier;
  benchmarkMonthly: number;
  people: number;
}) {
  const preset = METAL_TIER_PRESETS[tier];
  return {
    chosenPlanMonthly: round2(benchmarkMonthly * preset.premiumVsBenchmark),
    acaDeductible: preset.deductiblePerPerson * people,
    acaOutOfPocketMax: preset.oopMaxPerPerson * people
  };
}

export type PremiumTaxCreditResult = {
  incomePctFpl: number;
  applicablePercent: number;
  requiredContribution: number;
  premiumTaxCredit: number;
  aboveSubsidyCliff: boolean;
};

export function estimatePremiumTaxCredit({
  annualMagi,
  householdSize,
  benchmarkAnnual
}: {
  annualMagi: number;
  householdSize: number;
  benchmarkAnnual: number;
}): PremiumTaxCreditResult {
  const fpl = federalPovertyLevel(householdSize);
  const incomePctFpl = fpl > 0 ? annualMagi / fpl : 0;
  const applicablePercent = acaApplicablePercent(incomePctFpl);

  if (applicablePercent === null) {
    return {
      incomePctFpl,
      applicablePercent: 0,
      requiredContribution: annualMagi,
      premiumTaxCredit: 0,
      aboveSubsidyCliff: true
    };
  }

  const requiredContribution = Math.max(0, annualMagi) * applicablePercent;
  const premiumTaxCredit = Math.max(0, benchmarkAnnual - requiredContribution);

  return {
    incomePctFpl,
    applicablePercent,
    requiredContribution,
    premiumTaxCredit,
    aboveSubsidyCliff: false
  };
}

export function selectIrmaaTier(
  magi: number,
  household: HealthcareHousehold
): { tier: IrmaaTier; index: number } {
  for (let index = 0; index < IRMAA_TIERS_2026.length; index += 1) {
    const tier = IRMAA_TIERS_2026[index];
    const ceiling = household === "couple" ? tier.marriedJointMax : tier.singleMax;
    if (magi <= ceiling) return { tier, index };
  }
  const lastIndex = IRMAA_TIERS_2026.length - 1;
  return { tier: IRMAA_TIERS_2026[lastIndex], index: lastIndex };
}

function expectedOutOfPocket(usage: OopUsage, oopMax: number): number {
  if (typeof usage === "object") return Math.max(0, usage.expectedAnnualOop);
  return OOP_USAGE_PRESETS[usage] * Math.max(0, oopMax);
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

export function estimateHealthcareCosts(input: HealthcareCostInput): HealthcareCostResult {
  const generalInflation = input.generalInflation ?? DEFAULT_GENERAL_INFLATION;
  const household = input.household;
  const people = household === "couple" ? 2 : 1;
  const householdSize = people;
  const medicareAge = input.medicareAge || MEDICARE_AGE;
  const currentYear = new Date().getFullYear();

  // The series is computed ONCE in nominal (future, inflated) dollars — the
  // actual sticker price in each future year — and the view layer converts to
  // today's dollars by multiplying by a deflator. This keeps the dollar basis a
  // pure presentation choice: switching it never recomputes the model.

  // Nominal growth factor (full medical trend) from now to a given age.
  const nominalGrowthFactor = (medicalInflation: number, age: number) =>
    Math.pow(1 + medicalInflation, Math.max(0, age - input.currentAge));

  // Nominal → undiscounted today's-dollar (real) deflator: strips general
  // inflation so the figure is in today's purchasing power.
  const realDeflatorAt = (age: number) =>
    1 / Math.pow(1 + generalInflation, Math.max(0, age - input.currentAge));

  // Nominal → discounted present-value deflator: strips general inflation AND
  // discounts the remaining real cost to today at the real discount rate. This
  // is what the today's-dollar headline sums, so the per-year present values
  // reconcile to it.
  const realDiscountRate = DEFAULT_REAL_DISCOUNT_RATE;
  const presentValueDeflatorAt = (age: number) =>
    realDeflatorAt(age) / Math.pow(1 + realDiscountRate, Math.max(0, age - input.currentAge));

  // --- ACA economics, computed once in today's-dollar (year-0) terms. ---
  const ptc = estimatePremiumTaxCredit({
    annualMagi: input.annualMagi,
    householdSize,
    benchmarkAnnual: input.benchmarkSlcspMonthly * 12
  });
  const chosenAnnual0 = input.chosenPlanMonthly * 12;
  const acaNetPremium0 = Math.max(0, chosenAnnual0 - ptc.premiumTaxCredit);
  const acaSubsidy0 = chosenAnnual0 - acaNetPremium0;
  const acaOop0 = expectedOutOfPocket(input.acaOopUsage, input.acaOutOfPocketMax);

  // Low-income public-coverage flags (household-size-aware via the PTC's FPL%).
  // Below the Medicaid threshold the pre-65 ACA premium and out-of-pocket are
  // modeled as ~free; below the Medicare low-income threshold, Medicare premiums
  // and cost-sharing are modeled as ~free (MSP + Extra Help).
  const incomePctFpl = ptc.incomePctFpl;
  const medicaidEligiblePre65 = incomePctFpl < MEDICAID_FPL_THRESHOLD;
  const medicareLowIncome = incomePctFpl < MEDICARE_LOW_INCOME_FPL_THRESHOLD;

  // --- Medicare economics, year-0 terms. ---
  const irmaa = selectIrmaaTier(input.medicareMagi ?? input.annualMagi, household);
  const partBMonthlyPerPerson = PART_B_BASE_PREMIUM_2026 * irmaa.tier.partBMultiplier;
  const annualPartB0 = partBMonthlyPerPerson * 12 * people;
  const annualPartDSurcharge0 = irmaa.tier.partDMonthlySurcharge * 12 * people;
  const medicareCoverage0 =
    input.medicareCoverage === "medigap"
      ? (input.medigapMonthly + input.partDMonthly) * 12 * people
      : input.advantageMonthly * 12 * people;
  // The Medicare out-of-pocket figure is entered PER PERSON, so scale it by the
  // number of people to match the premium columns (which are already ×people).
  // Previously this was not multiplied, under-charging couples' Medicare OOP.
  const medicareOop0 =
    expectedOutOfPocket(input.medicareOopUsage, input.medicareOutOfPocketMax) * people;
  // HSA-eligible Medicare premium portion (excludes Medigap premiums, which are
  // not HSA-qualified; Part D and Medicare Advantage premiums are).
  const medicareEligiblePremium0 =
    input.medicareCoverage === "medigap"
      ? annualPartB0 + input.partDMonthly * 12 * people + annualPartDSurcharge0
      : annualPartB0 + medicareCoverage0 + annualPartDSurcharge0;

  const travelAnnual0 = input.travelMode === "off" ? 0 : input.travelAnnualPremium;

  const startAge = Math.max(input.fireAge, input.currentAge);
  const endAge = Math.max(startAge, input.planToAge);

  const rows: HealthcareYearRow[] = [];
  let hsaBalance = Math.max(0, input.hsaBalance);
  let hsaDepletedAge: number | null = null;
  let totalHsaUsed = 0;

  // Present-value (discounted, today's dollars) and reference real/nominal sums.
  let presentValueAcaCost = 0;
  let presentValueMedicareCost = 0;
  let realAcaCost = 0;
  let realMedicareCost = 0;
  let nominalAcaCost = 0;
  let nominalMedicareCost = 0;

  for (let age = startAge; age <= endAge; age += 1) {
    const phase: HealthcarePhase = age < medicareAge ? "aca" : "medicare";
    const medicalInflation = phase === "aca" ? input.acaInflation : input.medicareInflation;
    const nominalFactor = nominalGrowthFactor(medicalInflation, age);
    const realDeflator = realDeflatorAt(age);
    const presentValueDeflator = presentValueDeflatorAt(age);

    // Year-0 (today's-dollar) component amounts, with the low-income public-
    // coverage override applied. These are basis-independent; the display,
    // real, and nominal values are derived by applying the matching factor.
    let premium0: number;
    let subsidy0: number;
    let oop0: number;
    let eligiblePremium0: number; // HSA-qualified premium portion

    if (phase === "aca") {
      if (medicaidEligiblePre65) {
        // Medicaid (<138% FPL pre-65): premium and out-of-pocket are ~free.
        premium0 = 0;
        subsidy0 = 0;
        oop0 = 0;
        eligiblePremium0 = 0;
      } else if (input.travelMode === "replace") {
        // Drop the US marketplace baseline; rely on the global/expat plan.
        premium0 = 0;
        subsidy0 = 0;
        oop0 = acaOop0;
        eligiblePremium0 = 0;
      } else {
        premium0 = acaNetPremium0;
        subsidy0 = acaSubsidy0;
        oop0 = acaOop0;
        eligiblePremium0 = 0; // marketplace premiums are not HSA-qualified
      }
    } else {
      subsidy0 = 0;
      if (medicareLowIncome) {
        // Medicare Savings Program + Extra Help (low income 65+): Part B/D
        // premiums and cost-sharing driven to ~free.
        premium0 = 0;
        oop0 = 0;
        eligiblePremium0 = 0;
      } else if (input.travelMode === "replace") {
        // Part B must continue (late-enrollment penalty otherwise); the global
        // plan replaces the supplemental coverage and Part D.
        premium0 = annualPartB0;
        oop0 = medicareOop0;
        eligiblePremium0 = annualPartB0;
      } else {
        premium0 = annualPartB0 + medicareCoverage0 + annualPartDSurcharge0;
        oop0 = medicareOop0;
        eligiblePremium0 = medicareEligiblePremium0;
      }
    }

    // Nominal (future, inflated) dollar amounts — the actual sticker price in
    // this future year. These are stored on the row; the view layer applies a
    // deflator to show today's dollars.
    const premium = premium0 * nominalFactor;
    const subsidy = subsidy0 * nominalFactor;
    const outOfPocket = oop0 * nominalFactor;
    const travelPremium = travelAnnual0 * nominalFactor;
    const eligiblePremium = eligiblePremium0 * nominalFactor;

    const grossCost = premium + outOfPocket + travelPremium;

    // The same nominal gross expressed in the three reconciling bases: nominal
    // (sticker), undiscounted today's-dollar (real), and discounted present
    // value. Summing presentValueGross across years IS the today's-dollar
    // headline, so the per-year rows add up to it.
    const nominalGross = grossCost;
    const realGross = grossCost * realDeflator;
    const presentValueGross = grossCost * presentValueDeflator;

    if (phase === "aca") {
      presentValueAcaCost += presentValueGross;
      realAcaCost += realGross;
      nominalAcaCost += nominalGross;
    } else {
      presentValueMedicareCost += presentValueGross;
      realMedicareCost += realGross;
      nominalMedicareCost += nominalGross;
    }

    // HSA drawdown. gap_first draws in both phases; medicare_first reserves the
    // HSA for the Medicare years; off never draws.
    const strategyActive =
      input.hsaStrategy === "gap_first" ||
      (input.hsaStrategy === "medicare_first" && phase === "medicare");
    // HSA can fund qualified premiums plus all out-of-pocket spend (and travel
    // premiums are not qualified).
    const hsaEligibleExpense = eligiblePremium + outOfPocket;
    hsaBalance *= 1 + input.hsaGrowth;
    let hsaDraw = 0;
    if (strategyActive && hsaBalance > 0 && hsaEligibleExpense > 0) {
      hsaDraw = Math.min(hsaBalance, hsaEligibleExpense);
      hsaBalance -= hsaDraw;
      totalHsaUsed += hsaDraw;
      if (hsaBalance <= 0.005 && hsaDepletedAge === null) {
        hsaDepletedAge = age;
      }
    }

    const netPortfolioCost = grossCost - hsaDraw;

    rows.push({
      year: currentYear + (age - input.currentAge),
      age,
      phase,
      premium: round2(premium),
      subsidy: round2(subsidy),
      outOfPocket: round2(outOfPocket),
      travelPremium: round2(travelPremium),
      hsaDraw: round2(hsaDraw),
      grossCost: round2(grossCost),
      netPortfolioCost: round2(netPortfolioCost),
      realDeflator,
      presentValueDeflator
    });
  }

  const acaRows = rows.filter((row) => row.phase === "aca");
  const medicareRows = rows.filter((row) => row.phase === "medicare");
  const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

  const totalAcaCost = sum(acaRows.map((row) => row.grossCost));
  const totalMedicareCost = sum(medicareRows.map((row) => row.grossCost));
  const totalGrossCost = totalAcaCost + totalMedicareCost;
  const totalNetPortfolioCost = sum(rows.map((row) => row.netPortfolioCost));
  const totalSubsidy = sum(rows.map((row) => row.subsidy));

  const presentValueTotal = presentValueAcaCost + presentValueMedicareCost;
  const todayDollarsLifetimeTotal = realAcaCost + realMedicareCost;
  const nominalLifetimeTotal = nominalAcaCost + nominalMedicareCost;
  const totalYears = rows.length;

  return {
    rows,
    acaYears: acaRows.length,
    medicareYears: medicareRows.length,
    totalGrossCost: round2(totalGrossCost),
    totalNetPortfolioCost: round2(totalNetPortfolioCost),
    totalAcaCost: round2(totalAcaCost),
    totalMedicareCost: round2(totalMedicareCost),
    totalSubsidy: round2(totalSubsidy),
    totalHsaUsed: round2(totalHsaUsed),
    hsaDepletedAge,
    averageAcaAnnualCost: acaRows.length ? round2(totalAcaCost / acaRows.length) : 0,
    averageMedicareAnnualCost: medicareRows.length
      ? round2(totalMedicareCost / medicareRows.length)
      : 0,
    presentValueTotal: round2(presentValueTotal),
    presentValueAcaCost: round2(presentValueAcaCost),
    presentValueMedicareCost: round2(presentValueMedicareCost),
    averageAnnualTodayDollars: totalYears ? round2(todayDollarsLifetimeTotal / totalYears) : 0,
    todayDollarsLifetimeTotal: round2(todayDollarsLifetimeTotal),
    nominalLifetimeTotal: round2(nominalLifetimeTotal),
    realDiscountRate,
    medicaidEligiblePre65,
    medicareLowIncome,
    incomePctFpl: ptc.incomePctFpl,
    applicablePercent: ptc.applicablePercent,
    aboveSubsidyCliff: ptc.aboveSubsidyCliff,
    firstYearSubsidy: round2(acaSubsidy0),
    irmaaTierIndex: irmaa.index,
    partBMonthlyPerPerson: round2(partBMonthlyPerPerson),
    acaNotRequiredAbroad: input.daysAbroadPerYear >= 330
  };
}
