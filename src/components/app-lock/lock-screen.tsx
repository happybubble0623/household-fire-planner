"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { authenticate } from "@/lib/app-lock";

// Full-screen, opaque, Plan My FIRE-branded overlay that blocks all app content
// until the user passes Face ID / Touch ID. Auto-prompts once when shown; if the
// prompt is cancelled or fails, an "Unlock" button lets the user retry. On a
// successful unlock it calls `onUnlock` to dismiss itself.
//
// Rendered ONLY by AppLockProvider, and only inside the native app — see that
// component for the app-mode gate. The website never mounts this.
export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [busy, setBusy] = useState(false);
  // Guard against the StrictMode double-invoke / re-render firing two prompts.
  const promptingRef = useRef(false);

  const runUnlock = useCallback(async () => {
    if (promptingRef.current) return;
    promptingRef.current = true;
    setBusy(true);
    const ok = await authenticate();
    setBusy(false);
    promptingRef.current = false;
    if (ok) onUnlock();
  }, [onUnlock]);

  // Auto-prompt as soon as the lock screen appears.
  useEffect(() => {
    void runUnlock();
  }, [runUnlock]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="App locked"
      // Opaque, fixed full-screen cover above all app chrome (the tab bar sits at
      // z-20 / the header at z-20, dropdowns at z-30). Sits above them all.
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white px-8 text-center"
    >
      {/* Plan My FIRE brand mark — chevron + bar on the brand-green tile. */}
      <span
        aria-hidden="true"
        className="grid h-16 w-16 place-items-center rounded-2xl bg-[#15803d]"
      >
        <svg viewBox="0 0 64 64" className="h-9 w-9" role="img" aria-label="Plan My FIRE logo">
          <path
            d="M16 40 L32 18 L48 40"
            fill="none"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M20 48 L44 48"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <div className="space-y-1.5">
        <p className="text-lg font-bold tracking-tight text-gray-900">
          Plan My <span className="text-[#15803d]">FIRE</span> is locked
        </p>
        <p className="text-[13px] leading-relaxed text-gray-600">
          Unlock with Face ID to continue.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void runUnlock()}
        disabled={busy}
        className="inline-flex items-center justify-center rounded-full bg-[#15803d] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors duration-150 hover:bg-[#166534] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803d] focus-visible:ring-offset-2 disabled:opacity-60"
      >
        {busy ? "Unlocking…" : "Unlock"}
      </button>
    </div>
  );
}
