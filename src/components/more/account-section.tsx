"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/auth/use-session";
import { loadPhase1Workbook } from "@/lib/storage/phase1-store";

// The account hub at the top of the in-app More page. Reuses the same auth
// primitives as the rest of the app — useSession() (which wraps
// supabase.auth.onAuthStateChange) for the signed-in user + signOut, and the
// /login route for the sign-in entry. No auth logic is reimplemented here.
//
// "Save status" is read from the same local store the planning workspace
// autosaves into (phase1-store / Dexie): a persisted row means the workbook is
// saved on this device; a Dexie failure mirrors the workspace's "autosave
// unavailable" fallback.

type LocalSaveStatus = "checking" | "saved" | "unavailable";

const cardClass =
  "rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm";

export function AccountSection() {
  const { user, loading, signOut } = useSession();
  const [localSave, setLocalSave] = useState<LocalSaveStatus>("checking");

  // Mirror the workspace's local-save signal without reimplementing autosave:
  // probe the same Dexie store. A readable store (row present or not) means
  // local-first persistence is working; a throw means it isn't available here.
  useEffect(() => {
    let active = true;
    loadPhase1Workbook()
      .then(() => {
        if (active) setLocalSave("saved");
      })
      .catch(() => {
        if (active) setLocalSave("unavailable");
      });
    return () => {
      active = false;
    };
  }, []);

  const saveLine =
    localSave === "unavailable"
      ? "Local mode — autosave unavailable in this browser"
      : "Saved on this device";

  // Match AccountNav: don't flash the wrong state while the session resolves.
  if (loading) {
    return <div className={`${cardClass} h-[120px] animate-pulse`} aria-hidden="true" />;
  }

  if (!user) {
    return (
      <div className={cardClass}>
        <h2 className="text-base font-semibold text-gray-900">Sign in to save &amp; sync</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-gray-600">
          Sync your plan and portfolio across devices and keep a secure backup of your numbers.
        </p>
        <Link
          href="/login"
          // The unlayered `a { color: inherit }` reset in globals.css beats
          // Tailwind's `text-white` (which lives in @layer utilities), so the
          // label rendered dark on the green fill. An inline color outranks the
          // unlayered rule (same proven fix as the StrategySwitcher chip).
          style={{ color: "#ffffff" }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
        >
          Sign in
        </Link>
        <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-[var(--muted-foreground)]">
          <ShieldCheck aria-hidden="true" size={14} className="mt-px shrink-0 text-[var(--primary)]" />
          <span>
            Your data stays on your device by default. {saveLine}.
          </span>
        </div>
      </div>
    );
  }

  const email = user.email ?? "Your account";

  return (
    <div className={cardClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Signed in
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-gray-900" title={email}>
            {email}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void signOut()}
          className="shrink-0 rounded-md border border-[var(--border)] px-3 py-1.5 text-[13px] font-medium text-gray-600 transition hover:bg-[var(--soft)] hover:text-gray-900"
        >
          Sign out
        </button>
      </div>
      <div className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--green-50)] px-3 py-2">
        <Check aria-hidden="true" size={15} className="shrink-0 text-[var(--primary)]" />
        <span className="text-[13px] font-medium text-[var(--primary-hover)]">
          Synced to your account
        </span>
      </div>
      <p className="mt-2 text-xs text-[var(--muted-foreground)]">{saveLine}.</p>
    </div>
  );
}
