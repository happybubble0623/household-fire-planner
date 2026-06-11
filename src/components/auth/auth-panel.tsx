"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/storage/supabase-sync";

type Step = "email" | "code";

const GUEST_HINT =
  "You can continue as Guest without creating an account. Household FIRE Planner never asks for brokerage, bank, SSA, or government credentials.";

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(GUEST_HINT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Step 1: email the verification code. We intentionally do NOT pass
  // emailRedirectTo — the code flow establishes the session in-page via
  // verifyOtp + the singleton client's onAuthStateChange, so it never relies on
  // detectSessionInUrl / a redirect callback (which was landing users back in
  // guest mode and could not support a different device than the email).
  async function sendCode(targetEmail: string) {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError(null);
      setStatus("Supabase is not configured. Guest mode remains available.");
      return false;
    }

    setBusy(true);
    setError(null);

    const { error: sendError } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: { shouldCreateUser: true }
    });

    setBusy(false);

    if (sendError) {
      setError(sendError.message);
      return false;
    }

    setStatus(
      `We emailed a verification code to ${targetEmail}. Enter it below to finish signing in.`
    );
    return true;
  }

  async function submitEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const sent = await sendCode(email);
    if (sent) {
      setCode("");
      setStep("code");
    }
  }

  // Step 2: verify the typed code. On success the singleton client persists the
  // session and fires onAuthStateChange, which signs the user in this tab and
  // triggers the existing workbook pull/reconcile (including the conflict
  // dialog) — same as before, no redirect involved.
  async function submitCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus("Supabase is not configured. Guest mode remains available.");
      return;
    }

    setBusy(true);
    setError(null);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code.trim(),
      type: "email"
    });

    setBusy(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    setStatus("You're signed in. Your saved plans will sync to this device.");
  }

  async function resendCode() {
    if (busy) return;
    await sendCode(email);
  }

  function changeEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setStatus(GUEST_HINT);
  }

  return (
    <section className="w-full rounded-lg border border-[var(--border)] bg-white p-6">
      <h1 className="text-2xl font-semibold">
        {mode === "signup" ? "Create Optional Account" : "Optional Account"}
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
        You can use Household FIRE Planner without an account. Create an optional account only if you want to save and sync your plans across devices.
      </p>

      {step === "email" ? (
        <form className="mt-5 grid gap-3" onSubmit={submitEmail}>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <input
              className="rounded-lg border border-[var(--border)] px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <p className="text-sm text-[var(--muted-foreground)]">
            No password needed — we&apos;ll email you a verification code.
          </p>
          <button
            className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-[var(--soft)] disabled:opacity-60"
            type="submit"
            disabled={busy}
          >
            {busy ? "Sending code…" : "Email Me a Code"}
          </button>
        </form>
      ) : (
        <form className="mt-5 grid gap-3" onSubmit={submitCode}>
          <label className="grid gap-2 text-sm font-medium">
            Verification code
            <input
              className="rounded-lg border border-[var(--border)] px-3 py-2 tracking-[0.4em]"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="12345678"
              autoComplete="one-time-code"
              autoFocus
              required
            />
          </label>
          <button
            className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold text-gray-700 transition-colors hover:bg-[var(--soft)] disabled:opacity-60"
            type="submit"
            disabled={busy || code.length < 6}
          >
            {busy ? "Verifying…" : "Verify Code & Sign In"}
          </button>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <button
              type="button"
              onClick={resendCode}
              disabled={busy}
              className="font-medium text-[var(--muted-foreground)] underline-offset-4 hover:underline disabled:opacity-60"
            >
              Didn&apos;t get it? Resend
            </button>
            <button
              type="button"
              onClick={changeEmail}
              disabled={busy}
              className="font-medium text-[var(--muted-foreground)] underline-offset-4 hover:underline disabled:opacity-60"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-[var(--destructive-soft,#fef2f2)] p-3 text-sm leading-6 text-[var(--destructive,#b91c1c)]"
        >
          {error}
        </p>
      ) : (
        <p
          role="status"
          aria-live="polite"
          className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]"
        >
          {status}
        </p>
      )}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/app/fire-path"
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Continue as Guest
        </Link>
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="text-sm font-medium text-[var(--muted-foreground)] underline-offset-4 hover:underline"
        >
          {mode === "signup" ? "Back to sign in" : "Create an optional account"}
        </Link>
      </div>
    </section>
  );
}
