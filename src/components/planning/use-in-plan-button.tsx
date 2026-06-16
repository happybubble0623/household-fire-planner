"use client";

import { useState } from "react";
import { useIsAppMode } from "@/components/app-mode-provider";

// One-tap "Use in my plan" affordance. By default it's shown ONLY in the
// Capacitor app (`appOnly`); on the website it renders nothing, so calculator
// pages are unchanged there. The Mortgage and Tax calculators deliberately
// opt out via `appOnly={false}` so their plan mappings work on the website too.
// The caller supplies an async `onUse` that writes into the persisted workbook
// (via usePlanWorkbookWriter); this component owns the idle → saving → done UI
// and a confirmation line so the user sees their result landed in the plan.
export function UseInPlanButton({
  label,
  confirmation,
  onUse,
  appOnly = true
}: {
  // Button text, e.g. "Use in my plan".
  label: string;
  // Confirmation shown after a successful write, e.g. "Added to your plan".
  confirmation: string;
  onUse: () => Promise<void>;
  // When false, the button also renders on the website (used only by Mortgage
  // and Tax). Defaults to true, keeping every other caller app-only.
  appOnly?: boolean;
}) {
  const isAppMode = useIsAppMode();
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");

  if (appOnly && !isAppMode) return null;

  async function handleClick() {
    setState("saving");
    try {
      await onUse();
      setState("done");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--gold-border)] bg-[var(--gold-bg)] p-4 shadow-sm">
      <button
        type="button"
        onClick={handleClick}
        disabled={state === "saving"}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-70"
      >
        {state === "saving" ? "Saving…" : state === "done" ? "Update my plan" : label}
      </button>
      {state === "done" ? (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-[var(--positive)]">
          <svg
            width="15"
            height="15"
            viewBox="0 0 15 15"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="7.5" cy="7.5" r="6.5" />
            <path d="M4.7 7.7l1.9 1.9 3.7-4.1" />
          </svg>
          {confirmation}
        </p>
      ) : null}
      {state === "error" ? (
        <p className="mt-2 text-[13px] font-semibold text-[var(--negative)]">
          Couldn&apos;t save to your plan. Please try again.
        </p>
      ) : null}
    </div>
  );
}
