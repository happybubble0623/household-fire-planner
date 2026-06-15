"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { AddHoldingForm } from "@/components/planning/add-holding-form";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";

// The dedicated "Add Holdings" screen (route /app/portfolio-lab/add). It renders
// the SAME AddHoldingForm used inline at the bottom of PortfolioPanel, so the
// fields, validation, defaults, and balance math are identical here — nothing
// is reimplemented. Wrapped in the shared workbook state via Phase1Workspace so
// adds persist + sync exactly like the inline form.
export function AddHoldingPanel({ status, onChange }: Phase1PanelProps) {
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);
  const visibleStatus = status.startsWith("Local mode") ? null : status;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/app/portfolio-lab"
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--muted)]"
        >
          <ArrowLeft aria-hidden="true" size={18} />
          Back to portfolio
        </Link>
        {visibleStatus ? (
          <p className="text-sm text-[var(--muted-foreground)]">{visibleStatus}</p>
        ) : null}
      </div>

      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
          Portfolio
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-gray-900">
          Add holdings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          Search a ticker or enter a balance, choose owner and account, and mark
          whether it counts toward FIRE. Each row saves to your private workbook.
        </p>
      </div>

      {lastAddedName ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--primary)]/30 bg-[var(--green-50)] p-4"
        >
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary-hover)]">
            <Check aria-hidden="true" size={18} />
            Added {lastAddedName}. Add another below, or return to your portfolio.
          </p>
          <Link
            href="/app/portfolio-lab"
            className="text-sm font-semibold text-[var(--primary)] underline-offset-4 hover:underline"
          >
            View portfolio
          </Link>
        </div>
      ) : null}

      <AddHoldingForm onChange={onChange} onItemAdded={(item) => setLastAddedName(item.name)} />
    </div>
  );
}
