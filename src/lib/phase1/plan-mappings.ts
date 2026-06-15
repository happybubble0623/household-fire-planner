import type {
  Phase1ExpenseCategory,
  Phase1HealthcareEstimate,
  Phase1Workbook
} from "@/types/phase1";

// Pure workbook transforms behind each calculator's "Use in my plan" button.
// They are the SAME shape of update the Plan's own inputs make (spread the
// workbook, replace one field), extracted here so the exact mapping — which
// computed value lands in which input — is unit-testable and provably not faked.

// Healthcare → Plan snapshot tile. Stores the captured estimate as-is.
export function applyHealthcareEstimate(
  workbook: Phase1Workbook,
  estimate: Phase1HealthcareEstimate
): Phase1Workbook {
  return { ...workbook, healthcareEstimate: estimate };
}

// Living-expense calculator → Plan annual-expenses input. Overwrites with the
// calculator's computed annual total.
export function applyAnnualExpenses(
  workbook: Phase1Workbook,
  totalAnnual: number
): Phase1Workbook {
  return {
    ...workbook,
    fireInputs: { ...workbook.fireInputs, annualExpenses: totalAnnual }
  };
}

// Mortgage calculator → Plan expense list. APPENDS a housing/mortgage expense
// to the Plan's existing optional expense-category mechanism (the same
// `fireInputs.expenseCategories` list the strategy panel's "Add Expense
// Category" writes to and reads from). A household can carry several expense
// categories, so this accumulates rather than overwrites. The caller builds the
// fully-formed category — its id is generated at the call site exactly like the
// panel's own addExpenseCategory — so this transform stays pure and testable.
export function addHousingExpenseCategory(
  workbook: Phase1Workbook,
  category: Phase1ExpenseCategory
): Phase1Workbook {
  return {
    ...workbook,
    fireInputs: {
      ...workbook.fireInputs,
      expenseCategories: [...workbook.fireInputs.expenseCategories, category]
    }
  };
}

// Tax calculator → Plan tax-rate assumption. SETS the plan's "simple effective
// tax rate" (the rate in the Assumptions card) to the calculator's computed
// effective rate, and switches taxMode to "simple" so that rate is actually
// applied — otherwise the rate sits unused while taxMode is "none". The user can
// still switch back to "no tax" in the panel; this never removes that option.
// effectiveTaxRate arrives as a 0..1 fraction (total tax ÷ income); the plan
// stores a percent, so the only transform is the fraction→percent ×100.
export function applyEffectiveTaxRate(
  workbook: Phase1Workbook,
  effectiveTaxRate: number
): Phase1Workbook {
  return {
    ...workbook,
    fireInputs: {
      ...workbook.fireInputs,
      taxMode: "simple",
      simpleEffectiveTaxRatePercent: effectiveTaxRate * 100
    }
  };
}

// Social Security calculator → Plan passive-income input. ADDS the computed
// annual benefit to whatever is already there (a household can have several
// passive-income sources).
export function addPassiveIncome(
  workbook: Phase1Workbook,
  annualBenefit: number
): Phase1Workbook {
  return {
    ...workbook,
    fireInputs: {
      ...workbook.fireInputs,
      annualPassiveGuaranteedIncome:
        workbook.fireInputs.annualPassiveGuaranteedIncome + annualBenefit
    }
  };
}
