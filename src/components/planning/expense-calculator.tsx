"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import {
  CalculateBar,
  NumberInput,
  ResultCard,
  formatCurrency,
  useCalculateGate
} from "@/components/planning/planning-tool-panel";

// Standalone annual living-expense estimator. Intentionally self-contained: it
// does NOT register in PLANNING_TOOLS (so it stays out of the hub grid and the
// "More planning tools" footer) and does not feed any other calculator — it
// just produces a clean monthly and annual total. The header/footer chrome
// mirrors ToolShell so it looks identical to the sibling calculators.

type ExpenseBasis = "monthly" | "annual";

type ExpenseCategory = {
  id: string;
  label: string;
  // Default amount expressed as a MONTHLY figure — the calculator's internal
  // basis. Annual entry just multiplies/divides the displayed value by 12.
  defaultMonthly: number;
  step: number;
  // Short, always-visible basis note shown under the field, mirroring the
  // sourced-default notes on the other calculators.
  note: string;
};

// Rounded monthly placeholders in the ballpark of US national-average household
// spending (BLS Consumer Expenditure Survey). Starting points, not a budget.
const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  {
    id: "housing",
    label: "Housing",
    defaultMonthly: 1_800,
    step: 50,
    note: "Rent or mortgage plus upkeep — the biggest line for most households. Varies a lot by region (BLS CE avg, rounded)."
  },
  {
    id: "utilities",
    label: "Utilities",
    defaultMonthly: 400,
    step: 25,
    note: "Electricity, gas, water, trash, internet, and phone."
  },
  {
    id: "groceries",
    label: "Groceries",
    defaultMonthly: 600,
    step: 25,
    note: "Food eaten at home. Scale up for more people or higher-cost areas (BLS CE avg, rounded)."
  },
  {
    id: "transportation",
    label: "Transportation",
    defaultMonthly: 700,
    step: 25,
    note: "Car payment, fuel, insurance, and maintenance, or transit. Often the second-largest category (BLS CE avg, rounded)."
  },
  {
    id: "healthcare",
    label: "Healthcare",
    defaultMonthly: 450,
    step: 25,
    note: "Out-of-pocket medical plus premiums. Rises before Medicare — see the healthcare calculator for detail."
  },
  {
    id: "insurance",
    label: "Insurance",
    defaultMonthly: 300,
    step: 25,
    note: "Life, disability, umbrella, and any insurance not already in housing or transportation."
  },
  {
    id: "dining",
    label: "Dining & entertainment",
    defaultMonthly: 500,
    step: 25,
    note: "Restaurants, takeout, events, hobbies, and nights out — discretionary, easy to flex."
  },
  {
    id: "travel",
    label: "Travel",
    defaultMonthly: 400,
    step: 25,
    note: "Flights, hotels, and trips, spread across the year. Easier to enter as an annual amount."
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    defaultMonthly: 80,
    step: 5,
    note: "Streaming, software, memberships, and apps. Small each, easy to under-count in total."
  },
  {
    id: "other",
    label: "Other",
    defaultMonthly: 300,
    step: 25,
    note: "Anything that doesn't fit above — childcare, education, gifts, pets, or non-mortgage debt payments."
  }
];

export function ExpenseCalculator() {
  const [basis, setBasis] = useState<ExpenseBasis>("monthly");
  // Amounts are stored in the CURRENTLY displayed basis. Switching the basis
  // converts every value so the same real expense persists across the toggle.
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(EXPENSE_CATEGORIES.map((category) => [category.id, category.defaultMonthly]))
  );

  const setAmount = (id: string, value: number) => {
    setAmounts((previous) => ({ ...previous, [id]: value }));
  };

  const switchBasis = (next: ExpenseBasis) => {
    if (next === basis) return;
    const factor = next === "annual" ? 12 : 1 / 12;
    setAmounts((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([id, value]) => [id, Math.round(value * factor)])
      )
    );
    setBasis(next);
  };

  const liveResult = useMemo(() => {
    const enteredTotal = EXPENSE_CATEGORIES.reduce(
      (sum, category) => sum + (amounts[category.id] || 0),
      0
    );
    // Normalise whatever basis the user is entering in to both totals.
    const totalMonthly = basis === "monthly" ? enteredTotal : enteredTotal / 12;
    const totalAnnual = basis === "monthly" ? enteredTotal * 12 : enteredTotal;
    const largest = EXPENSE_CATEGORIES.reduce(
      (top, category) =>
        (amounts[category.id] || 0) > (amounts[top.id] || 0) ? category : top,
      EXPENSE_CATEGORIES[0]
    );
    return { totalMonthly, totalAnnual, largestLabel: largest.label };
  }, [amounts, basis]);

  const gate = useCalculateGate(liveResult);
  const result = gate.value;

  const basisLabel = basis === "monthly" ? "per month" : "per year";

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/app/fire-path"
          className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
        >
          &larr; Back to Path to FIRE
        </Link>
        <h1 className="mt-3 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900 md:text-5xl">
          Living expense calculator
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-gray-500">
          Add up your spending by category to estimate your total annual and monthly living
          expenses — the starting point for any FIRE plan. Enter amounts as monthly or annual; the
          totals stay in sync.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-4 p-6 sm:p-7">
          {/* Global monthly/annual toggle — flips the whole list at once. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-gray-800">I'm entering amounts</span>
            <div
              role="group"
              aria-label="Enter amounts as monthly or annual"
              className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-sm"
            >
              {(["monthly", "annual"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={basis === option}
                  onClick={() => switchBasis(option)}
                  className={
                    basis === option
                      ? "min-h-9 rounded-lg bg-white px-4 text-sm font-semibold text-gray-900 shadow-sm"
                      : "min-h-9 rounded-lg px-4 text-sm font-medium text-gray-500 transition hover:text-gray-900"
                  }
                >
                  {option === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
          </div>

          {EXPENSE_CATEGORIES.map((category) => (
            <NumberInput
              key={category.id}
              id={`expense-${category.id}`}
              label={category.label}
              value={amounts[category.id] ?? 0}
              onChange={(value) => setAmount(category.id, value)}
              suffix={basisLabel}
              step={category.step}
              help={`Your ${basis} spending on ${category.label.toLowerCase()}. The default is a rounded national-average placeholder — replace it with your own number.`}
              note={category.note}
            />
          ))}
        </Card>

        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard
            label="Total annual living expenses"
            value={formatCurrency(result.totalAnnual)}
            hero
            context="across all categories"
          />
          <ResultCard
            label="Total monthly living expenses"
            value={formatCurrency(result.totalMonthly)}
            context={`largest category: ${result.largestLabel}`}
          />
          <ResultCard
            label="Rough FIRE number (expenses × 25)"
            value={formatCurrency(result.totalAnnual * 25)}
            help="A common planning shortcut: 25 times annual expenses approximates the portfolio needed to retire at a 4% withdrawal rate. A rough heuristic, not a guarantee."
            context="at a 4% withdrawal rate"
          />
        </div>
      </div>

      <p className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Planning estimates only. Not financial, tax, or legal advice.
      </p>
    </div>
  );
}
