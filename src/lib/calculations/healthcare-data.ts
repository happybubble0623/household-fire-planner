// 2026 healthcare planning constants for the retirement / FIRE medical cost
// calculator. All figures are the published 2026 numbers and are kept in one
// place (mirroring the data tables in social-security.ts) so they can be
// refreshed each plan year without touching the calculation engine.
//
// IMPORTANT: these are planning estimates from public figures. Marketplace
// (SLCSP), Medigap, and Medicare Advantage prices vary by area and age and must
// be confirmed on healthcare.gov / medicare.gov.

// ---------------------------------------------------------------------------
// ACA marketplace (pre-65 gap years)
// ---------------------------------------------------------------------------

// 2025 HHS poverty guidelines, 48 contiguous states + DC. 2026 marketplace
// coverage uses the *prior* year's (2025) guidelines. This is the single source
// of truth for every Federal Poverty Level dollar shown anywhere in the app —
// the threshold dollars in the eligibility callouts are derived from these
// figures and the multiples below, never hardcoded separately.
// Source: HHS ASPE 2025 Poverty Guidelines, as compiled in
// docs/product-strategy/HEALTHCARE_2026_DATA.md (2026 coverage / 2025 FPL
// guidelines). 100% FPL = $15,650 (1 person), $21,150 (2), +$5,500 each more.
// LIMITATION: Alaska and Hawaii have separate, higher poverty guidelines that
// this calculator does not model. Residents of those states will see ACA
// subsidies estimated slightly low.
export const FPL_2025_48_STATES = {
  base: 15_650, // one-person household
  perAdditionalPerson: 5_500 // each additional person ($21,150 for 2)
};

export function federalPovertyLevel(householdSize: number) {
  const size = Math.max(1, Math.round(householdSize));
  return FPL_2025_48_STATES.base + (size - 1) * FPL_2025_48_STATES.perAdditionalPerson;
}

// 2026 ACA applicable-percentage table (the share of household income a
// household is expected to pay toward the benchmark silver plan). The enhanced
// ARPA/IRA subsidies expired 2025-12-31, so 2026 reverts to the original ACA
// structure WITH the 400% FPL subsidy cliff reinstated.
// Source: Rev. Proc. 2025-25 (IRC 36B applicable percentages for 2026). The
// 133–150% band is NOT flat — it ramps from 3.14% (133%) through 3.45% (138%)
// to 4.19% (150%); only income strictly below 133% FPL gets the 2.10% floor.
export const ACA_APPLICABLE_PERCENT_NODES_2026: Array<{ fplPct: number; percent: number }> = [
  { fplPct: 1.33, percent: 0.0314 },
  { fplPct: 1.38, percent: 0.0345 },
  { fplPct: 1.5, percent: 0.0419 },
  { fplPct: 2.0, percent: 0.066 },
  { fplPct: 2.5, percent: 0.0844 },
  { fplPct: 3.0, percent: 0.0996 },
  { fplPct: 4.0, percent: 0.0996 }
];

// Below 133% FPL the applicable percentage floors at 2.10%.
export const ACA_APPLICABLE_PERCENT_FLOOR_2026 = 0.021;
// At or above this multiple of FPL no premium tax credit is available (the
// reinstated 2026 subsidy cliff).
export const ACA_SUBSIDY_CLIFF_FPL = 4.0;

export const DEFAULT_ACA_INFLATION = 0.055;

// Present-value discounting for the lifetime headline. Each future year's real
// (today's-dollar) cost is discounted back to today at this real rate before
// summing, so the headline answers "what to set aside today" instead of an
// undiscounted cumulative sum of real-growing costs (which overstates the
// burden vs. published benchmarks like Fidelity's). 3%/yr real ≈ a conservative
// real investment return; a candidate to expose as a user input later.
export const DEFAULT_REAL_DISCOUNT_RATE = 0.03;

// Low-income public-coverage thresholds, expressed as a share of the
// (household-size-aware) Federal Poverty Level. Below these, the calculator
// models near-free public coverage so a low-income household isn't shown costing
// roughly the same as a mid-income one.
//   Pre-65: ACA Medicaid expansion covers adults up to 138% FPL (expansion
//           states). Non-expansion states differ — surfaced as a disclaimer.
//   65+:    Medicare Savings Programs (QMB/SLMB/QI run 100–135% FPL) plus Part D
//           Extra Help; 135% FPL is used as one simplifying threshold for both.
export const MEDICAID_FPL_THRESHOLD = 1.38;
export const MEDICARE_LOW_INCOME_FPL_THRESHOLD = 1.35;

