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
// coverage uses the *prior* year's (2025) guidelines.
// Source: HHS ASPE 2025 Poverty Guidelines.
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
// Source: Rev. Proc. 2025-25 (IRC 36B applicable percentages for 2026).
export const ACA_APPLICABLE_PERCENT_NODES_2026: Array<{ fplPct: number; percent: number }> = [
  { fplPct: 1.5, percent: 0.0419 },
  { fplPct: 2.0, percent: 0.066 },
  { fplPct: 2.5, percent: 0.0844 },
  { fplPct: 3.0, percent: 0.0996 },
  { fplPct: 4.0, percent: 0.0996 }
];

// Below 150% FPL the applicable percentage floors at 2.10%.
export const ACA_APPLICABLE_PERCENT_FLOOR_2026 = 0.021;
// At or above this multiple of FPL no premium tax credit is available (the
// reinstated 2026 subsidy cliff).
export const ACA_SUBSIDY_CLIFF_FPL = 4.0;

export const DEFAULT_ACA_INFLATION = 0.055;

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

export const OOP_USAGE_PRESETS = {
  low: 0.15,
  moderate: 0.45,
  high: 0.85
} as const;

export type OopUsageLevel = keyof typeof OOP_USAGE_PRESETS;
