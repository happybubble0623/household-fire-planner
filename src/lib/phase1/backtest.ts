// Core math for the 10-year portfolio backtest. Pure, client-side functions
// that turn fetched monthly EOD price series into a comparable portfolio value
// curve plus benchmark curves. The simulation assumes you held TODAY's
// quantities for the whole window (a basket, not a transaction history).

export type MonthlyPricePoint = { date: string; close: number };
export type MonthlySeriesBySymbol = Record<string, MonthlyPricePoint[]>;

// A trackable holding contributes units × monthly close. A proxy holding has no
// usable history of its own, so it is modeled total-value based off a proxy
// ticker: value scales with the proxy's price relative to its latest close.
export type BacktestHoldingInput =
  | { id: string; name: string; kind: "trackable"; symbol: string; units: number }
  | { id: string; name: string; kind: "proxy"; symbol: string; currentValue: number };

export type BacktestPoint = { date: string; value: number };

export type BacktestIncludedHolding = {
  id: string;
  name: string;
  symbol: string;
  kind: "trackable" | "proxy";
};

export type BacktestSkippedHolding = {
  id: string;
  name: string;
  symbol: string;
  reason: string;
};

export type PortfolioSeriesResult = {
  series: BacktestPoint[];
  included: BacktestIncludedHolding[];
  // No price data at all — either a bogus/non-ticker "symbol" or a real ticker
  // the provider returned nothing for. The reason distinguishes the two.
  skipped: BacktestSkippedHolding[];
  // Real tickers WITH data, but not enough to span the backtest window. Kept
  // separate so one short-history holding can't shrink the window for everyone;
  // these are reported (and can later be modeled via a proxy).
  insufficientHistory: BacktestSkippedHolding[];
};

export type BacktestReturnStats = {
  startValue: number;
  endValue: number;
  totalReturnPercent: number;
  cagrPercent: number;
  maxDrawdownPercent: number;
};

export const NO_HISTORY_REASON = "No monthly price history was returned for this symbol.";
export const NO_TICKER_REASON = "No recognizable ticker symbol to look up.";
export const INSUFFICIENT_HISTORY_REASON =
  "Too little price history to cover the backtest window.";

// A symbol we can plausibly look up: letters/digits with an optional exchange or
// crypto suffix, no spaces. Filters out fund descriptions stored in the symbol
// field ("inst 500", "large cap") so they are reported as "no ticker" rather
// than masquerading as real tickers with no history.
export function isLikelyTicker(symbol: string | null | undefined): boolean {
  if (!symbol) return false;
  const normalized = symbol.trim().toUpperCase();
  if (!normalized || normalized.includes(" ")) return false;
  return /^[A-Z][A-Z0-9.-]{0,11}$/.test(normalized);
}

export function toMonthKey(date: string) {
  return date.slice(0, 7);
}

export function monthsBetween(startMonthKey: string, endMonthKey: string) {
  const [startYear, startMonth] = startMonthKey.split("-").map(Number);
  const [endYear, endMonth] = endMonthKey.split("-").map(Number);

  return (endYear - startYear) * 12 + (endMonth - startMonth);
}

// Collapse a series to one close per calendar month, keyed by YYYY-MM. Positive
// closes only; later points override earlier ones within the same month.
export function indexSeriesByMonth(series: MonthlyPricePoint[] | undefined) {
  const byMonth = new Map<string, number>();

  if (!series) return byMonth;

  for (const point of series) {
    if (!point?.date || !Number.isFinite(point.close) || point.close <= 0) {
      continue;
    }

    byMonth.set(toMonthKey(point.date), point.close);
  }

  return byMonth;
}