// Concrete income thresholds (whole dollars) used by the eligibility callouts,
// derived from the household-size-aware FPL above and the SAME multiples the
// subsidy engine uses — so the dollar shown to the user can never drift from the
// number the model actually applies. With the 2026 figures these resolve to the
// values in HEALTHCARE_2026_DATA.md: e.g. household of 2 → Medicaid line (138%)
// $29,187, subsidy cliff (400%) $84,600; household of 1 → $21,597 and $62,600.
export function medicaidIncomeThreshold(householdSize: number) {
  return Math.round(federalPovertyLevel(householdSize) * MEDICAID_FPL_THRESHOLD);
}

export function subsidyCliffIncome(householdSize: number) {
  return Math.round(federalPovertyLevel(householdSize) * ACA_SUBSIDY_CLIFF_FPL);
}

// ---------------------------------------------------------------------------
// Internal benchmark-premium estimate (so users don't have to look up their
// SLCSP on healthcare.gov before getting a useful number)
// ---------------------------------------------------------------------------

// CMS Default Standardized Age Curve (federal default; most states use it).
// Factor is relative to age 21 = 1.000; ages 64+ cap at 3.000.
// Source: CMS Market Rating Reforms — Default Standardized Age Curve.
export const ACA_AGE_CURVE: Record<number, number> = {
  21: 1.0, 22: 1.0, 23: 1.0, 24: 1.0,
  25: 1.004, 26: 1.024, 27: 1.048, 28: 1.087, 29: 1.119,
  30: 1.135, 31: 1.159, 32: 1.183, 33: 1.198, 34: 1.214,
  35: 1.222, 36: 1.23, 37: 1.238, 38: 1.246, 39: 1.262,
  40: 1.278, 41: 1.302, 42: 1.325, 43: 1.357, 44: 1.397,
  45: 1.444, 46: 1.5, 47: 1.563, 48: 1.635, 49: 1.706,
  50: 1.786, 51: 1.865, 52: 1.952, 53: 2.04, 54: 2.135,
  55: 2.23, 56: 2.333, 57: 2.437, 58: 2.548, 59: 2.603,
  60: 2.714, 61: 2.81, 62: 2.873, 63: 2.952, 64: 3.0
};

export function acaAgeCurveFactor(age: number) {
  const clamped = Math.min(64, Math.max(21, Math.round(age)));
  return ACA_AGE_CURVE[clamped] ?? 1.0;
}

// National-average benchmark (second-lowest-cost silver) premium normalized to
// age 21, per person per month. Derived from the KFF/CMS 2025 national average
// benchmark of ~$497/mo for a 40-year-old (497 / 1.278 ≈ 390).
// Source: KFF Marketplace Average Benchmark Premiums; CMS Marketplace data.
export const NATIONAL_BENCHMARK_SILVER_BASE_21 = 390;

// Approximate cost-of-area bands. Marketplace premiums vary roughly ±25%
// around the national average across rating areas.
export const REGION_MULTIPLIERS = {
  low: 0.78,
  average: 1.0,
  high: 1.25
} as const;

export type RegionCostLevel = keyof typeof REGION_MULTIPLIERS;

// Statutory ACA maximum out-of-pocket, 2026 plan year (revised methodology):
// $10,600 self-only / $21,200 other-than-self-only. Source: HHS revised 2026
// cost-sharing limits (CMS, July 2025) — supersedes the earlier $10,150/$20,300.
export const ACA_OOP_MAX_2026_SELF_ONLY = 10_600;

// Typical plan economics per metal tier, relative to the benchmark silver
// premium, with representative deductibles and per-person out-of-pocket maxima.
// Bronze plans typically sit at (or near) the statutory cap; silver and gold
// run progressively lower. Family limits are these per-person figures doubled.
// Sources: KFF metal-tier average premium & deductible analyses; HHS 2026
// statutory out-of-pocket maximum.
export type MetalTier = "bronze" | "silver" | "gold";

export const METAL_TIER_PRESETS: Record<
  MetalTier,
  { premiumVsBenchmark: number; deductiblePerPerson: number; oopMaxPerPerson: number }
> = {
  bronze: { premiumVsBenchmark: 0.8, deductiblePerPerson: 7_500, oopMaxPerPerson: 10_600 },
  silver: { premiumVsBenchmark: 1.0, deductiblePerPerson: 5_000, oopMaxPerPerson: 8_500 },
  gold: { premiumVsBenchmark: 1.2, deductiblePerPerson: 1_500, oopMaxPerPerson: 6_500 }
};

