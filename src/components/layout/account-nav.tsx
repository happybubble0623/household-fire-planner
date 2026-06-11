"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/use-session";

// Matches mobileLinkClass in app-shell so the affordance sits flush with the
// other mobile menu links.
const mobileLinkClass =
  "block rounded-lg px-[11px] py-2.5 text-sm font-medium text-gray-700 transition-colors duration-150 hover:bg-[var(--soft)] hover:text-gray-900";

// Deliberately low-key per the owner: a quiet "Sign in" text link when logged
// out, and a small account chip with "Sign out" when logged in. Never a hero
// CTA — accounts are opt-in and the anonymous local-first experience is default.
// Shared by the AppShell header and the home hub's aurora nav so the two can't
// drift apart.
export function AccountNav({ variant }: { variant: "desktop" | "mobile" }) {
  const { user, loading, signOut } = useSession();

  // Avoid flashing the wrong state while the initial session resolves.
  if (loading) return null;

  if (!user) {
    if (variant === "mobile") {
      return (
        <Link href="/login" className={mobileLinkClass}>
          Sign in
        </Link>
      );
    }
    return (
      <Link
        href="/login"
        className="whitespace-nowrap text-sm font-medium text-gray-400 transition-colors duration-150 hover:text-gray-700"
      >
        Sign in
      </Link>
    );
  }

  const email = user.email ?? "Account";

  if (variant === "mobile") {
    return (
      <div className="px-[11px] py-2.5">
        <p className="truncate text-sm font-medium text-gray-700">{email}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-1 text-sm font-medium text-gray-500 underline-offset-4 transition-colors hover:text-gray-900 hover:underline"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-2.5 py-1.5">
      <span
        className="max-w-[150px] truncate text-[13px] font-medium text-gray-600"
        title={email}
      >
        {email}
      </span>
      <button
        type="button"
        onClick={() => void signOut()}
        className="text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-700"
      >
        Sign out
      </button>
    </div>
  );
}
