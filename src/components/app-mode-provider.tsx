"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { detectAppModeClient, persistAppModeClient } from "@/lib/app-mode";

// Whether the site is running inside the Capacitor iOS app. Defaults to false
// (website mode) so any component used outside the provider — including unit
// tests — renders the normal website experience.
const AppModeContext = createContext(false);

// Provides the app-mode flag to the whole tree. The root layout reads the
// `pmf_app` cookie SERVER-SIDE and passes it as `initialIsAppMode`, so SSR and
// the first client render agree (no hydration mismatch, no layout flash) on any
// load after app mode has been persisted once.
//
// On the very first in-app load the cookie isn't set yet, so SSR starts in
// website mode; this effect then detects the `?pmfApp=1` flag / native runtime,
// persists app mode (cookie + localStorage), and flips the tree to app mode.
// Detection only ever UPGRADES to app mode — it never flips back — so a forced
// `initialIsAppMode` (e.g. in tests) stays put.
export function AppModeProvider({
  initialIsAppMode = false,
  children
}: {
  initialIsAppMode?: boolean;
  children: React.ReactNode;
}) {
  const [isAppMode, setIsAppMode] = useState(initialIsAppMode);

  useEffect(() => {
    if (isAppMode) return;

    if (detectAppModeClient()) {
      persistAppModeClient();
      setIsAppMode(true);
    }
  }, [isAppMode]);

  return <AppModeContext.Provider value={isAppMode}>{children}</AppModeContext.Provider>;
}

// SSR-safe: returns the same value the server rendered with (via the provider's
// initial value), so components can branch website vs app from the first paint.
export function useIsAppMode() {
  return useContext(AppModeContext);
}