// Cost-Sharing Reductions (CSR), 2026. Enrollees at 100–250% FPL who pick a
// SILVER plan are auto-enrolled in a higher-actuarial-value Silver variant with
// a statutorily reduced out-of-pocket maximum. The reduced self-only maxima by
// FPL band (family = ×2):
//   100–200% FPL (94% & 87% AV variants) → $3,500 / $7,000
//   201–250% FPL (73% AV variant)        → $8,450 / $16,900
//   >250% FPL (no CSR)                   → standard $10,600 / $21,200
// CSR is Silver-only and is never reconciled at tax time.
// Source: Fed. Register 2025-11606 (2026 Marketplace Integrity & Affordability
// final rule), via the CBPP/Beyond the Basics CY2026 Reference Guide.
export const CSR_SILVER_OOP_MAX_PER_PERSON_2026 = {
  upTo200Fpl: 3_500, // 100–200% FPL
  upTo250Fpl: 8_450 // 201–250% FPL
} as const;

// Returns the CSR-reduced Silver per-person out-of-pocket maximum for a given
// income (as a multiple of FPL), or null when CSR does not apply — i.e. below
// 100% FPL, above 250% FPL, or (decided by the caller) a non-Silver plan.
export function csrSilverOopMaxPerPerson(incomePctFpl: number): number | null {
  if (incomePctFpl < 1.0 || incomePctFpl > 2.5) return null;
  return incomePctFpl <= 2.0
    ? CSR_SILVER_OOP_MAX_PER_PERSON_2026.upTo200Fpl
    : CSR_SILVER_OOP_MAX_PER_PERSON_2026.upTo250Fpl;
}

// ---------------------------------------------------------------------------
// Medicare (65+)
// ---------------------------------------------------------------------------

// Source: CMS 2026 Medicare Parts B Premiums & Deductibles fact sheet.
export const PART_B_BASE_PREMIUM_2026 = 202.9; // per person, per month
export const PART_B_DEDUCTIBLE_2026 = 283; // per person, per year
export const MEDICARE_AGE = 65;

// 2026 IRMAA brackets. IRMAA is determined by MAGI from two years prior (2024
// MAGI sets 2026 surcharges); for steady-state retirement planning we apply the
// entered retirement MAGI directly and surface the implied tier.
// Part B premium = base x multiplier. Part D surcharge is an add-on dollar
// amount paid on top of the Part D plan premium.
// Source: thefinancebuff.com 2026 IRMAA brackets; Kiplinger 2026 IRMAA.
export type IrmaaTier = {
  // Upper MAGI bound (inclusive) for the tier, by filing status. The final tier
  // uses Infinity.
  singleMax: number;
  marriedJointMax: number;
  partBMultiplier: number;
  partDMonthlySurcharge: number;
};

export const IRMAA_TIERS_2026: IrmaaTier[] = [
  { singleMax: 109_000, marriedJointMax: 218_000, partBMultiplier: 1.0, partDMonthlySurcharge: 0 },
  { singleMax: 137_000, marriedJointMax: 274_000, partBMultiplier: 1.4, partDMonthlySurcharge: 14.5 },
  { singleMax: 171_000, marriedJointMax: 342_000, partBMultiplier: 2.0, partDMonthlySurcharge: 37.5 },
  { singleMax: 205_000, marriedJointMax: 410_000, partBMultiplier: 2.6, partDMonthlySurcharge: 60.4 },
  { singleMax: 500_000, marriedJointMax: 750_000, partBMultiplier: 3.2, partDMonthlySurcharge: 83.3 },
  {
    singleMax: Number.POSITIVE_INFINITY,
    marriedJointMax: Number.POSITIVE_INFINITY,
    partBMultiplier: 3.4,
    partDMonthlySurcharge: 91
  }
];

export const DEFAULT_MEDICARE_INFLATION = 0.05;

// 2026 Part D out-of-pocket cap. Under the Inflation Reduction Act redesign, a
// beneficiary's annual out-of-pocket spending on covered Part D drugs is capped
// (≈ $2,000, indexed). We use this as the ceiling on modeled drug cost-sharing
// for the Original Medicare + Medigap path (which has no overall medical OOP
// max). Source: CMS Final CY2026 Part D Redesign Program Instructions.
export const PART_D_OOP_CAP_2026 = 2_000;

// Original Medicare + Medigap expected annual out-of-pocket, per person, in
// today's dollars — by usage level. Unlike Medicare Advantage there is NO
// out-of-pocket maximum; Medigap instead caps medical cost-sharing tightly, so
// the binding, predictable cost is the Part B deductible (Plan G covers
// everything else). These usage tiers layer a small Part D drug allowance
// (capped at PART_D_OOP_CAP_2026) on top of the plan-letter medical exposure.
// This Part D drug component is applied the SAME across every Medigap letter —
// drug spend is a Part D matter, not a Medigap-letter one.
// Source: medicare.gov Medigap; CMS 2026 Part B deductible.
export const MEDIGAP_DRUG_OOP_BY_USAGE: Record<OopUsageLevel, number> = {
  low: 0,
  moderate: 0,
  high: 1_700
};

