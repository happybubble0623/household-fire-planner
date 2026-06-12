"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/storage/supabase-sync";

type Step = "email" | "code";

const GUEST_HINT =
  "You can continue as Guest without creating an account. Household FIRE Planner never asks for brokerage, bank, SSA, or government credentials.";

// Where a successful sign-in (and Continue as Guest) lands the user.
const POST_SIGN_IN_PATH = "/app/fire-path";

// How long the "You're signed in" confirmation is shown before we redirect.
// Long enough to reassure the user the code worked, short enough to feel snappy.
const REDIRECT_DELAY_MS = 1000;

// Soft client-side cap on how many sign-in codes a single device may request per
// calendar day (initial sends AND resends both count). This is a courtesy guard
// against accidental email spam / hitting Supabase's own rate limit — it lives in
// localStorage so it is trivially bypassable and is meant only as a first line of
// defense. Real server-side abuse protection (per-email / per-IP throttling) is a
// follow-up after deploy; raise this number then if needed.
const MAX_DAILY_CODE_REQUESTS = 4;
const CODE_REQUEST_STORAGE_KEY = "hfp:code-requests";

// Local calendar day (YYYY-MM-DD) used to key the daily counter so it resets at
// midnight in the user's own timezone.
function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function readCodeRequestCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(CODE_REQUEST_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date?: string; count?: number };
    return parsed?.date === todayKey() ? Number(parsed.count) || 0 : 0;
  } catch {
    return 0;
  }
}

function incrementCodeRequestCount(): void {
  if (typeof window === "undefined") return;
  try {
    const next = readCodeRequestCount() + 1;
    window.localStorage.setItem(
      CODE_REQUEST_STORAGE_KEY,
      JSON.stringify({ date: todayKey(), count: next })
    );
  } catch {
    // Storage may be unavailable (private mode / quota); fail open rather than
    // blocking a legitimate sign-in.
  }
}

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState(GUEST_HINT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Cancel a pending post-sign-in redirect if the component unmounts first.
  useEffect(
    () => () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    },
    []
  );

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

    // Enforce the per-device daily cap before we send (covers initial sends and
    // resends, since both route through here).
    if (readCodeRequestCount() >= MAX_DAILY_CODE_REQUESTS) {
      setError(
        `You've requested the maximum of ${MAX_DAILY_CODE_REQUESTS} codes today. Please try again tomorrow.`
      );
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

    // Only count sends that actually went out, so a provider-side failure doesn't
    // burn the user's daily allowance.
    incrementCodeRequestCount();

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

    // Session is now established (verifyOtp persisted it + fired
    // onAuthStateChange). Flash a brief confirmation, then navigate into the app
    // so the user isn't stranded on /login thinking sign-in failed. router.refresh
    // re-renders server components so the signed-in header picks up the session.
    setStatus("You're signed in. Taking you to your FIRE path…");
    redirectTimer.current = setTimeout(() => {
      router.push(POST_SIGN_IN_PATH);
      router.refresh();
    }, REDIRECT_DELAY_MS);
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
          href={POST_SIGN_IN_PATH}
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
