"use client";

import { useEffect, useState } from "react";
import { useIsAppMode } from "@/components/app-mode-provider";
import { isAppLockEnabled, isBiometricAvailable, setAppLockEnabled } from "@/lib/app-lock";

// The "Security" row on the in-app More page. Shown ONLY in the Capacitor app
// (mirrors RemindersSection): on the website it renders nothing, so the site is
// unaffected. App Lock is opt-in and OFF by default; enabling first checks that
// Face ID / Touch ID is set up, and surfaces a hint if it isn't.
const sectionLabelClass = "text-[11px] font-semibold uppercase tracking-wide text-gray-500";

export function AppLockSection() {
  const isAppMode = useIsAppMode();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  // Reflect the persisted preference on mount (localStorage is client-only).
  useEffect(() => {
    setEnabled(isAppLockEnabled());
  }, []);

  if (!isAppMode) return null;

  async function handleToggle() {
    if (busy) return;
    setBusy(true);
    setHint(null);

    if (enabled) {
      setAppLockEnabled(false);
      setEnabled(false);
    } else {
      const available = await isBiometricAvailable();
      if (available) {
        setAppLockEnabled(true);
        setEnabled(true);
      } else {
        setHint("Face ID isn't set up. Add Face ID in iOS Settings, then try again.");
      }
    }

    setBusy(false);
  }

  return (
    <div className="mt-6">
      <p className={sectionLabelClass}>Security</p>
      <div className="mt-2 rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">App Lock (Face ID)</p>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">
              Require Face ID to open the app and when you return to it.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="App Lock (Face ID)"
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
