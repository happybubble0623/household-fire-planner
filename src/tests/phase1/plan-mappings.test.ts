import { describe, expect, it } from "vitest";
import {
  addPassiveIncome,
  applyAnnualExpenses,
  applyHealthcareEstimate
} from "@/lib/phase1/plan-mappings";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import {
  workbookHasData,
  workbooksDiffer
} from "@/lib/storage/workbook-sync";
import type { Phase1HealthcareEstimate } from "@/types/phase1";

describe("calculator → plan mappings", () => {
  it("Healthcare: stores the captured estimate verbatim, touching nothing else", () => {
    const estimate: Phase1HealthcareEstimate = {
      amount: 187_450,
      basis: "Pre-65 ACA gap · 10 yrs · today's $",
      capturedAt: "2026-06-15T00:00:00.000Z"
    };

    const next = applyHealthcareEstimate(defaultPhase1Workbook, estimate);

    expect(next.healthcareEstimate).toEqual(estimate);
    // No fireInputs were disturbed.
    expect(next.fireInputs).toEqual(defaultPhase1Workbook.fireInputs);
  });

  it("Living expense: SETS annual expenses to the calculator's computed total", () => {
    const before = defaultPhase1Workbook.fireInputs.annualExpenses;
    const computedAnnual = 73_200;
    expect(computedAnnual).not.toBe(before); // guard: the test value is a real change

    const next = applyAnnualExpenses(defaultPhase1Workbook, computedAnnual);

    expect(next.fireInputs.annualExpenses).toBe(computedAnnual);
    // It overwrites, not accumulates.
    const twice = applyAnnualExpenses(next, computedAnnual);
    expect(twice.fireInputs.annualExpenses).toBe(computedAnnual);
  });

  it("Social Security: ADDS the computed annual benefit to existing passive income", () => {
    const before = defaultPhase1Workbook.fireInputs.annualPassiveGuaranteedIncome;
    const annualBenefit = 32_400;

    const next = addPassiveIncome(defaultPhase1Workbook, annualBenefit);
    expect(next.fireInputs.annualPassiveGuaranteedIncome).toBe(before + annualBenefit);

    // Adding again accumulates (a household may have several sources).
    const twice = addPassiveIncome(next, annualBenefit);
    expect(twice.fireInputs.annualPassiveGuaranteedIncome).toBe(before + annualBenefit * 2);
  });
});

describe("optional healthcareEstimate — workbook field + sync", () => {
  const estimate: Phase1HealthcareEstimate = {
    amount: 187_450,
    basis: "Pre-65 ACA gap · 10 yrs · today's $",
    capturedAt: "2026-06-15T00:00:00.000Z"
  };

  it("survives a normalize round-trip (wired through the Dexie/sync path)", () => {
    const withEstimate = applyHealthcareEstimate(defaultPhase1Workbook, estimate);
    expect(normalizePhase1Workbook(withEstimate).healthcareEstimate).toEqual(estimate);
  });

  it("a default workbook (no estimate) still counts as empty — sync unaffected", () => {
    expect(defaultPhase1Workbook.healthcareEstimate).toBeUndefined();
    expect(workbookHasData(defaultPhase1Workbook)).toBe(false);
  });

  it("capturing an estimate makes the workbook count as real, differing data", () => {
    const withEstimate = applyHealthcareEstimate(defaultPhase1Workbook, estimate);
    expect(workbookHasData(withEstimate)).toBe(true);
    expect(workbooksDiffer(defaultPhase1Workbook, withEstimate)).toBe(true);
  });

  it("a changed estimate amount is a user-meaningful difference (last-write-wins)", () => {
    const a = applyHealthcareEstimate(defaultPhase1Workbook, estimate);
    const b = applyHealthcareEstimate(defaultPhase1Workbook, { ...estimate, amount: 200_000 });
    expect(workbooksDiffer(a, b)).toBe(true);
  });
});
