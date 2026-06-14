import { describe, expect, it } from "vitest";
import {
  EXPENSE_GROUPS,
  EXPENSE_ITEMS,
  annualizeEntry,
  computeExpenseTotals,
  defaultExpenseEntries,
  type ExpenseEntry,
  type ExpenseGroup
} from "@/lib/calculations/expenses";

// Build an entry map from a partial { id: {amount, frequency} } spec, defaulting
// every unspecified item to 0 so a test only states the lines it cares about.
function entriesFrom(spec: Record<string, ExpenseEntry>): Record<string, ExpenseEntry> {
  const base = Object.fromEntries(
    EXPENSE_ITEMS.map((item) => [item.id, { amount: 0, frequency: "monthly" } as ExpenseEntry])
  );
  return { ...base, ...spec };
}

describe("annualizeEntry", () => {
  it("multiplies a monthly amount by 12", () => {
    expect(annualizeEntry({ amount: 100, frequency: "monthly" })).toBe(1_200);
  });

  it("passes an annual amount through unchanged", () => {
    expect(annualizeEntry({ amount: 1_200, frequency: "annual" })).toBe(1_200);
  });

  it("treats negative or non-finite amounts as 0", () => {
    expect(annualizeEntry({ amount: -50, frequency: "monthly" })).toBe(0);
    expect(annualizeEntry({ amount: Number.NaN, frequency: "annual" })).toBe(0);
  });
});

describe("computeExpenseTotals — mixed per-item frequencies", () => {
  // A tiny two-group fixture keeps the arithmetic obvious and decoupled from the
  // shipped defaults.
  const groups: ExpenseGroup[] = [
    {
      id: "housing",
      label: "Housing",
      items: [
        { id: "rent", label: "Rent", defaultAmount: 0, defaultFrequency: "monthly", step: 1 },
        { id: "tax", label: "Property tax", defaultAmount: 0, defaultFrequency: "annual", step: 1 }
      ]
    },
    {
      id: "fun",
      label: "Fun",
      items: [
        { id: "travel", label: "Travel", defaultAmount: 0, defaultFrequency: "annual", step: 1 }
      ]
    }
  ];

  it("annualizes monthly and annual lines correctly and sums them", () => {
    // Rent 2,000/mo → 24,000/yr; Property tax 3,600/yr → 3,600; Travel 5,000/yr → 5,000.
    const entries = {
      rent: { amount: 2_000, frequency: "monthly" as const },
      tax: { amount: 3_600, frequency: "annual" as const },
      travel: { amount: 5_000, frequency: "annual" as const }
    };
    const result = computeExpenseTotals(entries, groups);

    expect(result.totalAnnual).toBe(32_600);
    // Monthly grand total is the annual total / 12, not a naive sum of monthly fields.
    expect(result.totalMonthly).toBeCloseTo(32_600 / 12, 6);
  });

  it("reports a subtotal per category from its mixed-frequency lines", () => {
    const entries = {
      rent: { amount: 2_000, frequency: "monthly" as const }, // 24,000/yr
      tax: { amount: 3_600, frequency: "annual" as const }, //     3,600/yr
      travel: { amount: 5_000, frequency: "annual" as const } //   5,000/yr
    };
    const result = computeExpenseTotals(entries, groups);

    const housing = result.groups.find((group) => group.id === "housing");
    const fun = result.groups.find((group) => group.id === "fun");
    expect(housing?.annual).toBe(27_600);
    expect(housing?.monthly).toBeCloseTo(2_300, 6);
    expect(fun?.annual).toBe(5_000);
  });

  it("flags the category with the largest annual subtotal", () => {
    const entries = {
      rent: { amount: 100, frequency: "monthly" as const }, // 1,200/yr → Housing
      travel: { amount: 9_000, frequency: "annual" as const } // 9,000/yr → Fun
    };
    const result = computeExpenseTotals(entries, groups);
    expect(result.largestGroupLabel).toBe("Fun");
  });

  it("equals a naive monthly sum when every line is monthly", () => {
    // Sanity check: with no annual lines, annual = 12 × the monthly sum.
    const entries = {
      rent: { amount: 1_500, frequency: "monthly" as const },
      tax: { amount: 250, frequency: "monthly" as const },
      travel: { amount: 400, frequency: "monthly" as const }
    };
    const result = computeExpenseTotals(entries, groups);
    expect(result.totalMonthly).toBeCloseTo(2_150, 6);
    expect(result.totalAnnual).toBe(25_800);
  });

  it("returns zeros and no largest category for an all-empty sheet", () => {
    const result = computeExpenseTotals(entriesFrom({}));
    expect(result.totalAnnual).toBe(0);
    expect(result.totalMonthly).toBe(0);
    expect(result.largestGroupLabel).toBe("");
  });

  it("changing one line's frequency changes the total the way the toggle implies", () => {
    const asMonthly = computeExpenseTotals(
      entriesFrom({ travel: { amount: 200, frequency: "monthly" } }),
      EXPENSE_GROUPS
    );
    const asAnnual = computeExpenseTotals(
      entriesFrom({ travel: { amount: 200, frequency: "annual" } }),
      EXPENSE_GROUPS
    );
    // Same number entered: monthly counts 12× the annual contribution.
    expect(asMonthly.totalAnnual).toBe(2_400);
    expect(asAnnual.totalAnnual).toBe(200);
  });
});

describe("shipped defaults", () => {
  it("gives every line an entry with a valid frequency", () => {
    const defaults = defaultExpenseEntries();
    for (const item of EXPENSE_ITEMS) {
      expect(defaults[item.id]).toBeDefined();
      expect(["monthly", "annual"]).toContain(defaults[item.id].frequency);
    }
  });

  it("groups the items under ten category headers with unique ids", () => {
    expect(EXPENSE_GROUPS).toHaveLength(10);
    const ids = EXPENSE_ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("produces a positive grand total from the prefilled defaults", () => {
    const result = computeExpenseTotals(defaultExpenseEntries());
    expect(result.totalAnnual).toBeGreaterThan(0);
    expect(result.totalMonthly).toBeCloseTo(result.totalAnnual / 12, 6);
  });
});
