"use client";

import { useEffect, useState } from "react";
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
// renders children verbatim with NO wrapper, NO overlay, and NO native calls —
// the site is completely unaffected. The localStorage pref defaults OFF, so even
// in the app nothing locks until the user opts in from the More page.
export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const isAppMode = useIsAppMode();
  const [locked, setLocked] = useState(false);

  // Lock on initial load when the pref is on (app mode only).
  useEffect(() => {
    if (!isAppMode) return;
    if (isAppLockEnabled()) setLocked(true);
  }, [isAppMode]);

  // Lock again whenever the app returns to the foreground (app mode only).
  // `onAppResume` is a no-op outside the native runtime, so this never fires on
  // web. The unsubscribe is returned for cleanup.
  useEffect(() => {
    if (!isAppMode) return;
    return onAppResume(() => {
      if (isAppLockEnabled()) setLocked(true);
    });
  }, [isAppMode]);

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
      {locked ? <LockScreen onUnlock={() => setLocked(false)} /> : null}
    </>
  );
}
