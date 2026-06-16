"use client";

import { createContext, useContext } from "react";
import { maskCurrency } from "@/lib/phase1/mask-currency";

// Per-session "Hide values" state for the Portfolio tracker, scoped to the
// portfolio component tree via context so the deeply nested sub-panels
// (overview stats, holdings table, mobile cards, lens breakdown, backtest)
// can mask currency without threading a prop through every layer. The value
// is plain React state owned by PortfolioPanel — NOT persisted or synced, so
// it resets to "shown" on reload. Applies on both website and app.
const PortfolioValuesHiddenContext = createContext(false);

export function PortfolioPrivacyProvider({
  hidden,
  children
}: {
  hidden: boolean;
  children: React.ReactNode;
}) {
  return (
    <PortfolioValuesHiddenContext.Provider value={hidden}>
      {children}
    </PortfolioValuesHiddenContext.Provider>
  );
}

export function usePortfolioValuesHidden(): boolean {
  return useContext(PortfolioValuesHiddenContext);
}

// Returns a masker that conceals an already-formatted currency string when the
// "Hide values" toggle is on. Use at currency display sites inside the
// portfolio tree; percentages and other text must NOT be passed through it.
export function useMaskCurrency(): (formatted: string) => string {
  const hidden = usePortfolioValuesHidden();
  return (formatted: string) => maskCurrency(formatted, hidden);
}
