"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/storage/supabase-sync";

export function AuthPanel({ mode }: { mode: "login" | "signup" }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState(
    "You can continue as Guest without creating an account."
  );

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = getSupabaseClient();

    if (!supabase) {
      setStatus("Supabase is not configured. Guest mode remains available.");
      return;
    }

    const { error } =
      mode === "signup"
        ? await supabase.auth.signInWithOtp({ email })
        : await supabase.auth.signInWithOtp({ email });

    setStatus(
      error
        ? error.message
        : "Check your email for the sign-in link. Household FIRE Planner never asks for brokerage, bank, SSA, or government credentials."
    );
  }

  return (
    <section className="w-full rounded-lg border border-[var(--border)] bg-white p-6">
      <h1 className="text-2xl font-semibold">
        {mode === "signup" ? "Create Optional Account" : "Optional Account"}
      </h1>
      <p className="mt-3 leading-7 text-[var(--muted-foreground)]">
        You can use Household FIRE Planner without an account. Create an optional account only if you want to save and sync your plans across devices.
      </p>
      <form className="mt-5 grid gap-3" onSubmit={submit}>
        <label className="grid gap-2 text-sm font-medium">
          Email
          <input
            className="rounded-lg border border-[var(--border)] px-3 py-2"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
          />
        </label>
        <button className="rounded-lg bg-[var(--primary)] px-4 py-2 font-semibold text-white" type="submit">
          Send Sign-In Link
        </button>
      </form>
      <p className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
        {status}
      </p>
      <div className="mt-5 flex gap-3">
        <Link href="/app/freedom-map" className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold">
          Continue as Guest
        </Link>
        <Link href={mode === "signup" ? "/login" : "/signup"} className="rounded-lg border border-[var(--border)] px-4 py-2 font-semibold">
          {mode === "signup" ? "Back to Login" : "Sign Up"}
        </Link>
      </div>
    </section>
  );
}