// Build the portfolio value series from in-scope holdings and fetched series.
//
// Window policy: anchor the timeline to the holding(s) with the LONGEST history
// (the fetch already clips to the requested range), then sum only the holdings
// that cover that full window. Holdings with too little history are reported
// separately rather than shrinking the window for everyone via an intersection.
export function computePortfolioSeries(
  holdings: BacktestHoldingInput[],
  seriesBySymbol: MonthlySeriesBySymbol
): PortfolioSeriesResult {
  const included: BacktestIncludedHolding[] = [];
  const skipped: BacktestSkippedHolding[] = [];
  const insufficientHistory: BacktestSkippedHolding[] = [];
  const indexedHoldings: {
    holding: BacktestHoldingInput;
    indexed: Map<string, number>;
    firstMonth: string;
  }[] = [];

  for (const holding of holdings) {
    const indexed = indexSeriesByMonth(seriesBySymbol[holding.symbol]);

    if (indexed.size === 0) {
      skipped.push({
        id: holding.id,
        name: holding.name,
        symbol: holding.symbol,
        // A non-ticker "symbol" (e.g. a fund description) gets a distinct reason
        // from a real ticker the provider simply returned nothing for.
        reason: isLikelyTicker(holding.symbol) ? NO_HISTORY_REASON : NO_TICKER_REASON
      });
      continue;
    }

    const firstMonth = [...indexed.keys()].sort()[0];
    indexedHoldings.push({ holding, indexed, firstMonth });
  }

  if (indexedHoldings.length === 0) {
    return { series: [], included, skipped, insufficientHistory };
  }

  // The anchor is the holding with the most monthly points; its months define
  // the window. A single short holding can no longer collapse the timeline.
  const anchor = indexedHoldings.reduce((longest, entry) =>
    entry.indexed.size > longest.indexed.size ? entry : longest
  );
  const timeline = [...anchor.indexed.keys()].sort();
  const windowStart = timeline[0];

  const contributors: { holding: BacktestHoldingInput; closes: number[] }[] = [];
  for (const entry of indexedHoldings) {
    // A holding covers the window if its history reaches back to the start.
    if (entry.firstMonth > windowStart) {
      insufficientHistory.push({
        id: entry.holding.id,
        name: entry.holding.name,
        symbol: entry.holding.symbol,
        reason: INSUFFICIENT_HISTORY_REASON
      });
      continue;
    }

    // Forward-fill across any stray gaps so a single missing month doesn't drop
    // an otherwise-full holding.
    let lastClose = entry.indexed.get(windowStart) as number;
    const closes = timeline.map((monthKey) => {
      const close = entry.indexed.get(monthKey);
      if (close !== undefined) lastClose = close;
      return lastClose;
    });

    contributors.push({ holding: entry.holding, closes });
    included.push({
      id: entry.holding.id,
      name: entry.holding.name,
      symbol: entry.holding.symbol,
      kind: entry.holding.kind
    });
  }

  const series = timeline.map((monthKey, index) => {
    const value = contributors.reduce((total, { holding, closes }) => {
      const close = closes[index];

      if (holding.kind === "trackable") {
        return total + holding.units * close;
      }

      const latestClose = closes[closes.length - 1];
      return total + holding.currentValue * (close / latestClose);
    }, 0);

    return { date: monthKey, value };
  });

  return { series, included, skipped, insufficientHistory };
}

// Normalize a benchmark to the portfolio's starting dollars so both curves show
// the growth of the same initial investment. Returns null when the benchmark
// lacks a price at any point on the portfolio timeline (caller skips it).
export function normalizeBenchmarkSeries(
  benchmarkSeries: MonthlyPricePoint[] | undefined,
  timeline: string[],
  startValue: number
): BacktestPoint[] | null {
  if (timeline.length === 0) return null;

  const indexed = indexSeriesByMonth(benchmarkSeries);
  const baseClose = indexed.get(timeline[0]);

  if (!baseClose) return null;

  const points: BacktestPoint[] = [];

  for (const monthKey of timeline) {
    const close = indexed.get(monthKey);
    if (!close) return null;

    points.push({ date: monthKey, value: startValue * (close / baseClose) });
  }

  return points;
}

// Worst peak-to-trough decline over the series, as a positive fraction (0–1).
export function computeMaxDrawdown(values: number[]) {
  if (values.length === 0) return 0;

  let peak = values[0];
  let maxDrawdown = 0;

  for (const value of values) {
    if (value > peak) peak = value;
    const drawdown = peak > 0 ? (peak - value) / peak : 0;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }

  return maxDrawdown;
}

// Compound annual growth rate as a percentage, derived from the series endpoints
// and the elapsed months on the timeline.
export function computeCagrPercent(startValue: number, endValue: number, years: number) {
  if (startValue <= 0 || endValue <= 0 || years <= 0) return 0;
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
}

export function computeReturnStats(series: BacktestPoint[]): BacktestReturnStats {
  if (series.length === 0) {
    return {
      startValue: 0,
      endValue: 0,
      totalReturnPercent: 0,
      cagrPercent: 0,
      maxDrawdownPercent: 0
    };
  }

  const startValue = series[0].value;
  const endValue = series[series.length - 1].value;
  const years = monthsBetween(series[0].date, series[series.length - 1].date) / 12;
  const totalReturnPercent = startValue > 0 ? (endValue / startValue - 1) * 100 : 0;

  return {
    startValue,
    endValue,
    totalReturnPercent,
    cagrPercent: computeCagrPercent(startValue, endValue, years),
    maxDrawdownPercent: computeMaxDrawdown(series.map((point) => point.value)) * 100
  };
}
