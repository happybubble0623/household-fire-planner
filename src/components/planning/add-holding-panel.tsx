"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { AddHoldingForm } from "@/components/planning/add-holding-form";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";

// The dedicated "Add / Edit Holdings" screen (route /app/portfolio-lab/add). It
// renders the SAME AddHoldingForm used everywhere else, so the fields,
// validation, defaults, and balance math are identical — nothing is
// reimplemented. With ?edit=<id> it loads that existing row into the form for
// editing (the portfolio table's per-row edit action links here), then returns
// to the portfolio once the row is saved. Wrapped in the shared workbook state
// via Phase1Workspace so adds and edits persist + sync the same way.
export function AddHoldingPanel({ status, workbook, onChange }: Phase1PanelProps) {
  const router = useRouter();
  const [lastAddedName, setLastAddedName] = useState<string | null>(null);
  // Read the optional ?edit=<id> param client-side. Using window.location here
  // (instead of useSearchParams) avoids forcing a Suspense boundary at build;
  // this panel only renders after the workbook has loaded, so the row lookup
  // below resolves as soon as the param is read.
  const [editId, setEditId] = useState<string | null>(null);
  useEffect(() => {
    setEditId(new URLSearchParams(window.location.search).get("edit"));
  }, []);

  const editItem = editId
    ? workbook.portfolioItems.find((item) => item.id === editId) ?? null
    : null;
  const isEditing = Boolean(editItem);
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
          {isEditing ? "Edit holding" : "Add holdings"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
          {isEditing
            ? "Update this holding's details below. Saving returns you to your portfolio."
            : "Search a ticker or enter a balance, choose owner and account, and mark whether it counts toward FIRE. Each row saves to your private workbook."}
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

      <AddHoldingForm
        onChange={onChange}
        editItem={editItem}
        onItemAdded={(item) => setLastAddedName(item.name)}
        onItemSaved={() => router.push("/app/portfolio-lab")}
      />
    </div>
  );
}
