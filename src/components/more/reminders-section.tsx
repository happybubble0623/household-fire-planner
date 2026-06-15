"use client";

import { useEffect, useState } from "react";
import { useIsAppMode } from "@/components/app-mode-provider";
import {
  disableReminder,
  enableMonthlyReminder,
  isReminderEnabled
} from "@/lib/notifications";

// The "Reminders" row on the in-app More page. Shown ONLY in the Capacitor app
// (mirrors UseInPlanButton): on the website it renders nothing, so the site is
// unaffected. The monthly check-in reminder is opt-in and OFF by default; the
// toggle reflects the persisted preference and surfaces a hint if iOS denies
// notification permission.
const sectionLabelClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500";

export function RemindersSection() {
  const isAppMode = useIsAppMode();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Reflect the persisted preference on mount (localStorage is client-only).
  useEffect(() => {
    setEnabled(isReminderEnabled());
  }, []);

  if (!isAppMode) return null;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    setHint(null);

    if (enabled) {
      await disableReminder();
      setEnabled(false);
    } else {
      const result = await enableMonthlyReminder();
      if (result === "enabled") {
        setEnabled(true);
      } else if (result === "denied") {
        setHint("Notifications are off. Enable them for Plan My FIRE in iOS Settings.");
      } else {
        setHint("Reminders aren't available right now.");
      }
    }

    setBusy(false);
  }

  return (
    <div className="mt-6">
      <p className={sectionLabelClass}>Reminders</p>
      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">Monthly check-in reminder</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              A once-a-month nudge to revisit your FIRE plan.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Monthly check-in reminder"
            disabled={busy}
            onClick={() => void handleToggle()}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-60 ${
              enabled ? "bg-[var(--primary)]" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-150 ${
                enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
        {hint ? (
          <p className="mt-3 text-[13px] leading-relaxed text-[var(--muted-foreground)]">{hint}</p>
        ) : null}
      </div>
    </div>
  );
}
