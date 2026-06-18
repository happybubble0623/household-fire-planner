"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useIsAppMode } from "@/components/app-mode-provider";
import { isAppLockEnabled, onAppResume } from "@/lib/app-lock";
import { LockScreen } from "./lock-screen";

// Wraps the whole app and, ONLY inside the native app with App Lock enabled,
// shows the Face ID lock screen:
//   - on initial app load, and
//   - every time the app returns to the foreground (resume).
// While locked, the app content is blurred + made inert behind the opaque lock
// overlay until the user authenticates.
//
// On the website (desktop AND mobile web) `useIsAppMode()` is false, so this
// renders children verbatim with NO wrapper, NO overlay, and NO native calls.
export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const isAppMode = useIsAppMode();
  const [locked, setLocked] = useState(false);

  // Mirror `locked` into a ref so the resume listener (registered once) always
  // reads the current value without having to resubscribe.
  const lockedRef = useRef(false);
  useEffect(() => {
    lockedRef.current = locked;
  }, [locked]);

  // THE LOOP FIX.
  // Presenting the Face ID / Touch ID sheet makes iOS resign the app "active",
  // and dismissing it makes the app "active" again — which fires
  // `appStateChange(active)` exactly like a real foreground resume. Without a
  // guard, that event re-locks the app the instant after a successful unlock,
  // so the lock screen re-mounts and re-prompts Face ID forever.
  // We ignore any resume that lands inside a short window after an unlock.
  const suppressResumeUntilRef = useRef(0);

  // Lock on initial load when the pref is on (app mode only).
  useEffect(() => {
    if (!isAppMode) return;
    if (isAppLockEnabled()) setLocked(true);
  }, [isAppMode]);

  // Lock again whenever the app genuinely returns to the foreground (app mode
  // only). `onAppResume` is a no-op outside the native runtime.
  useEffect(() => {
    if (!isAppMode) return;
    return onAppResume(() => {
      // 1) Ignore the transient resume the biometric sheet fires as it closes.
      if (Date.now() < suppressResumeUntilRef.current) return;
      // 2) Already showing the lock screen — don't restart the prompt.
      if (lockedRef.current) return;
      if (isAppLockEnabled()) setLocked(true);
    });
  }, [isAppMode]);

  // Stable identity so the lock screen's auto-prompt effect doesn't re-fire on
  // unrelated re-renders, and so unlocking opens a "suppress resume" window that
  // swallows the sheet-dismiss event described above.
  const handleUnlock = useCallback(() => {
    suppressResumeUntilRef.current = Date.now() + 1500;
    setLocked(false);
  }, []);

  // Website: render children exactly as before — no wrapper div, no overlay.
  if (!isAppMode) return <>{children}</>;

  return (
    <>
      <div
        aria-hidden={locked || undefined}
        className={locked ? "pointer-events-none select-none blur-md" : undefined}
      >
        {children}
      </div>
      {locked ? <LockScreen onUnlock={handleUnlock} /> : null}
    </>
  );
}
