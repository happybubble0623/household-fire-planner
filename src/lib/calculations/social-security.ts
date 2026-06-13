export type IndexedEarningsRow = {
  year: number;
  indexedEarnings: number;
};

export type BendPoints = {
  first: number;
  second: number;
};

export type SocialSecurityBenefitInput = {
  birthYear: number;
  claimingAge: number;
  workStartYear: number;
  workEndYear: number;
  startingAnnualCoveredEarnings: number;
  annualEarningsGrowth: number;
  wageGrowthAssumption?: number;
  displayMode: "today_dollars" | "future_dollars";
  annualEarningsByYear?: Record<string, number>;
};

export type SocialSecurityBenefitResult = {
  eligibilityYear: number;
  indexingYear: number;
  fullRetirementAge: number;
  estimatedCredits: number;
  requiredCredits: number;
  retirementEligible: boolean;
  estimatedAime: number;
  estimatedPia: number;
  claimingAdjustment: number;
  estimatedMonthlyBenefitTodayDollars: number;
  estimatedMonthlyBenefitFutureDollars: number;
  annualBenefitTodayDollars: number;
  annualBenefitFutureDollars: number;
  warning: string;
};

const BASE_BEND_POINTS = {
  year: 2026,
  first: 1286,
  second: 7749
};

const BASE_NAWI = {
  year: 2024,
  value: 69846.57
};

const BASE_TAXABLE_MAXIMUM = {
  year: 2026,
  value: 184500
};

const DEFAULT_WAGE_GROWTH_ASSUMPTION = 0.03;
const REQUIRED_RETIREMENT_CREDITS = 40;

const TAXABLE_MAXIMUM_BY_YEAR: Record<number, number> = {
  1978: 17_700,
  1979: 22_900,
  1980: 25_900,
  1981: 29_700,
  1982: 32_400,
  1983: 35_700,
  1984: 37_800,
  1985: 39_600,
  1986: 42_000,
  1987: 43_800,
  1988: 45_000,
  1989: 48_000,
  1990: 51_300,
  1991: 53_400,
  1992: 55_500,
  1993: 57_600,
  1994: 60_600,
  1995: 61_200,
  1996: 62_700,
  1997: 65_400,
  1998: 68_400,
  1999: 72_600,
  2000: 76_200,
  2001: 80_400,
  2002: 84_900,
  2003: 87_000,
  2004: 87_900,
  2005: 90_000,
  2006: 94_200,
  2007: 97_500,
  2008: 102_000,
  2009: 106_800,
  2010: 106_800,
  2011: 106_800,
  2012: 110_100,
  2013: 113_700,
  2014: 117_000,
  2015: 118_500,
  2016: 118_500,
  2017: 127_200,
  2018: 128_400,
  2019: 132_900,
  2020: 137_700,
  2021: 142_800,
  2022: 147_000,
  2023: 160_200,
  2024: 168_600,
  2025: 176_100,
  2026: 184_500
};

const QUARTER_OF_COVERAGE_BY_YEAR: Record<number, number> = {
  1978: 250,
  1979: 260,
  1980: 290,
  1981: 310,
  1982: 340,
  1983: 370,
  1984: 390,
  1985: 410,
  1986: 440,
  1987: 460,
  1988: 470,
  1989: 500,
  1990: 520,
  1991: 540,
  1992: 570,
  1993: 590,
  1994: 620,
  1995: 630,
  1996: 640,
  1997: 670,
  1998: 700,
  1999: 740,
  2000: 780,
  2001: 830,
  2002: 870,
  2003: 890,
  2004: 900,
  2005: 920,
  2006: 970,
  2007: 1_000,
  2008: 1_050,
  2009: 1_090,
  2010: 1_120,
  2011: 1_120,
  2012: 1_130,
  2013: 1_160,
  2014: 1_200,
  2015: 1_220,
  2016: 1_260,
  2017: 1_300,
  2018: 1_320,
  2019: 1_360,
  2020: 1_410,
  2021: 1_470,
  2022: 1_510,
  2023: 1_640,
  2024: 1_730,
  2025: 1_810,
  2026: 1_890
};

