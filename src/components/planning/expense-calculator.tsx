"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { InfoPopover } from "@/components/ui/info-popover";
import { UseInPlanButton } from "@/components/planning/use-in-plan-button";
import { usePlanWorkbookWriter } from "@/lib/storage/use-plan-writer";
import { applyAnnualExpenses } from "@/lib/phase1/plan-mappings";
import {
  CalculateBar,
  ResultCard,
  formatCurrency,
  useCalculateGate
} from "@/components/planning/planning-tool-panel";
import {
  EXPENSE_GROUPS,
  computeExpenseTotals,
  defaultExpenseEntries,
  type ExpenseEntry,
  type ExpenseItem,
  type ItemFrequency
} from "@/lib/calculations/expenses";

// Standalone annual living-expense estimator. Intentionally self-contained: it
// does NOT register in PLANNING_TOOLS (so it stays out of the hub grid and the
// "More planning tools" footer) and does not feed any other calculator — it
// just produces a clean monthly and annual total. The header/footer chrome
// mirrors ToolShell so it looks identical to the sibling calculators.
//
// Every line item carries its OWN monthly/annual frequency (the source of
// truth). A monthly item contributes ×12 to the annual total; an annual item
// as-is. A small "set all to" control flips every row at once for convenience.

// Compact per-item frequency toggle (Mo / Yr) — kept small so each row stays on
// one line down to narrow phones.
function FrequencyToggle({
  itemId,
  label,
  value,
  onChange
}: {
  itemId: string;
  label: string;
  value: ItemFrequency;
  onChange: (value: ItemFrequency) => void;
}) {
  return (
    <div
      role="group"
      aria-label={`${label}: enter as monthly or annual`}
      className="inline-flex shrink-0 rounded-lg border border-gray-200 bg-gray-50 p-0.5 shadow-sm"
    >
      {(["monthly", "annual"] as const).map((option) => (
        <button
          key={option}
          type="button"
          id={option === "monthly" ? `freq-${itemId}` : undefined}
          aria-pressed={value === option}
          onClick={() => onChange(option)}
          className={
            value === option
              ? "min-h-8 rounded-md bg-white px-2.5 text-xs font-semibold text-gray-900 shadow-sm"
              : "min-h-8 rounded-md px-2.5 text-xs font-medium text-gray-500 transition hover:text-gray-900"
          }
        >
          {option === "monthly" ? "Mo" : "Yr"}
          <span className="sr-only">{option === "monthly" ? "Monthly" : "Annual"}</span>
        </button>
      ))}
    </div>
  );
}

