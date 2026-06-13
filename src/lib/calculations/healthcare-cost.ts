import {
  ACA_APPLICABLE_PERCENT_FLOOR_2026,
  ACA_APPLICABLE_PERCENT_NODES_2026,
  ACA_SUBSIDY_CLIFF_FPL,
  DEFAULT_DENTAL_VISION_HEARING_ANNUAL,
  DEFAULT_REAL_DISCOUNT_RATE,
  IRMAA_TIERS_2026,
  MEDICAID_FPL_THRESHOLD,
  MEDICARE_AGE,
  MEDICARE_LOW_INCOME_FPL_THRESHOLD,
  MEDIGAP_DRUG_OOP_BY_USAGE,
  MEDIGAP_ER_VISITS_BY_USAGE,
  MEDIGAP_OFFICE_VISITS_BY_USAGE,
  MEDIGAP_PLANS_COVERING_PART_B_DEDUCTIBLE,
  MEDIGAP_PREMIUM_RELATIVITY,
  METAL_TIER_PRESETS,
  NATIONAL_BENCHMARK_SILVER_BASE_21,
  OOP_USAGE_PRESETS,
  PART_B_BASE_PREMIUM_2026,
  PART_B_DEDUCTIBLE_2026,
  PART_D_OOP_CAP_2026,
  PLAN_N_ER_COPAY,
  PLAN_N_EXCESS_CHARGE_BY_USAGE,
  PLAN_N_OFFICE_COPAY,
  REGION_MULTIPLIERS,
  acaAgeCurveFactor,
  csrSilverOopMaxPerPerson,
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
  // The chosen metal tier, when known (estimate mode). Cost-Sharing Reductions
  // (CSR) only apply to SILVER plans at 100–250% FPL, so the engine needs to
  // know the tier to apply the reduced Silver out-of-pocket maximum. Left
  // undefined in exact mode, where the user's entered OOP max is used as-is.
  acaMetalTier?: MetalTier;

  // Medicare inputs (premiums are PER PERSON).
  medicareCoverage: MedicareCoverage;
  medigapMonthly: number;
  partDMonthly: number;
  advantageMonthly: number;
  medicareOutOfPocketMax: number;
  medicareOopUsage: OopUsage;
  medigapPlanLetter?: string;
  medicareInflation: number;

  // Routine dental, vision & hearing — not covered by Original Medicare or
  // Medigap, so a real out-of-pocket cost in the Medicare years. Per person,
  // per year, in today's dollars. Defaults to
  // DEFAULT_DENTAL_VISION_HEARING_ANNUAL when omitted.
  dentalVisionHearingAnnual?: number;

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
  // ACA out-of-pocket maximum actually applied this year (household total), and
  // whether a CSR-reduced Silver maximum was substituted for the standard one.
  acaOutOfPocketMaxApplied: number;
  csrSilverApplied: boolean;
  // Medicare snapshot.
  irmaaTierIndex: number;
  partBMonthlyPerPerson: number;
  // Travel.
  acaNotRequiredAbroad: boolean;
};

const DEFAULT_GENERAL_INFLATION = 0.03;

