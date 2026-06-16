// Privacy mask for the Portfolio tracker's "Hide values" toggle. When hidden is
// true, any already-formatted DOLLAR/currency string is replaced with a fixed
// dot mask so the figure is concealed but the layout (cell, row, stat) stays put.
// Percentages, names, tickers, and dates are NOT routed through this — only
// currency call sites are, so those stay visible when values are hidden.
export const MASKED_CURRENCY = "••••";

export function maskCurrency(formatted: string, hidden: boolean): string {
  return hidden ? MASKED_CURRENCY : formatted;
}