// One spending line: label (+ optional note tooltip), amount field, and the
// per-item frequency toggle. Label sits on its own line; the amount + toggle
// share the line below so nothing overflows on mobile.
function ExpenseRow({
  item,
  entry,
  onAmountChange,
  onFrequencyChange
}: {
  item: ExpenseItem;
  entry: ExpenseEntry;
  onAmountChange: (value: number) => void;
  onFrequencyChange: (value: ItemFrequency) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const inputId = `expense-${item.id}`;
  const displayed = draft ?? String(entry.amount);

  return (
    <div className="py-1">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
        <label htmlFor={inputId}>{item.label}</label>
        {item.note ? <InfoPopover label={item.label} content={item.note} /> : null}
      </div>
      <div className="mt-1.5 flex items-stretch gap-2">
        <div className="flex min-h-11 flex-1 items-center rounded-xl border border-gray-200 bg-white px-3 shadow-sm focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
          <span className="pr-1 text-sm font-medium text-gray-400">$</span>
          <input
            id={inputId}
            type="text"
            inputMode="decimal"
            min={0}
            step={item.step}
            value={displayed}
            onChange={(event) => {
              const raw = event.target.value;
              setDraft(raw);
              const parsed = Number(raw.trim());
              if (raw.trim() && Number.isFinite(parsed)) {
                onAmountChange(parsed);
              } else if (!raw.trim()) {
                onAmountChange(0);
              }
            }}
            onFocus={() => setDraft(String(entry.amount))}
            onBlur={() => setDraft(null)}
            onWheel={(event) => event.currentTarget.blur()}
            aria-label={`${item.label} amount`}
            className="min-h-10 w-full border-0 bg-transparent py-1.5 text-base font-medium text-gray-900 outline-none"
          />
        </div>
        <FrequencyToggle
          itemId={item.id}
          label={item.label}
          value={entry.frequency}
          onChange={onFrequencyChange}
        />
      </div>
    </div>
  );
}

export function ExpenseCalculator() {
  // Per-item entries are the source of truth: each holds an amount and its own
  // monthly/annual basis.
  const [entries, setEntries] = useState<Record<string, ExpenseEntry>>(defaultExpenseEntries);

  const setAmount = (id: string, amount: number) => {
    setEntries((previous) => ({ ...previous, [id]: { ...previous[id], amount } }));
  };

  const setFrequency = (id: string, frequency: ItemFrequency) => {
    setEntries((previous) => {
      const current = previous[id];
      if (current.frequency === frequency) return previous;
      // Convert the displayed amount so the same real expense persists across
      // the toggle (monthly→annual ×12, annual→monthly ÷12).
      const factor = frequency === "annual" ? 12 : 1 / 12;
      return {
        ...previous,
        [id]: { amount: Math.round(current.amount * factor), frequency }
      };
    });
  };

  // Convenience: flip every row to one basis at once. Converts amounts the same
  // way the per-item toggle does, so totals are unchanged.
  const setAllFrequencies = (frequency: ItemFrequency) => {
    setEntries((previous) =>
      Object.fromEntries(
        Object.entries(previous).map(([id, entry]) => {
          if (entry.frequency === frequency) return [id, entry];
          const factor = frequency === "annual" ? 12 : 1 / 12;
          return [id, { amount: Math.round(entry.amount * factor), frequency }];
        })
      )
    );
  };

  const liveResult = useMemo(() => computeExpenseTotals(entries), [entries]);
  const gate = useCalculateGate(liveResult);
  const result = gate.value;

  // App-mode "Use in my plan": set the Plan's annual-expenses input to this
  // calculator's computed annual total (the exact "Total annual living expenses"
  // hero figure). Reuses the same workbook write the Plan's own input uses.
  const writePlanWorkbook = usePlanWorkbookWriter();
  const setPlanAnnualExpenses = () =>
    writePlanWorkbook((workbook) => applyAnnualExpenses(workbook, result.totalAnnual)).then(
      () => undefined
    );

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
          Add up your spending line by line, grouped by category, to estimate your total annual and
          monthly living expenses — the starting point for any FIRE plan. Each line has its own
          monthly or annual switch, so enter every cost in whichever basis you know it best.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <Card className="grid gap-5 p-6 sm:p-7">
          {/* Convenience control — per-item toggles remain the source of truth. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-gray-800">Set every line to</span>
            <div
              role="group"
              aria-label="Set all lines to monthly or annual"
              className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 shadow-sm"
            >
              {(["monthly", "annual"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setAllFrequencies(option)}
                  className="min-h-9 rounded-lg px-4 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
                >
                  {option === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
          </div>

          {EXPENSE_GROUPS.map((group) => {
            const subtotal = result.groups.find((entry) => entry.id === group.id);
            const liveSubtotal = liveResult.groups.find((entry) => entry.id === group.id);
            return (
              <div key={group.id} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 border-b border-gray-100 pb-1.5">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-500">
                    {group.label}
                  </h2>
                  <span className="text-sm font-semibold tabular-nums text-gray-700">
                    {formatCurrency(liveSubtotal?.annual ?? 0)}
                    <span className="font-normal text-gray-400">/yr</span>
                  </span>
                </div>
                {group.items.map((item) => (
                  <ExpenseRow
                    key={item.id}
                    item={item}
                    entry={entries[item.id]}
                    onAmountChange={(value) => setAmount(item.id, value)}
                    onFrequencyChange={(value) => setFrequency(item.id, value)}
                  />
                ))}
              </div>
            );
          })}
        </Card>

        <div className="grid gap-5">
          <CalculateBar stale={gate.stale} onRecalculate={gate.recalculate} />
          <ResultCard
            label="Total annual living expenses"
            value={formatCurrency(result.totalAnnual)}
            hero
            context="across all categories"
          />
          <UseInPlanButton
            label={`Use in my plan · ${formatCurrency(result.totalAnnual)}/yr`}
            confirmation="Set as your plan's annual expenses"
            onUse={setPlanAnnualExpenses}
          />
          <ResultCard
            label="Total monthly living expenses"
            value={formatCurrency(result.totalMonthly)}
            context={
              result.largestGroupLabel
                ? `largest category: ${result.largestGroupLabel}`
                : undefined
            }
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
