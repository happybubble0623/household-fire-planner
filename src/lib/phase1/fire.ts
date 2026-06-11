import type {
  Phase1ExpenseCategory,
  Phase1FireInputs,
  Phase1FireResult,
  Phase1IncomeStreamResult,
  Phase1IncomeSource,
  Phase1PrincipalPreservingResult,
  Phase1ProjectionRow,
  Phase1WithdrawalRateResult
} from "@/types/phase1";

export function calculatePhase1Fire(inputs: Phase1FireInputs): Phase1FireResult {
  validatePhase1FireInputs(inputs);

  return {
    mode: inputs.fireRuleMode,
    withdrawalRate: calculateWithdrawalRateFire(inputs),
    incomeStream: calculateIncomeStreamFire(inputs),
    principalPreserving: calculatePrincipalPreservingFire(inputs)
  };
}

export function calculateTaxAdjustedGap(inputs: Phase1FireInputs, annualSpendingGap: number) {
  if (inputs.taxMode === "none") return annualSpendingGap;

  const taxRate = inputs.simpleEffectiveTaxRatePercent / 100;
  return annualSpendingGap / (1 - taxRate);
}

// Option B simple tax: gross up the full spending so it must be funded from
// pre-tax money (income + yield + withdrawals). Applied consistently in all modes.
function calculateSpendingNeedForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  return calculateTaxAdjustedGap(inputs, calculateExpensesForYear(inputs, yearsFromNow));
}

// A one-time home/real-estate sale added to liquid FIRE assets in the year the
// worker reaches homeSaleAge. Real estate is otherwise excluded from the pool.
function homeSaleInflowForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  const { homeSaleAge, homeSaleProceeds } = inputs;
  if (
    homeSaleAge === undefined ||
    homeSaleProceeds === undefined ||
    !Number.isFinite(homeSaleProceeds) ||
    homeSaleProceeds <= 0
  ) {
    return 0;
  }
  return inputs.currentAge + yearsFromNow === homeSaleAge ? homeSaleProceeds : 0;
}

