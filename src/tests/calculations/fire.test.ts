import { describe, expect, it } from "vitest";
import { addMonths } from "date-fns";
import {
  calculateSimpleFireNumber,
  evaluateCandidateRetirementDate,
  getConservativeAllocationWarning,
  calculateAccountLevelEffectiveTaxRate,
  taxAdjustedWithdrawal
} from "@/lib/calculations/fire";
import { samplePlan } from "@/lib/data/sample-plan";

describe("FIRE calculation helpers", () => {
  it("calculates the simple FIRE number from the annual spending gap and withdrawal rate", () => {
    expect(calculateSimpleFireNumber(60000, 12000, 0.05)).toBe(960000);
  });

  it("grosses up withdrawals when a simple blended tax rate is selected", () => {
    expect(taxAdjustedWithdrawal(80000, { mode: "none", accountWithdrawalMethod: "pro_rata" })).toBe(
      80000
    );
    expect(
      taxAdjustedWithdrawal(80000, {
        mode: "simple_blended",
        simpleEffectiveTaxRate: 0.2,
        accountWithdrawalMethod: "pro_rata"
      })
    ).toBe(100000);
  });

  it("grosses up withdrawals using pro-rata account-level effective tax rates", () => {
    const effectiveRate = calculateAccountLevelEffectiveTaxRate(samplePlan, "2025-12-31", {
      taxable: 0.15,
      tax_deferred: 0.25,
      tax_free: 0,
      cash: 0,
      real_estate: 0.1,
      custom: 0.2
    });

    expect(effectiveRate).toBeCloseTo(0.03, 3);
    expect(
      taxAdjustedWithdrawal(
        80000,
        {
          mode: "account_level",
          accountWithdrawalMethod: "pro_rata",
          accountTaxRates: {
            taxable: 0.15,
            tax_deferred: 0.25,
            tax_free: 0,
            cash: 0,
            real_estate: 0.1,
            custom: 0.2
          }
        },
        effectiveRate
      )
    ).toBeCloseTo(82474.23, 2);
  });

  it("warns when bond-equivalent plus cash allocation is at least 50 percent", () => {
    expect(
      getConservativeAllocationWarning({
        stockPercent: 40,
        bondEquivalentPercent: 40,
        cashPercent: 20,
        rebalanceFrequency: "annual"
      })
    ).toContain("50% or more");
  });

  it("branches withdrawal-rate candidate tests on portfolio depletion", async () => {
    const savedPath = {
      ...samplePlan.savedPaths[0],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        fireRuleMode: "withdrawal_rate" as const,
        withdrawalRate: 0.05
      },
      expenses: [
        {
          id: "expense-large",
          name: "Large retirement spending",
          category: "Living",
          amount: 240000,
          frequency: "annual" as const,
          startTiming: { type: "exact_date" as const, date: "2026-01-01" },
          inflationAdjusted: false,
          isEssential: true,
          includedInFirePath: true
        }
      ],
      incomeStreams: []
    };

    const result = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2026-01-01",
      "deterministic"
    );

    expect(result.fireRuleMode).toBe("withdrawal_rate");
    expect(result.passes).toBe(false);
    expect(result.failureDate).toBeTruthy();
  });

  it("branches income stream candidate tests on passive and guaranteed income coverage", async () => {
    const startDate = addMonths(new Date("2026-01-01T00:00:00.000Z"), 0);
    const savedPath = {
      ...samplePlan.savedPaths[0],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        fireRuleMode: "income_stream" as const
      },
      expenses: [
        {
          id: "expense-covered",
          name: "Covered expenses",
          category: "Living",
          amount: 5000,
          frequency: "monthly" as const,
          startTiming: {
            type: "exact_date" as const,
            date: startDate.toISOString().slice(0, 10)
          },
          inflationAdjusted: false,
          isEssential: true,
          includedInFirePath: true
        }
      ],
      incomeStreams: [
        {
          id: "income-rental",
          name: "Rental net income",
          incomeType: "rental" as const,
          incomeCategory: "passive" as const,
          amount: 72000,
          frequency: "annual" as const,
          startTiming: { type: "exact_date" as const, date: "2026-01-01" },
          endTiming: "lifetime" as const,
          inflationAdjusted: false,
          taxable: false,
          includedInFirePath: true
        }
      ]
    };

    const result = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2026-01-01",
      "deterministic"
    );

    expect(result.fireRuleMode).toBe("income_stream");
    expect(result.passes).toBe(true);
    expect(result.incomeCoverageRatio).toBeGreaterThanOrEqual(1);
  });

  it("resolves relative timing rules against planning events", async () => {
    const savedPath = {
      ...samplePlan.savedPaths[0],
      planningEvents: [
        {
          id: "event-retirement",
          name: "Retirement Date",
          eventType: "retirement_date" as const,
          timing: { type: "exact_date" as const, date: "2030-01-01" }
        }
      ],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        fireRuleMode: "income_stream" as const
      },
      expenses: [
        {
          id: "expense-relative",
          name: "Relative expense",
          category: "Living",
          amount: 60000,
          frequency: "annual" as const,
          startTiming: {
            type: "relative_event" as const,
            eventId: "event-retirement",
            offsetValue: 1,
            offsetUnit: "years" as const,
            direction: "after" as const
          },
          inflationAdjusted: false,
          isEssential: true,
          includedInFirePath: true
        }
      ],
      incomeStreams: []
    };

    const beforeRelativeStart = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2030-06-01",
      "deterministic"
    );
    const afterRelativeStart = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2031-01-01",
      "deterministic"
    );

    expect(beforeRelativeStart.annualExpenses).toBe(0);
    expect(beforeRelativeStart.passes).toBe(true);
    expect(afterRelativeStart.annualExpenses).toBe(60000);
    expect(afterRelativeStart.passes).toBe(false);
  });

  it("stops counting expenses after an exact end date", async () => {
    const savedPath = {
      ...samplePlan.savedPaths[0],
      assumptions: {
        ...samplePlan.savedPaths[0].assumptions,
        fireRuleMode: "income_stream" as const
      },
      expenses: [
        {
          id: "expense-bridge",
          name: "Bridge expense",
          category: "Healthcare",
          amount: 60000,
          frequency: "annual" as const,
          startTiming: { type: "exact_date" as const, date: "2030-01-01" },
          endTiming: { type: "exact_date" as const, date: "2030-12-31" },
          inflationAdjusted: false,
          isEssential: true,
          includedInFirePath: true
        }
      ],
      incomeStreams: []
    };

    const duringExpense = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2030-06-01",
      "deterministic"
    );
    const afterExpense = await evaluateCandidateRetirementDate(
      samplePlan,
      savedPath,
      "2031-01-01",
      "deterministic"
    );

    expect(duringExpense.annualExpenses).toBe(60000);
    expect(afterExpense.annualExpenses).toBe(0);
  });
});