// ---------------------------------------------------------------------------
// Realistic Medigap plan-letter cost model (Option A)
// ---------------------------------------------------------------------------
// Each constant below is a 2026 planning estimate and is ADJUSTABLE: edit the
// number to refresh it for a new plan year or a more specific situation.

// Medigap premium relativity. The premium the user enters is treated as the
// Plan-G-equivalent base; each plan letter's effective premium is that base ×
// the factor here. Plan N runs cheaper (it trades premium for small copays);
// Plan F runs richer (it also covers the Part B deductible).
// 2026 estimate, adjustable — source: medicare.gov / KFF national averages.
export const MEDIGAP_PREMIUM_RELATIVITY: Record<string, number> = {
  G: 1.0,
  N: 0.8,
  F: 1.12
};

// Usage level → estimated annual office (physician) visits per person. Roughly
// the Medicare beneficiary averages: a healthy year, a typical year, and a
// heavy-utilization year.
// 2026 estimate, adjustable — source: medicare.gov / KFF national averages.
export const MEDIGAP_OFFICE_VISITS_BY_USAGE: Record<OopUsageLevel, number> = {
  low: 4,
  moderate: 8,
  high: 16
};

// Usage level → estimated annual emergency-room visits per person.
// 2026 estimate, adjustable — source: medicare.gov / KFF national averages.
export const MEDIGAP_ER_VISITS_BY_USAGE: Record<OopUsageLevel, number> = {
  low: 0,
  moderate: 0,
  high: 1
};

// Plan N cost-sharing the enrollee pays directly: up to $20 per office visit
// and up to $50 per ER visit (the ER copay is waived if admitted).
// 2026 estimate, adjustable — source: medicare.gov.
export const PLAN_N_OFFICE_COPAY = 20;
export const PLAN_N_ER_COPAY = 50;

// Plan N (unlike Plan G) does NOT cover Part B "excess charges" — the up-to-15%
// a non-participating provider may bill above the Medicare-approved amount.
// This is an estimated annual allowance for that exposure, by usage level. Plan
// G covers excess charges, so this applies to Plan N only.
// 2026 estimate, adjustable — source: medicare.gov.
export const PLAN_N_EXCESS_CHARGE_BY_USAGE: Record<OopUsageLevel, number> = {
  low: 0,
  moderate: 100,
  high: 300
};

// Routine dental, vision, and hearing are NOT covered by Original Medicare or a
// Medigap supplement, so they are a real out-of-pocket cost in the Medicare
// years. This is the default annual amount, per person; it is a user-adjustable
// input in the UI.
// 2026 estimate, adjustable — source: typical retiree out-of-pocket for routine
// dental/vision/hearing (KFF national averages).
export const DEFAULT_DENTAL_VISION_HEARING_ANNUAL = 1_200;

// Medigap plan letters that cover the annual Part B deductible (so the enrollee
// does not pay it out of pocket). Plans C and F are closed to enrollees who
// became Medicare-eligible on or after 2020-01-01, but existing enrollees keep
// them. Every other letter (including the common Plan G) exposes the deductible.
export const MEDIGAP_PLANS_COVERING_PART_B_DEDUCTIBLE = ["C", "F"] as const;

// Foreign-travel emergency benefit carried by Medigap plans C, D, F, G, M, N:
// 80% of approved costs after a $250 deductible, capped at a $50,000 lifetime
// maximum. Treated as a small offset, not real coverage.
export const MEDIGAP_FOREIGN_EMERGENCY = {
  coinsurance: 0.8,
  deductible: 250,
  lifetimeMax: 50_000
};

// Plan letters that include the foreign-travel emergency benefit.
export const MEDIGAP_PLANS_WITH_FOREIGN_COVERAGE = ["C", "D", "F", "G", "M", "N"] as const;

// ---------------------------------------------------------------------------
// Out-of-pocket usage presets (expected annual out-of-pocket spend as a share
// of the plan's out-of-pocket maximum)
// ---------------------------------------------------------------------------

// Expected annual out-of-pocket spend as a share of the plan's out-of-pocket
// maximum. "moderate" is set to a typical-year level (~30% of the OOP max);
// most households don't approach their statutory maximum in an average year.
// "high" reflects a chronic condition or planned procedures; "low" a healthy
// year with few claims.
export const OOP_USAGE_PRESETS = {
  low: 0.15,
  moderate: 0.3,
  high: 0.85
} as const;

export type OopUsageLevel = keyof typeof OOP_USAGE_PRESETS;