export function validatePhase1FireInputs(inputs: Phase1FireInputs) {
  const nonNegativeFiniteFields: Array<keyof Phase1FireInputs> = [
    "currentAge",
    "lifeExpectancy",
    "passiveIncomeFireAge",
    "currentFireAssets",
    "annualExpenses",
    "annualPassiveGuaranteedIncome",
    "annualSavingsBeforeFire",
    "expectedAnnualPortfolioReturnPercent",
    "expectedCashGeneratingReturnPercent",
    "inflationRatePercent",
    "simpleEffectiveTaxRatePercent"
  ];

  for (const field of nonNegativeFiniteFields) {
    const value = inputs[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a finite non-negative number.`);
    }
  }

  for (const incomeSource of inputs.incomeSources) {
    validateIncomeSource(incomeSource);
  }

  for (const expenseCategory of inputs.expenseCategories) {
    validateExpenseCategory(expenseCategory);
  }

  if (!Number.isInteger(inputs.currentAge) || !Number.isInteger(inputs.lifeExpectancy)) {
    throw new Error("Current age and life expectancy must be whole years.");
  }

  if (!Number.isInteger(inputs.passiveIncomeFireAge)) {
    throw new Error("Passive Income FIRE age must be a whole year.");
  }

  if (inputs.currentAge >= inputs.lifeExpectancy) {
    throw new Error("Current age must be less than life expectancy.");
  }

  if (
    inputs.fireRuleMode === "income_stream" &&
    inputs.passiveIncomeFireAge > inputs.lifeExpectancy
  ) {
    throw new Error("Passive Income FIRE age must be less than or equal to life expectancy.");
  }

  if (inputs.taxMode === "simple" && inputs.simpleEffectiveTaxRatePercent >= 100) {
    throw new Error("Simple effective tax rate must be less than 100%.");
  }

  if (inputs.homeSaleAge !== undefined) {
    if (!Number.isInteger(inputs.homeSaleAge) || inputs.homeSaleAge < 0) {
      throw new Error("Home sale age must be a whole non-negative year.");
    }
  }

  if (inputs.homeSaleProceeds !== undefined) {
    if (!Number.isFinite(inputs.homeSaleProceeds) || inputs.homeSaleProceeds < 0) {
      throw new Error("Home sale proceeds must be a finite non-negative number.");
    }
  }
}

function calculateWithdrawalRateFire(inputs: Phase1FireInputs): Phase1WithdrawalRateResult {
  const currentYearExpenses = calculateExpensesForYear(inputs, 0);
  const currentYearPassiveIncome = calculatePassiveIncomeForYear(inputs, 0);
  const annualPortfolioFundedSpendingGap = Math.max(
    0,
    currentYearExpenses - currentYearPassiveIncome
  );
  const taxAdjustedAnnualSpendingGap = calculateTaxAdjustedGap(
    inputs,
    annualPortfolioFundedSpendingGap
  );
  const drawdownProjection = estimatePortfolioDrawdownProjection(inputs);
  const projectionRows = buildWithdrawalRateProjectionRows(
    inputs,
    drawdownProjection.targetReached ? drawdownProjection.yearsToFire : undefined,
    drawdownProjection.targetReached ? drawdownProjection.assetsAtFire : undefined
  );
  const lastProjectionRow = projectionRows[projectionRows.length - 1];

  if (!drawdownProjection.targetReached) {
    const firstDepletionRow = projectionRows.find((row) => row.depleted);

    return {
      annualPortfolioFundedSpendingGap,
      taxAdjustedAnnualSpendingGap,
      simpleFireNumber: null,
      targetFireNumber: null,
      fireGap: 0,
      targetReached: false,
      projectedFireAssets: lastProjectionRow?.endingAssets ?? inputs.currentFireAssets,
      estimatedYearsToFire: getLifeExpectancyHorizonYears(inputs),
      estimatedFireAge: null,
      estimatedFireYear: null,
      assetsAtFire: 0,
      firstYearPortfolioDraw: 0,
      impliedWithdrawalRate: null,
      deterministicPasses: false,
      endingBalanceAtLifeExpectancy: lastProjectionRow?.endingAssets ?? inputs.currentFireAssets,
      firstFailureAge: firstDepletionRow?.age ?? inputs.lifeExpectancy,
      projectionRows
    };
  }

  const estimatedYearsToFire = drawdownProjection.yearsToFire;
  const estimatedFireAge = inputs.currentAge + estimatedYearsToFire;
  const estimatedFireYear = getProjectionStartYear() + estimatedYearsToFire;
  const firstYearPortfolioDraw = calculateWithdrawalForYear(inputs, estimatedYearsToFire);
  const impliedWithdrawalRate =
    drawdownProjection.assetsAtFire <= 0
      ? null
      : firstYearPortfolioDraw / drawdownProjection.assetsAtFire;
  const fireGap = Math.max(0, drawdownProjection.assetsAtFire - inputs.currentFireAssets);
  const survival = projectWithdrawalRateSurvival(
    inputs,
    drawdownProjection.assetsAtFire,
    estimatedYearsToFire
  );

  return {
    annualPortfolioFundedSpendingGap,
    taxAdjustedAnnualSpendingGap,
    simpleFireNumber: null,
    targetFireNumber: drawdownProjection.assetsAtFire,
    fireGap,
    targetReached: true,
    projectedFireAssets: drawdownProjection.assetsAtFire,
    estimatedYearsToFire,
    estimatedFireAge,
    estimatedFireYear,
    assetsAtFire: drawdownProjection.assetsAtFire,
    firstYearPortfolioDraw,
    impliedWithdrawalRate,
    deterministicPasses: survival.passes,
    endingBalanceAtLifeExpectancy: survival.endingBalance,
    firstFailureAge: survival.firstFailureAge,
    projectionRows
  };
}

function calculateIncomeStreamFire(inputs: Phase1FireInputs): Phase1IncomeStreamResult {
  let firstShortfallAge: number | undefined;
  const passiveIncomeFireStartYear = getPassiveIncomeFireStartYear(inputs);
  const passiveIncomeFireAge = inputs.currentAge + passiveIncomeFireStartYear;
  const projectionRows = buildIncomeStreamProjectionRows(inputs);

  for (let year = passiveIncomeFireStartYear; year <= getLifeExpectancyHorizonYears(inputs); year += 1) {
    const age = inputs.currentAge + year;
    const annualExpenses = calculateSpendingNeedForYear(inputs, year);
    const annualPassiveGuaranteedIncome = calculatePassiveIncomeForYear(inputs, year);

    if (annualPassiveGuaranteedIncome < annualExpenses) {
      firstShortfallAge = age;
      break;
    }
  }

  const currentYearExpenses = calculateSpendingNeedForYear(inputs, passiveIncomeFireStartYear);
  const currentYearPassiveIncome = calculatePassiveIncomeForYear(inputs, passiveIncomeFireStartYear);
  const incomeCoverageRatio =
    currentYearExpenses === 0
      ? 1
      : currentYearPassiveIncome / currentYearExpenses;
  const passes = firstShortfallAge === undefined;

  return {
    incomeCoverageRatio,
    annualPassiveGuaranteedIncome: currentYearPassiveIncome,
    annualExpenses: currentYearExpenses,
    passes,
    estimatedFireAge: passes ? passiveIncomeFireAge : null,
    shortfallOrSurplus: currentYearPassiveIncome - currentYearExpenses,
    firstShortfallAge,
    projectionRows
  };
}

function calculatePrincipalPreservingFire(
  inputs: Phase1FireInputs
): Phase1PrincipalPreservingResult {
  const projection = estimatePrincipalPreservingProjection(inputs);
  const fireStartYear = projection.yearsToFire;
  const assetsAtFire = projection.principalFloor;
  const principalPreservingFireAge = inputs.currentAge + fireStartYear;
  const projectionRows = buildPrincipalPreservingProjectionRows(
    inputs,
    fireStartYear,
    assetsAtFire
  );
  const firstFireRow =
    projectionRows.find((row) => row.year === fireStartYear) ??
    projectionRows[projectionRows.length - 1];
  const firstCashShortfallRow = projectionRows.find(
    (row) => row.year >= fireStartYear && row.cashFlow < 0
  );
  const firstPrincipalDipRow = projectionRows.find(
    (row) => row.year >= fireStartYear && row.principalPreserved === false
  );
  const lastProjectionRow = projectionRows[projectionRows.length - 1];
  const currentYearExpenses = firstFireRow?.annualExpenses ?? 0;
  const spendableIncome = firstFireRow?.annualIncome ?? 0;
  const coverageRatio = currentYearExpenses === 0 ? 1 : spendableIncome / currentYearExpenses;
  const passes = projection.targetReached;

  return {
    coverageRatio,
    spendableIncome,
    annualCashGeneratingReturn: firstFireRow?.cashGeneratingReturn ?? 0,
    annualPassiveGuaranteedIncome: spendableIncome - (firstFireRow?.cashGeneratingReturn ?? 0),
    annualExpenses: currentYearExpenses,
    passes,
    estimatedFireAge: passes ? principalPreservingFireAge : null,
    estimatedFireYear: passes ? getProjectionStartYear() + fireStartYear : null,
    estimatedYearsToFire: fireStartYear,
    assetsAtFire,
    principalFloor: assetsAtFire,
    shortfallOrSurplus: spendableIncome - currentYearExpenses,
    firstCashShortfallAge: firstCashShortfallRow?.age,
    firstPrincipalDipAge: firstPrincipalDipRow?.age,
    endingAssetsAtLifeExpectancy: lastProjectionRow?.endingAssets ?? assetsAtFire,
    projectionRows
  };
}

// Finds the earliest age at which the user can stop saving, set the projected
// asset balance as a principal floor, and have income streams plus
// cash-generating return cover expenses through life expectancy without ever
// dipping below that floor. Mirrors the drawdown-mode earliest-age search.
function estimatePrincipalPreservingProjection(inputs: Phase1FireInputs) {
  const horizonYears = getLifeExpectancyHorizonYears(inputs);
  const preFireReturnPercent = getPrincipalPreservingPreFireReturnPercent(inputs);

  for (let yearsToFire = 0; yearsToFire <= horizonYears; yearsToFire += 1) {
    const principalFloor = projectAssetsBeforeFire(inputs, yearsToFire, preFireReturnPercent);
    const survival = projectPrincipalPreservingSurvival(inputs, principalFloor, yearsToFire);

    if (survival.passes) {
      return { targetReached: true as const, yearsToFire, principalFloor };
    }
  }

  // No age preserves principal. Report the retire-now scenario so the UI can
  // surface a concrete shortfall and first principal-dip age.
  return {
    targetReached: false as const,
    yearsToFire: 0,
    principalFloor: projectAssetsBeforeFire(inputs, 0, preFireReturnPercent)
  };
}

function projectPrincipalPreservingSurvival(
  inputs: Phase1FireInputs,
  principalFloor: number,
  yearsToFire: number
) {
  const cashGeneratingReturn = inputs.expectedCashGeneratingReturnPercent / 100;
  const appreciation = inputs.expectedAnnualPortfolioReturnPercent / 100;
  const horizonYears = getLifeExpectancyHorizonYears(inputs);
  let assets = principalFloor;

  for (let year = yearsToFire; year <= horizonYears; year += 1) {
    const spendingNeed = calculateSpendingNeedForYear(inputs, year);
    const incomeStreams = calculatePassiveIncomeForYear(inputs, year);
    const annualCashGeneratingReturn = assets * cashGeneratingReturn;
    const annualIncome = incomeStreams + annualCashGeneratingReturn;
    // Appreciation grows the (unspent) principal; income + yield fund spending.
    const endingAssets =
      assets * (1 + appreciation) +
      (annualIncome - spendingNeed) +
      homeSaleInflowForYear(inputs, year);

    if (endingAssets + 0.000001 < principalFloor) {
      return { passes: false, firstDipYear: year };
    }

    assets = endingAssets;
  }

  return { passes: true, firstDipYear: undefined };
}

function buildWithdrawalRateProjectionRows(
  inputs: Phase1FireInputs,
  yearsToFire: number | undefined,
  assetsNeededAtFire?: number
): Phase1ProjectionRow[] {
  const annualReturn = inputs.expectedAnnualPortfolioReturnPercent / 100;
  const horizonYears = getLifeExpectancyHorizonYears(inputs);
  const rows: Phase1ProjectionRow[] = [];
  let assets = inputs.currentFireAssets;
  const projectionStartYear = getProjectionStartYear();

  for (let year = 0; year <= horizonYears; year += 1) {
    const startingAssets = assets;
    const beforeFire = yearsToFire === undefined || year < yearsToFire;
    const homeSaleInflow = homeSaleInflowForYear(inputs, year);
    const annualExpenses = beforeFire ? 0 : calculateSpendingNeedForYear(inputs, year);
    const annualIncome = beforeFire ? 0 : calculatePassiveIncomeForYear(inputs, year);
    const preFireInflow = beforeFire ? calculatePreFireCashFlow(inputs, year) : 0;
    const assetsWithdrawn = beforeFire ? 0 : calculateWithdrawalForYear(inputs, year);
    const baseForReturn = beforeFire ? startingAssets : startingAssets - assetsWithdrawn;
    const investmentReturn = baseForReturn * annualReturn;
    const endingAssets = baseForReturn * (1 + annualReturn) + preFireInflow + homeSaleInflow;
    const cashFlow = beforeFire ? preFireInflow + homeSaleInflow : homeSaleInflow - assetsWithdrawn;
    const depleted = endingAssets < 0;
    const fireGap = beforeFire
      ? Math.max(0, (assetsNeededAtFire ?? 0) - endingAssets)
      : Math.max(0, -endingAssets);

    rows.push({
      year,
      calendarYear: projectionStartYear + year,
      age: inputs.currentAge + year,
      startingAssets,
      cashFlow,
      annualIncome,
      annualExpenses,
      investmentReturn,
      assetsWithdrawn,
      homeSaleInflow,
      incomeCoverageRatio:
        beforeFire || annualExpenses === 0 ? undefined : annualIncome / annualExpenses,
      fireTarget: assetsNeededAtFire,
      fireGap,
      endingAssets,
      depleted
    });

    assets = endingAssets;
  }

  return rows;
}

function buildIncomeStreamProjectionRows(inputs: Phase1FireInputs): Phase1ProjectionRow[] {
  const horizonYears = getLifeExpectancyHorizonYears(inputs);
  const passiveIncomeFireStartYear = getPassiveIncomeFireStartYear(inputs);
  const rows: Phase1ProjectionRow[] = [];
  const projectionStartYear = getProjectionStartYear();

  for (let year = 0; year <= horizonYears; year += 1) {
    const beforeFire = year < passiveIncomeFireStartYear;
    const annualExpenses = beforeFire ? 0 : calculateSpendingNeedForYear(inputs, year);
    const annualPassiveGuaranteedIncome = beforeFire ? 0 : calculatePassiveIncomeForYear(inputs, year);
    const cashFlow = annualPassiveGuaranteedIncome - annualExpenses;

    rows.push({
      year,
      calendarYear: projectionStartYear + year,
      age: inputs.currentAge + year,
      startingAssets: 0,
      cashFlow,
      annualIncome: annualPassiveGuaranteedIncome,
      annualExpenses,
      incomeCoverageRatio:
        beforeFire || annualExpenses === 0 ? undefined : annualPassiveGuaranteedIncome / annualExpenses,
      fireGap: 0,
      endingAssets: 0,
      depleted: false
    });
  }

  return rows;
}

function buildPrincipalPreservingProjectionRows(
  inputs: Phase1FireInputs,
  principalPreservingFireStartYear: number,
  principalFloor: number
): Phase1ProjectionRow[] {
  // Pre-FIRE total growth is appreciation plus the cash-generating yield, since
  // both compound while still accumulating. After FIRE, appreciation is not
  // applied; only cash-generating return and income streams are spendable.
  const cashGeneratingReturn = inputs.expectedCashGeneratingReturnPercent / 100;
  const appreciation = inputs.expectedAnnualPortfolioReturnPercent / 100;
  const preFireReturn = getPrincipalPreservingPreFireReturnPercent(inputs) / 100;
  const horizonYears = getLifeExpectancyHorizonYears(inputs);
  const rows: Phase1ProjectionRow[] = [];
  let assets = inputs.currentFireAssets;
  const projectionStartYear = getProjectionStartYear();

  for (let year = 0; year <= horizonYears; year += 1) {
    const startingAssets = assets;
    const beforeFire = year < principalPreservingFireStartYear;
    const homeSaleInflow = homeSaleInflowForYear(inputs, year);
    const annualExpenses = beforeFire ? 0 : calculateSpendingNeedForYear(inputs, year);
    const incomeStreams = beforeFire ? calculatePreFireIncomeForYear(inputs, year) : calculatePassiveIncomeForYear(inputs, year);
    // The cash yield is earned in every phase. Before FIRE it is reinvested
    // (already folded into preFireReturn for the ending-assets math below);
    // after FIRE it is spendable and counted inside annualIncome. The column
    // split (appreciation vs cash yield) is shown consistently in all years.
    const annualCashGeneratingReturn = startingAssets * cashGeneratingReturn;
    const annualIncome = beforeFire ? incomeStreams : incomeStreams + annualCashGeneratingReturn;
    const investmentReturn = startingAssets * appreciation;
    const cashFlow = beforeFire
      ? calculatePreFireCashFlow(inputs, year) + homeSaleInflow
      : annualIncome - annualExpenses + homeSaleInflow;
    const endingAssets = beforeFire
      ? startingAssets * (1 + preFireReturn) + calculatePreFireCashFlow(inputs, year) + homeSaleInflow
      : startingAssets * (1 + appreciation) + (annualIncome - annualExpenses) + homeSaleInflow;
    const principalPreserved = beforeFire ? undefined : endingAssets + 0.000001 >= principalFloor;

    rows.push({
      year,
      calendarYear: projectionStartYear + year,
      age: inputs.currentAge + year,
      startingAssets,
      cashFlow,
      annualIncome,
      annualExpenses,
      cashGeneratingReturn: annualCashGeneratingReturn,
      investmentReturn,
      homeSaleInflow,
      incomeCoverageRatio:
        beforeFire || annualExpenses === 0 ? undefined : annualIncome / annualExpenses,
      principalFloor: beforeFire ? undefined : principalFloor,
      principalPreserved,
      fireGap: Math.max(0, principalFloor - endingAssets),
      endingAssets,
      depleted: endingAssets < 0
    });

    assets = endingAssets;
  }

  return rows;
}

function getPassiveIncomeFireStartYear(inputs: Phase1FireInputs) {
  return Math.max(0, inputs.passiveIncomeFireAge - inputs.currentAge);
}

function estimatePortfolioDrawdownProjection(inputs: Phase1FireInputs) {
  const horizonYears = getLifeExpectancyHorizonYears(inputs);

  for (let yearsToFire = 0; yearsToFire <= horizonYears; yearsToFire += 1) {
    const assetsAtFire = projectAssetsBeforeFire(inputs, yearsToFire);
    const survival = projectWithdrawalRateSurvival(inputs, assetsAtFire, yearsToFire);

    if (survival.passes) {
      return {
        targetReached: true as const,
        yearsToFire,
        assetsAtFire,
        endingBalance: survival.endingBalance
      };
    }
  }

  return {
    targetReached: false as const,
    yearsToFire: horizonYears,
    assetsAtFire: projectAssetsBeforeFire(inputs, horizonYears),
    endingBalance: 0
  };
}

function projectAssetsBeforeFire(
  inputs: Phase1FireInputs,
  yearsToFire: number,
  annualReturnPercent: number = inputs.expectedAnnualPortfolioReturnPercent
) {
  const annualReturn = annualReturnPercent / 100;
  let assets = inputs.currentFireAssets;

  for (let year = 0; year < yearsToFire; year += 1) {
    assets =
      assets * (1 + annualReturn) +
      calculatePreFireCashFlow(inputs, year) +
      homeSaleInflowForYear(inputs, year);
  }

  return assets;
}

// In Principal-Preserving FIRE the portfolio-return field is the non-cash
// appreciation portion only. Pre-FIRE total growth is appreciation plus the
// cash-generating yield (reinvested while accumulating). After FIRE, appreciation
// grows the unspent principal while income + cash yield fund spending; the mode
// passes only while assets stay at or above the FIRE-age principal floor.
function getPrincipalPreservingPreFireReturnPercent(inputs: Phase1FireInputs) {
  return inputs.expectedAnnualPortfolioReturnPercent + inputs.expectedCashGeneratingReturnPercent;
}

function calculateWithdrawalForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  const spendingNeed = calculateSpendingNeedForYear(inputs, yearsFromNow);
  const annualPassiveGuaranteedIncome = calculatePassiveIncomeForYear(inputs, yearsFromNow);

  return Math.max(0, spendingNeed - annualPassiveGuaranteedIncome);
}

function projectWithdrawalRateSurvival(
  inputs: Phase1FireInputs,
  startingAssets: number,
  yearsToFire: number
) {
  const annualReturn = inputs.expectedAnnualPortfolioReturnPercent / 100;
  let assets = startingAssets;

  for (let age = inputs.currentAge + yearsToFire; age <= inputs.lifeExpectancy; age += 1) {
    const yearsFromNow = age - inputs.currentAge;
    const withdrawal = calculateWithdrawalForYear(inputs, yearsFromNow);
    assets -= withdrawal;

    if (assets < 0) {
      return {
        passes: false,
        endingBalance: assets,
        firstFailureAge: age
      };
    }

    assets = assets * (1 + annualReturn) + homeSaleInflowForYear(inputs, yearsFromNow);
  }

  return {
    passes: true,
    endingBalance: assets,
    firstFailureAge: undefined
  };
}

function validateIncomeSource(incomeSource: Phase1IncomeSource) {
  const numericFields: Array<keyof Pick<Phase1IncomeSource, "annualAmount" | "startAge">> = [
    "annualAmount",
    "startAge"
  ];

  for (const field of numericFields) {
    const value = incomeSource[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error("Income sources must use finite non-negative amounts and ages.");
    }
  }

  if (!Number.isInteger(incomeSource.startAge)) {
    throw new Error("Income source start age must be a whole year.");
  }

  if (incomeSource.endAge !== undefined) {
    if (
      typeof incomeSource.endAge !== "number" ||
      !Number.isFinite(incomeSource.endAge) ||
      incomeSource.endAge < 0
    ) {
      throw new Error("Income source end age must be a finite non-negative number.");
    }

    if (!Number.isInteger(incomeSource.endAge)) {
      throw new Error("Income source end age must be a whole year.");
    }

    if (incomeSource.endAge < incomeSource.startAge) {
      throw new Error("Income source end age must be greater than or equal to start age.");
    }
  }
}

function validateExpenseCategory(expenseCategory: Phase1ExpenseCategory) {
  const numericFields: Array<keyof Pick<Phase1ExpenseCategory, "annualAmount" | "startAge">> = [
    "annualAmount",
    "startAge"
  ];

  for (const field of numericFields) {
    const value = expenseCategory[field];
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error("Expense categories must use finite non-negative amounts and ages.");
    }
  }

  if (!Number.isInteger(expenseCategory.startAge)) {
    throw new Error("Expense category start age must be a whole year.");
  }

  if (expenseCategory.endAge !== undefined) {
    if (
      typeof expenseCategory.endAge !== "number" ||
      !Number.isFinite(expenseCategory.endAge) ||
      expenseCategory.endAge < 0
    ) {
      throw new Error("Expense category end age must be a finite non-negative number.");
    }

    if (!Number.isInteger(expenseCategory.endAge)) {
      throw new Error("Expense category end age must be a whole year.");
    }

    if (expenseCategory.endAge < expenseCategory.startAge) {
      throw new Error("Expense category end age must be greater than or equal to start age.");
    }
  }
}

function calculateExpensesForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  if (inputs.useExpenseCategoriesOverride) {
    return calculateDetailedExpenseCategoriesForYear(inputs, yearsFromNow);
  }

  if (!inputs.expensesInflationAdjusted) return inputs.annualExpenses;
  return applyInflationForYears(inputs, inputs.annualExpenses, yearsFromNow);
}

function calculatePassiveIncomeForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  if (inputs.useIncomeSourcesOverride) {
    return calculateDetailedIncomeSourcesForYear(inputs, yearsFromNow);
  }

  if (inputs.passiveGuaranteedIncomeInflationAdjusted) {
    return applyInflationForYears(inputs, inputs.annualPassiveGuaranteedIncome, yearsFromNow);
  }

  return inputs.annualPassiveGuaranteedIncome;
}

function calculatePreFireCashFlow(inputs: Phase1FireInputs, yearsFromNow: number) {
  return inputs.annualSavingsBeforeFire + calculatePreFireIncomeForYear(inputs, yearsFromNow);
}

function calculatePreFireIncomeForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  if (!inputs.useIncomeSourcesOverride) return 0;
  return calculateDetailedIncomeSourcesForYear(inputs, yearsFromNow);
}

function calculateDetailedIncomeSourcesForYear(inputs: Phase1FireInputs, yearsFromNow: number) {
  return inputs.incomeSources.reduce((totalIncome, incomeSource) => {
    if (!isIncomeSourceActiveForYear(inputs, incomeSource, yearsFromNow)) return totalIncome;
    const annualAmount = incomeSource.inflationAdjusted
      ? applyInflationForYears(inputs, incomeSource.annualAmount, yearsFromNow)
      : incomeSource.annualAmount;

    return totalIncome + annualAmount;
  }, 0);
}

function calculateDetailedExpenseCategoriesForYear(
  inputs: Phase1FireInputs,
  yearsFromNow: number
) {
  return inputs.expenseCategories.reduce((totalExpenses, expenseCategory) => {
    if (!isExpenseCategoryActiveForYear(inputs, expenseCategory, yearsFromNow)) {
      return totalExpenses;
    }

    const annualAmount = expenseCategory.inflationAdjusted
      ? applyInflationForYears(inputs, expenseCategory.annualAmount, yearsFromNow)
      : expenseCategory.annualAmount;

    return totalExpenses + annualAmount;
  }, 0);
}

function isIncomeSourceActiveForYear(
  inputs: Phase1FireInputs,
  incomeSource: Phase1IncomeSource,
  yearsFromNow: number
) {
  const age = inputs.currentAge + yearsFromNow;
  return (
    age >= incomeSource.startAge &&
    (incomeSource.endAge === undefined || age <= incomeSource.endAge)
  );
}

function isExpenseCategoryActiveForYear(
  inputs: Phase1FireInputs,
  expenseCategory: Phase1ExpenseCategory,
  yearsFromNow: number
) {
  const age = inputs.currentAge + yearsFromNow;
  return (
    age >= expenseCategory.startAge &&
    (expenseCategory.endAge === undefined || age <= expenseCategory.endAge)
  );
}

function applyInflationForYears(inputs: Phase1FireInputs, value: number, years: number) {
  const inflationRate = inputs.inflationRatePercent / 100;
  return value * Math.pow(1 + inflationRate, years);
}

function getLifeExpectancyHorizonYears(inputs: Phase1FireInputs) {
  return Math.ceil(inputs.lifeExpectancy - inputs.currentAge);
}

function getProjectionStartYear() {
  return new Date().getFullYear();
}