// 2026 applicable percentage: piecewise-linear interpolation across the table
// nodes, floored at 2.10% only below 133% FPL, with no credit at or above the
// 400% FPL cliff. The 133–150% band ramps (3.14%→3.45%→4.19%) rather than
// sitting flat at the floor. Source: Rev. Proc. 2025-25.
export function acaApplicablePercent(incomePctFpl: number): number | null {
  if (incomePctFpl >= ACA_SUBSIDY_CLIFF_FPL) return null; // subsidy cliff
  const nodes = ACA_APPLICABLE_PERCENT_NODES_2026;
  // Below 133% FPL the percentage floors at 2.10%; at exactly 133% it picks up
  // the first table node (3.14%) and interpolates upward from there.
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

// Effective monthly Medigap premium for a plan letter. The entered premium is
// the Plan-G-equivalent base; the effective premium is that base × the letter's
// relativity factor, so switching the plan letter re-prices the premium
// automatically (Plan N cheaper, Plan F richer than Plan G).
export function medigapEffectiveMonthlyPremium(
  medigapMonthlyBase: number,
  planLetter?: string
): number {
  const letter = (planLetter ?? "G").toUpperCase();
  const relativity = MEDIGAP_PREMIUM_RELATIVITY[letter] ?? 1.0;
  return round2(Math.max(0, medigapMonthlyBase) * relativity);
}

// Medical (non-drug) cost-sharing the enrollee pays out of pocket in a year,
// per person, by Medigap plan letter and usage level. This is the part that
// actually differs across letters — it is what drives the Plan G vs Plan N
// crossover (Plan N is cheaper at low usage, but its per-visit copays and
// excess-charge exposure overtake Plan G's flat deductible at high usage):
//   • Plan F (and other deductible-covering letters): $0 — covers the Part B
//     deductible and all other cost-sharing.
//   • Plan N: Part B deductible + (office visits × $20) + (ER visits × $50) +
//     an excess-charge allowance.
//   • Plan G (and other deductible-exposing letters): the Part B deductible
//     only — flat regardless of usage.
// Source: medicare.gov Medigap; CMS 2026 Part B deductible.
export function medigapMedicalCostSharing(planLetter: string, usage: OopUsageLevel): number {
  const letter = planLetter.toUpperCase();
  const coversPartBDeductible = (
    MEDIGAP_PLANS_COVERING_PART_B_DEDUCTIBLE as readonly string[]
  ).includes(letter);
  // Plan F / C cover the Part B deductible AND all other cost-sharing → $0.
  if (coversPartBDeductible) return 0;
  if (letter === "N") {
    const officeCopays = MEDIGAP_OFFICE_VISITS_BY_USAGE[usage] * PLAN_N_OFFICE_COPAY;
    const erCopays = MEDIGAP_ER_VISITS_BY_USAGE[usage] * PLAN_N_ER_COPAY;
    const excessCharges = PLAN_N_EXCESS_CHARGE_BY_USAGE[usage];
    return PART_B_DEDUCTIBLE_2026 + officeCopays + erCopays + excessCharges;
  }
  // Plan G and other deductible-exposing letters: Part B deductible only.
  return PART_B_DEDUCTIBLE_2026;
}

// Expected annual out-of-pocket for the Original Medicare + Medigap path, per
// person, in today's dollars. Original Medicare + Medigap has NO out-of-pocket
// maximum, so the Medicare-Advantage-style "OOP max × usage" model does not
// apply. Instead the exposure is the plan letter's medical cost-sharing (above)
// plus a Part D drug component that is identical across letters (drug spend is
// a Part D matter, not a Medigap-letter one), capped at the 2026 Part D OOP
// ceiling. Routine dental/vision/hearing is added separately by the caller.
// Source: medicare.gov Medigap; CMS 2026 Part B deductible & Part D redesign.
export function medigapExpectedOutOfPocket(usage: OopUsage, planLetter?: string): number {
  // An explicit dollar override always wins.
  if (typeof usage === "object") return Math.max(0, usage.expectedAnnualOop);

  const letter = (planLetter ?? "G").toUpperCase();
  const medical = medigapMedicalCostSharing(letter, usage);
  const drugOop = Math.min(PART_D_OOP_CAP_2026, MEDIGAP_DRUG_OOP_BY_USAGE[usage]);
  return medical + drugOop;
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
  // Cost-Sharing Reductions: a SILVER plan at 100–250% FPL gets a reduced OOP
  // maximum (per person), so override the plan's standard OOP max before
  // computing expected out-of-pocket. Non-silver or out-of-band income keeps the
  // entered max. CSR is Silver-only and never reconciled at tax time.
  const csrOopMaxPerPerson =
    input.acaMetalTier === "silver" ? csrSilverOopMaxPerPerson(ptc.incomePctFpl) : null;
  const effectiveAcaOopMax =
    csrOopMaxPerPerson !== null ? csrOopMaxPerPerson * people : input.acaOutOfPocketMax;
  const acaOop0 = expectedOutOfPocket(input.acaOopUsage, effectiveAcaOopMax);

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
  // The entered Medigap premium is the Plan-G-equivalent base; the plan letter's
  // relativity factor re-prices it (Plan N cheaper, Plan F richer), so switching
  // letter changes the premium automatically.
  const effectiveMedigapMonthly = medigapEffectiveMonthlyPremium(
    input.medigapMonthly,
    input.medigapPlanLetter
  );
  const medicareCoverage0 =
    input.medicareCoverage === "medigap"
      ? (effectiveMedigapMonthly + input.partDMonthly) * 12 * people
      : input.advantageMonthly * 12 * people;
  // Medicare out-of-pocket is modeled differently by coverage type. Medicare
  // Advantage has a real annual out-of-pocket maximum, so the "OOP max × usage"
  // model applies. Original Medicare + Medigap has NO OOP max — its predictable
  // exposure is the Part B deductible plus small plan/drug cost-sharing — so it
  // uses a plan-letter model instead. Both are PER PERSON, scaled by people to
  // match the premium columns (which are already ×people).
  const medicareOop0 =
    input.medicareCoverage === "advantage"
      ? expectedOutOfPocket(input.medicareOopUsage, input.medicareOutOfPocketMax) * people
      : medigapExpectedOutOfPocket(input.medicareOopUsage, input.medigapPlanLetter) * people;
  // HSA-eligible Medicare premium portion (excludes Medigap premiums, which are
  // not HSA-qualified; Part D and Medicare Advantage premiums are).
  const medicareEligiblePremium0 =
    input.medicareCoverage === "medigap"
      ? annualPartB0 + input.partDMonthly * 12 * people + annualPartDSurcharge0
      : annualPartB0 + medicareCoverage0 + annualPartDSurcharge0;

  // Routine dental, vision & hearing — uncovered by Original Medicare/Medigap,
  // so a real Medicare-years out-of-pocket cost. Per person, scaled by people to
  // match the other per-person Medicare figures.
  const dvhAnnual0 =
    Math.max(0, input.dentalVisionHearingAnnual ?? DEFAULT_DENTAL_VISION_HEARING_ANNUAL) * people;

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
        // plan replaces the supplemental coverage and Part D. Dental/vision/
        // hearing stays a cost — it's uncovered either way.
        premium0 = annualPartB0;
        oop0 = medicareOop0 + dvhAnnual0;
        eligiblePremium0 = annualPartB0;
      } else {
        premium0 = annualPartB0 + medicareCoverage0 + annualPartDSurcharge0;
        // Add routine dental/vision/hearing — uncovered by Medicare + Medigap.
        oop0 = medicareOop0 + dvhAnnual0;
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
    acaOutOfPocketMaxApplied: round2(effectiveAcaOopMax),
    csrSilverApplied: csrOopMaxPerPerson !== null,
    irmaaTierIndex: irmaa.index,
    partBMonthlyPerPerson: round2(partBMonthlyPerPerson),
    acaNotRequiredAbroad: input.daysAbroadPerYear >= 330
  };
}