export function calculateAime(indexedEarnings: IndexedEarningsRow[]) {
  const highest35 = indexedEarnings
    .map((row) => row.indexedEarnings)
    .sort((a, b) => b - a)
    .slice(0, 35);

  while (highest35.length < 35) {
    highest35.push(0);
  }

  return Math.floor(highest35.reduce((sum, amount) => sum + amount, 0) / 420);
}

export function calculatePia(aime: number, bendPoints: BendPoints) {
  const firstLayer = Math.min(aime, bendPoints.first) * 0.9;
  const secondLayer = Math.max(0, Math.min(aime, bendPoints.second) - bendPoints.first) * 0.32;
  const thirdLayer = Math.max(0, aime - bendPoints.second) * 0.15;

  return roundDownToDime(firstLayer + secondLayer + thirdLayer);
}

export function applyClaimingAdjustment(
  pia: number,
  fullRetirementAge: number,
  claimingAge: number
) {
  const monthsDifference = Math.round((claimingAge - fullRetirementAge) * 12);

  if (monthsDifference === 0) {
    return pia;
  }

  if (monthsDifference < 0) {
    const earlyMonths = Math.abs(monthsDifference);
    const first36Months = Math.min(36, earlyMonths);
    const additionalMonths = Math.max(0, earlyMonths - 36);
    const reduction = first36Months * (5 / 9 / 100) + additionalMonths * (5 / 12 / 100);
    return roundToCents(pia * (1 - reduction));
  }

  const monthsUntilAge70 = Math.max(0, Math.round((70 - fullRetirementAge) * 12));
  const delayedMonths = Math.min(monthsUntilAge70, monthsDifference);
  const credit = delayedMonths * (2 / 3 / 100);
  return roundToCents(pia * (1 + credit));
}

export function estimateSocialSecurityBenefit(
  input: SocialSecurityBenefitInput
): SocialSecurityBenefitResult {
  const wageGrowthAssumption = input.wageGrowthAssumption ?? DEFAULT_WAGE_GROWTH_ASSUMPTION;
  const eligibilityYear = input.birthYear + 62;
  const indexingYear = input.birthYear + 60;
  const fullRetirementAge = getFullRetirementAge(input.birthYear);
  const coveredEarnings = buildCoveredEarnings(input, wageGrowthAssumption);
  const estimatedCredits = calculateEstimatedCredits(coveredEarnings, wageGrowthAssumption);
  const retirementEligible = estimatedCredits >= REQUIRED_RETIREMENT_CREDITS;
  const indexedEarnings = coveredEarnings.map(({ year, earnings }) => ({
    year,
    indexedEarnings:
      year < indexingYear
        ? earnings * (projectNawi(indexingYear, wageGrowthAssumption) / projectNawi(year, wageGrowthAssumption))
        : earnings
  }));
  const bendPoints = projectBendPoints(eligibilityYear, wageGrowthAssumption);
  const estimatedAime = calculateAime(indexedEarnings);
  const formulaPia = calculatePia(estimatedAime, bendPoints);
  const estimatedPia = retirementEligible ? formulaPia : 0;
  const monthlyAtClaiming = retirementEligible
    ? applyClaimingAdjustment(estimatedPia, fullRetirementAge, input.claimingAge)
    : 0;
  const dollarYearFactor = Math.pow(
    1 + wageGrowthAssumption,
    Math.max(0, eligibilityYear - new Date().getFullYear())
  );
  // SSA rounds the final monthly benefit DOWN to the next lower whole dollar
  // (after the PIA dime-rounding and the claiming adjustment) — it never pays
  // cents. Source: ssa.gov/oact/cola/Benefits.html. The today's-dollar view is
  // this whole-dollar benefit deflated to current purchasing power.
  const monthlyBenefitFutureDollars = Math.floor(monthlyAtClaiming);
  const estimatedMonthlyBenefitTodayDollars = roundToCents(
    monthlyBenefitFutureDollars / dollarYearFactor
  );
  const estimatedMonthlyBenefitFutureDollars = monthlyBenefitFutureDollars;
  const ineligibleWarning = `Needs 40 Social Security credits for retirement benefits. This estimate has ${estimatedCredits}.`;

  return {
    eligibilityYear,
    indexingYear,
    fullRetirementAge,
    estimatedCredits,
    requiredCredits: REQUIRED_RETIREMENT_CREDITS,
    retirementEligible,
    estimatedAime,
    estimatedPia,
    claimingAdjustment: roundToCents(monthlyAtClaiming - estimatedPia),
    estimatedMonthlyBenefitTodayDollars,
    estimatedMonthlyBenefitFutureDollars,
    annualBenefitTodayDollars: roundToCents(estimatedMonthlyBenefitTodayDollars * 12),
    annualBenefitFutureDollars: roundToCents(estimatedMonthlyBenefitFutureDollars * 12),
    warning: retirementEligible
      ? "This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record, does not ask for your SSN, and may differ from your official Social Security estimate."
      : `${ineligibleWarning} We cannot estimate a payable retirement benefit unless the worker has enough credits.`
  };
}

