import type { Phase1HealthcareEstimate, Phase1Workbook } from "@/types/phase1";

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
