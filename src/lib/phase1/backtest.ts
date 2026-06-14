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

// The per-holding dollar value series over the basket's timeline, for the
// holdings that made it into the basket. `values` is aligned 1:1 with the
// portfolio series dates, so it reuses exactly the closes the basket summed —
// trackable: units × close; proxy: currentValue × close/latestClose. The auto
// analysis ranks these without recomputing anything.
export type BacktestHoldingValueSeries = {
  id: string;
  name: string;
  symbol: string;
  kind: "trackable" | "proxy";
  values: number[];
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
  // Per-holding value series for every included holding, aligned to `series`.
  // Reused by the auto analysis to rank contributors/drags/drawdowns.
  holdingSeries: BacktestHoldingValueSeries[];
  // No price data at all — either a bogus/non-ticker "symbol" or a real ticker
  // the provider returned nothing for. The reason distinguishes the two.
  skipped: BacktestSkippedHolding[];
  // Real tickers WITH data, but not enough to span the backtest window. Kept
  // separate so one short-history holding can't shrink the window for everyone;
  // these are reported (and can later be modeled via a proxy).
  insufficientHistory: BacktestSkippedHolding[];
  // Leveraged/inverse/volatility products (e.g. UVXY) whose repeated REVERSE
  // splits balloon the split-adjusted price as you go back in time. Today's
  // share count × that huge historical price inflates the basket by orders of
  // magnitude, so they're excluded rather than allowed to distort the curve.
  excludedDistorted: BacktestSkippedHolding[];
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
export const REVERSE_SPLIT_REASON =
  "Excluded — leveraged/volatility product (history not meaningful to backtest).";

// A holding's split-adjusted price is "distorted" when its EARLIEST in-window
// close towers over its LATEST by this factor. A genuinely appreciating stock
// has earliest << latest; even a badly declined normal stock rarely loses 98%
// of its value. Only repeatedly reverse-split decaying products (UVXY and
// kin) push the adjusted price this far, so a conservative 50× threshold
// catches them without ever flagging a real holding.
export const REVERSE_SPLIT_RATIO_THRESHOLD = 50;

// Detect the reverse-split/decay signature from an already month-indexed series:
// earliest close > THRESHOLD × latest close. Needs at least two months and a
// positive latest close to be meaningful.
export function isReverseSplitDistorted(indexed: Map<string, number>): boolean {
  if (indexed.size < 2) return false;

  const months = [...indexed.keys()].sort();
  const earliest = indexed.get(months[0]);
  const latest = indexed.get(months[months.length - 1]);

  if (!earliest || !latest || latest <= 0) return false;

  return earliest > REVERSE_SPLIT_RATIO_THRESHOLD * latest;
}

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

// The default window used when a custom range is missing or invalid, and the
// initial preset shown in the UI.
export const DEFAULT_WINDOW_YEARS = 10;

// How a user has chosen to bound the backtest. A preset of `null` years means
// "Max" — the full available history. A custom range overrides any preset.
export type BacktestWindowSelection =
  | { kind: "preset"; years: number | null }
  | { kind: "custom"; from: string; to: string };

export type BacktestWindow = { fromMonth: string; toMonth: string };

// Subtract a whole number of years from a YYYY-MM key, keeping the month.
export function subtractYearsMonth(monthKey: string, years: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${year - years}-${String(month).padStart(2, "0")}`;
}

// Accept a month picker value (YYYY-MM) and return a normalized key, or null if
// the value is empty/malformed. Month component must be 01–12.
export function normalizeMonthInput(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${match[1]}-${match[2]}`;
}

// Clamp a YYYY-MM key into the inclusive [min, max] range (string compare is
// chronological for zero-padded month keys).
export function clampMonth(month: string, min: string, max: string): string {
  if (month < min) return min;
  if (month > max) return max;
  return month;
}

// The earliest and latest calendar month present across every symbol's series,
// used to clamp custom ranges and anchor presets. Null when nothing is loaded.
export function getSeriesMonthBounds(
  series: MonthlySeriesBySymbol
): { minMonth: string; maxMonth: string } | null {
  let minMonth: string | null = null;
  let maxMonth: string | null = null;

  for (const points of Object.values(series)) {
    if (!points) continue;
    for (const point of points) {
      if (!point?.date) continue;
      const month = toMonthKey(point.date);
      if (minMonth === null || month < minMonth) minMonth = month;
      if (maxMonth === null || month > maxMonth) maxMonth = month;
    }
  }

  if (minMonth === null || maxMonth === null) return null;
  return { minMonth, maxMonth };
}

// Resolve a user's window selection against the available data bounds. Presets
// count back from the latest available month (clamped to the earliest); "Max"
// (years === null) spans the whole range. A custom range is validated: missing
// or malformed endpoints, or from >= to after clamping, fall back to the default
// preset so the backtest always has a sane window. Returns null with no bounds.
export function resolveBacktestWindow(
  bounds: { minMonth: string; maxMonth: string } | null,
  selection: BacktestWindowSelection
): BacktestWindow | null {
  if (!bounds) return null;
  const { minMonth, maxMonth } = bounds;

  const presetWindow = (years: number | null): BacktestWindow => ({
    fromMonth:
      years === null
        ? minMonth
        : clampMonth(subtractYearsMonth(maxMonth, years), minMonth, maxMonth),
    toMonth: maxMonth
  });

  if (selection.kind === "preset") {
    return presetWindow(selection.years);
  }

  const from = normalizeMonthInput(selection.from);
  const to = normalizeMonthInput(selection.to);
  if (!from || !to) return presetWindow(DEFAULT_WINDOW_YEARS);

  const clampedFrom = clampMonth(from, minMonth, maxMonth);
  const clampedTo = clampMonth(to, minMonth, maxMonth);
  if (clampedFrom >= clampedTo) return presetWindow(DEFAULT_WINDOW_YEARS);

  return { fromMonth: clampedFrom, toMonth: clampedTo };
}

// Slice each symbol's monthly series to the inclusive [fromMonth, toMonth]
// window. Pure and lossless of the original — the full series is fetched once
// and re-sliced as the user changes the window, so no refetch is needed.
export function sliceSeriesToWindow(
  series: MonthlySeriesBySymbol,
  window: BacktestWindow
): MonthlySeriesBySymbol {
  const sliced: MonthlySeriesBySymbol = {};

  for (const [symbol, points] of Object.entries(series)) {
    sliced[symbol] = (points ?? []).filter((point) => {
      if (!point?.date) return false;
      const month = toMonthKey(point.date);
      return month >= window.fromMonth && month <= window.toMonth;
    });
  }

  return sliced;
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
  const excludedDistorted: BacktestSkippedHolding[] = [];
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

    // Drop reverse-split decaying products BEFORE the anchor step — otherwise a
    // long-history one like UVXY would define the window and balloon the start.
    if (isReverseSplitDistorted(indexed)) {
      excludedDistorted.push({
        id: holding.id,
        name: holding.name,
        symbol: holding.symbol,
        reason: REVERSE_SPLIT_REASON
      });
      continue;
    }

    const firstMonth = [...indexed.keys()].sort()[0];
    indexedHoldings.push({ holding, indexed, firstMonth });
  }

  if (indexedHoldings.length === 0) {
    return {
      series: [],
      included,
      holdingSeries: [],
      skipped,
      insufficientHistory,
      excludedDistorted
    };
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

  // One dollar-value series per included holding, computed exactly the way the
  // basket sums them so the analysis can't drift from the chart.
  const holdingValueOf = (holding: BacktestHoldingInput, closes: number[]) => {
    const latestClose = closes[closes.length - 1];
    return closes.map((close) =>
      holding.kind === "trackable"
        ? holding.units * close
        : holding.currentValue * (close / latestClose)
    );
  };

  const holdingSeries: BacktestHoldingValueSeries[] = contributors.map(
    ({ holding, closes }) => ({
      id: holding.id,
      name: holding.name,
      symbol: holding.symbol,
      kind: holding.kind,
      values: holdingValueOf(holding, closes)
    })
  );

  const series = timeline.map((monthKey, index) => {
    const value = holdingSeries.reduce(
      (total, holding) => total + holding.values[index],
      0
    );

    return { date: monthKey, value };
  });

  return { series, included, holdingSeries, skipped, insufficientHistory, excludedDistorted };
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

// Per-holding performance over the window, derived from its value series.
export type BacktestHoldingPerformance = {
  id: string;
  name: string;
  symbol: string;
  kind: "trackable" | "proxy";
  startValue: number;
  endValue: number;
  dollarChange: number;
  // Fraction (endValue/startValue − 1); 0 when startValue is 0 (divide-by-zero
  // guard) so a zero-cost line never ranks on an infinite return.
  returnPct: number;
  // Worst peak-to-trough of THIS holding's value series, as a positive percent.
  maxDrawdownPercent: number;
};

// The three short rankings shown under the backtest results.
export type BacktestAnalysis = {
  topContributors: BacktestHoldingPerformance[];
  biggestDrags: BacktestHoldingPerformance[];
  mostStressful: BacktestHoldingPerformance[];
};

// Reduce each included holding's value series to start/end/change/return and its
// own max drawdown. Ranked per holding line — duplicate symbols across accounts
// stay separate, matching how the basket sums contributors.
export function computeHoldingPerformances(
  holdingSeries: BacktestHoldingValueSeries[]
): BacktestHoldingPerformance[] {
  return holdingSeries.map((holding) => {
    const startValue = holding.values[0] ?? 0;
    const endValue = holding.values[holding.values.length - 1] ?? 0;
    const dollarChange = endValue - startValue;

    return {
      id: holding.id,
      name: holding.name,
      symbol: holding.symbol,
      kind: holding.kind,
      startValue,
      endValue,
      dollarChange,
      returnPct: startValue > 0 ? dollarChange / startValue : 0,
      maxDrawdownPercent: computeMaxDrawdown(holding.values) * 100
    };
  });
}

// How many holdings each ranking list shows at most.
export const ANALYSIS_TOP_N = 3;

// Build the three rankings: gains/drags by DOLLAR change (contribution to the
// basket), stress by DRAWDOWN magnitude. Top contributors are the largest
// dollar gains; biggest drags are the largest dollar declines (or smallest
// gains if everything rose); most stressful are the deepest peak-to-trough.
export function computeBacktestAnalysis(
  holdingSeries: BacktestHoldingValueSeries[]
): BacktestAnalysis {
  const performances = computeHoldingPerformances(holdingSeries);

  const byDollarDesc = [...performances].sort((a, b) => b.dollarChange - a.dollarChange);
  const byDollarAsc = [...performances].sort((a, b) => a.dollarChange - b.dollarChange);
  const byDrawdownDesc = [...performances].sort(
    (a, b) => b.maxDrawdownPercent - a.maxDrawdownPercent
  );

  return {
    topContributors: byDollarDesc.slice(0, ANALYSIS_TOP_N),
    biggestDrags: byDollarAsc.slice(0, ANALYSIS_TOP_N),
    mostStressful: byDrawdownDesc.slice(0, ANALYSIS_TOP_N)
  };
}