function buildCoveredEarnings(input: SocialSecurityBenefitInput, wageGrowthAssumption: number) {
  const rows: Array<{ year: number; earnings: number }> = [];

  // Earnings only count toward a benefit claimed at a given age if they happen
  // before that age. A benefit claimed at 62 cannot include wages earned at 63+,
  // so cap the earnings years at the year the worker reaches the claiming age.
  const lastCountedYear = Math.min(
    input.workEndYear,
    input.birthYear + Math.floor(input.claimingAge) - 1
  );

  for (let year = input.workStartYear; year <= lastCountedYear; year += 1) {
    const explicitEarnings = input.annualEarningsByYear?.[String(year)];
    const yearsWorked = year - input.workStartYear;
    const projectedEarnings =
      explicitEarnings ??
      input.startingAnnualCoveredEarnings * Math.pow(1 + input.annualEarningsGrowth, yearsWorked);
    const taxableMaximum = projectTaxableMaximum(year, wageGrowthAssumption);

    rows.push({
      year,
      earnings: Math.min(projectedEarnings, taxableMaximum)
    });
  }

  return rows;
}

function projectBendPoints(year: number, wageGrowthAssumption: number): BendPoints {
  const factor = Math.pow(1 + wageGrowthAssumption, year - BASE_BEND_POINTS.year);
  return {
    first: Math.round(BASE_BEND_POINTS.first * factor),
    second: Math.round(BASE_BEND_POINTS.second * factor)
  };
}

function projectNawi(year: number, wageGrowthAssumption: number) {
  return BASE_NAWI.value * Math.pow(1 + wageGrowthAssumption, year - BASE_NAWI.year);
}

function projectTaxableMaximum(year: number, wageGrowthAssumption: number) {
  const historicalMaximum = TAXABLE_MAXIMUM_BY_YEAR[year];
  if (historicalMaximum !== undefined) return historicalMaximum;

  return BASE_TAXABLE_MAXIMUM.value * Math.pow(1 + wageGrowthAssumption, year - BASE_TAXABLE_MAXIMUM.year);
}

function calculateEstimatedCredits(
  coveredEarnings: Array<{ year: number; earnings: number }>,
  wageGrowthAssumption: number
) {
  return coveredEarnings.reduce((credits, row) => {
    const creditAmount = getQuarterOfCoverageAmount(row.year, wageGrowthAssumption);
    return credits + Math.min(4, Math.floor(row.earnings / creditAmount));
  }, 0);
}

function getQuarterOfCoverageAmount(year: number, wageGrowthAssumption: number) {
  const historicalCreditAmount = QUARTER_OF_COVERAGE_BY_YEAR[year];
  if (historicalCreditAmount !== undefined) return historicalCreditAmount;

  return roundToNearestTen(
    QUARTER_OF_COVERAGE_BY_YEAR[2026] * Math.pow(1 + wageGrowthAssumption, year - 2026)
  );
}

function getFullRetirementAge(birthYear: number) {
  if (birthYear <= 1937) return 65;
  if (birthYear <= 1942) return 65 + ((birthYear - 1937) * 2) / 12;
  if (birthYear <= 1954) return 66;
  if (birthYear <= 1959) return 66 + ((birthYear - 1954) * 2) / 12;
  return 67;
}

function roundToCents(value: number) {
  return Math.round(value * 100) / 100;
}

function roundDownToDime(value: number) {
  return Math.floor((value + Number.EPSILON) * 10) / 10;
}

function roundToNearestTen(value: number) {
  return Math.round(value / 10) * 10;
}
