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
  skipped: BacktestSkippedHolding[];
};

export type BacktestReturnStats = {
  startValue: number;
  endValue: number;
  totalReturnPercent: number;
  cagrPercent: number;
  maxDrawdownPercent: number;
};

const NO_HISTORY_REASON = "No monthly price history was returned for this symbol.";

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

// The month-keys shared by every indexed series, sorted ascending. The backtest
// can only run over the window in which all in-scope holdings have prices, so we
// intersect — a holding with a shorter history shortens the effective window.
function intersectMonthKeys(indexedSeriesList: Map<string, number>[]) {
  if (indexedSeriesList.length === 0) return [];

  const [first, ...rest] = indexedSeriesList;
  const shared = [...first.keys()].filter((monthKey) =>
    rest.every((indexed) => indexed.has(monthKey))
  );

  return shared.sort();
}

// Build the portfolio value series from in-scope holdings and fetched series.
// Holdings whose symbol has no history are skipped (and reported, not summed).
export function computePortfolioSeries(
  holdings: BacktestHoldingInput[],
  seriesBySymbol: MonthlySeriesBySymbol
): PortfolioSeriesResult {
  const included: BacktestIncludedHolding[] = [];
  const skipped: BacktestSkippedHolding[] = [];
  const indexedHoldings: { holding: BacktestHoldingInput; indexed: Map<string, number> }[] = [];

  for (const holding of holdings) {
    const indexed = indexSeriesByMonth(seriesBySymbol[holding.symbol]);

    if (indexed.size === 0) {
      skipped.push({
        id: holding.id,
        name: holding.name,
        symbol: holding.symbol,
        reason: NO_HISTORY_REASON
      });
      continue;
    }

    indexedHoldings.push({ holding, indexed });
    included.push({
      id: holding.id,
      name: holding.name,
      symbol: holding.symbol,
      kind: holding.kind
    });
  }

  const timeline = intersectMonthKeys(indexedHoldings.map((entry) => entry.indexed));

  if (timeline.length === 0) {
    return { series: [], included, skipped };
  }

  const lastMonthKey = timeline[timeline.length - 1];
  const series = timeline.map((monthKey) => {
    const value = indexedHoldings.reduce((total, { holding, indexed }) => {
      const close = indexed.get(monthKey) as number;

      if (holding.kind === "trackable") {
        return total + holding.units * close;
      }

      const latestClose = indexed.get(lastMonthKey) as number;
      return total + holding.currentValue * (close / latestClose);
    }, 0);

    return { date: monthKey, value };
  });

  return { series, included, skipped };
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
