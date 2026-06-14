import { describe, expect, it } from "vitest";
import {
  clampMonth,
  computeCagrPercent,
  computeMaxDrawdown,
  computePortfolioSeries,
  computeReturnStats,
  getSeriesMonthBounds,
  indexSeriesByMonth,
  isLikelyTicker,
  isReverseSplitDistorted,
  monthsBetween,
  NO_HISTORY_REASON,
  NO_TICKER_REASON,
  normalizeBenchmarkSeries,
  normalizeMonthInput,
  resolveBacktestWindow,
  REVERSE_SPLIT_REASON,
  sliceSeriesToWindow,
  subtractYearsMonth
} from "@/lib/phase1/backtest";
import type { BacktestHoldingInput, MonthlySeriesBySymbol } from "@/lib/phase1/backtest";

const SERIES: MonthlySeriesBySymbol = {
  // 12 monthly points, Jan 2025 → Dec 2025.
  AAA: [
    { date: "2025-01-31", close: 100 },
    { date: "2025-02-28", close: 110 },
    { date: "2025-03-31", close: 90 },
    { date: "2025-04-30", close: 120 }
  ],
  BBB: [
    { date: "2025-01-31", close: 50 },
    { date: "2025-02-28", close: 55 },
    { date: "2025-03-31", close: 60 },
    { date: "2025-04-30", close: 50 }
  ],
  // Shorter history — only overlaps from March.
  SHORT: [
    { date: "2025-03-31", close: 10 },
    { date: "2025-04-30", close: 20 }
  ],
  SPY: [
    { date: "2025-01-31", close: 400 },
    { date: "2025-02-28", close: 420 },
    { date: "2025-03-31", close: 380 },
    { date: "2025-04-30", close: 440 }
  ],
  // Reverse-split decay signature (UVXY-like): the split-adjusted close balloons
  // going back in time — earliest is ~1000× the latest — then collapses.
  DECAY: [
    { date: "2025-01-31", close: 50000 },
    { date: "2025-02-28", close: 5000 },
    { date: "2025-03-31", close: 500 },
    { date: "2025-04-30", close: 50 }
  ]
};

describe("month helpers", () => {
  it("derives a YYYY-MM key and month spans", () => {
    expect(monthsBetween("2025-01", "2025-04")).toBe(3);
    expect(monthsBetween("2020-06", "2030-06")).toBe(120);
  });

  it("indexes one positive close per calendar month", () => {
    const indexed = indexSeriesByMonth([
      { date: "2025-01-15", close: 0 },
      { date: "2025-01-31", close: 100 },
      { date: "2025-02-28", close: -5 }
    ]);

    expect(indexed.get("2025-01")).toBe(100);
    expect(indexed.has("2025-02")).toBe(false);
  });
});

describe("window helpers", () => {
  it("subtracts whole years, keeping the month and zero-padding", () => {
    expect(subtractYearsMonth("2025-04", 10)).toBe("2015-04");
    expect(subtractYearsMonth("2025-04", 1)).toBe("2024-04");
    expect(subtractYearsMonth("2025-09", 3)).toBe("2022-09");
  });

  it("normalizes month-picker values and rejects malformed ones", () => {
    expect(normalizeMonthInput("2025-04")).toBe("2025-04");
    expect(normalizeMonthInput(" 2025-04 ")).toBe("2025-04");
    expect(normalizeMonthInput("2025-13")).toBeNull();
    expect(normalizeMonthInput("2025-00")).toBeNull();
    expect(normalizeMonthInput("2025-4")).toBeNull();
    expect(normalizeMonthInput("")).toBeNull();
    expect(normalizeMonthInput(undefined)).toBeNull();
  });

  it("clamps a month into the inclusive range", () => {
    expect(clampMonth("2010-01", "2015-01", "2025-01")).toBe("2015-01");
    expect(clampMonth("2030-01", "2015-01", "2025-01")).toBe("2025-01");
    expect(clampMonth("2020-06", "2015-01", "2025-01")).toBe("2020-06");
  });

  it("finds the earliest and latest month across every symbol", () => {
    expect(getSeriesMonthBounds(SERIES)).toEqual({
      minMonth: "2025-01",
      maxMonth: "2025-04"
    });
    expect(getSeriesMonthBounds({})).toBeNull();
    expect(getSeriesMonthBounds({ X: [] })).toBeNull();
  });
});

describe("sliceSeriesToWindow", () => {
  it("keeps only points within the inclusive month window", () => {
    const sliced = sliceSeriesToWindow(SERIES, { fromMonth: "2025-02", toMonth: "2025-03" });

    expect(sliced.AAA.map((point) => point.date)).toEqual(["2025-02-28", "2025-03-31"]);
    expect(sliced.SHORT.map((point) => point.date)).toEqual(["2025-03-31"]);
  });

  it("preserves every symbol key, even when a slice is empty", () => {
    const sliced = sliceSeriesToWindow(SERIES, { fromMonth: "2030-01", toMonth: "2030-12" });

    expect(Object.keys(sliced).sort()).toEqual(Object.keys(SERIES).sort());
    expect(sliced.AAA).toEqual([]);
  });

  it("drives a shorter-window portfolio computation by slicing first", () => {
    const window = { fromMonth: "2025-03", toMonth: "2025-04" };
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 1 }
    ];

    const { series } = computePortfolioSeries(
      holdings,
      sliceSeriesToWindow(SERIES, window)
    );

    // Only March/April survive the slice: AAA = 90, 120.
    expect(series.map((point) => point.date)).toEqual(["2025-03", "2025-04"]);
    expect(series.map((point) => point.value)).toEqual([90, 120]);
  });
});

describe("resolveBacktestWindow", () => {
  const bounds = { minMonth: "2010-04", maxMonth: "2025-04" };

  it("returns null without bounds", () => {
    expect(resolveBacktestWindow(null, { kind: "preset", years: 5 })).toBeNull();
  });

  it("counts a preset back from the latest available month", () => {
    expect(resolveBacktestWindow(bounds, { kind: "preset", years: 5 })).toEqual({
      fromMonth: "2020-04",
      toMonth: "2025-04"
    });
  });

  it("clamps a preset longer than the available history to the earliest month", () => {
    expect(resolveBacktestWindow(bounds, { kind: "preset", years: 30 })).toEqual({
      fromMonth: "2010-04",
      toMonth: "2025-04"
    });
  });

  it("spans the full range for the Max preset (years null)", () => {
    expect(resolveBacktestWindow(bounds, { kind: "preset", years: null })).toEqual({
      fromMonth: "2010-04",
      toMonth: "2025-04"
    });
  });

  it("honors a valid custom range", () => {
    expect(
      resolveBacktestWindow(bounds, { kind: "custom", from: "2018-01", to: "2022-12" })
    ).toEqual({ fromMonth: "2018-01", toMonth: "2022-12" });
  });

  it("clamps custom endpoints to the available data bounds", () => {
    expect(
      resolveBacktestWindow(bounds, { kind: "custom", from: "2000-01", to: "2099-12" })
    ).toEqual({ fromMonth: "2010-04", toMonth: "2025-04" });
  });

  it("falls back to the default preset when custom is incomplete or inverted", () => {
    const defaultWindow = { fromMonth: "2015-04", toMonth: "2025-04" };
    expect(
      resolveBacktestWindow(bounds, { kind: "custom", from: "2018-01", to: "" })
    ).toEqual(defaultWindow);
    expect(
      resolveBacktestWindow(bounds, { kind: "custom", from: "garbage", to: "2022-01" })
    ).toEqual(defaultWindow);
    // from >= to after clamping is invalid → default.
    expect(
      resolveBacktestWindow(bounds, { kind: "custom", from: "2022-01", to: "2018-01" })
    ).toEqual(defaultWindow);
  });
});

describe("computePortfolioSeries", () => {
  it("sums units × monthly close for trackable holdings", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 2 },
      { id: "b", name: "Fund B", kind: "trackable", symbol: "BBB", units: 10 }
    ];

    const { series, included, skipped } = computePortfolioSeries(holdings, SERIES);

    expect(skipped).toHaveLength(0);
    expect(included).toHaveLength(2);
    // Jan: 2*100 + 10*50 = 700; Apr: 2*120 + 10*50 = 740.
    expect(series[0]).toEqual({ date: "2025-01", value: 700 });
    expect(series.at(-1)).toEqual({ date: "2025-04", value: 740 });
  });

  it("scales a proxy holding total-value based off its latest close", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "p", name: "Private REIT", kind: "proxy", symbol: "BBB", currentValue: 1000 }
    ];

    const { series } = computePortfolioSeries(holdings, SERIES);

    // Latest BBB close is 50; value[t] = 1000 * close[t]/50.
    expect(series[0]).toEqual({ date: "2025-01", value: 1000 }); // 50/50
    expect(series[1]).toEqual({ date: "2025-02", value: 1100 }); // 55/50
    expect(series.at(-1)).toEqual({ date: "2025-04", value: 1000 }); // ends at current value
  });

  it("skips a real ticker with no history and flags it as no-history", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 1 },
      { id: "z", name: "Mystery", kind: "trackable", symbol: "ZZZ", units: 1 }
    ];

    const { series, skipped, insufficientHistory } = computePortfolioSeries(holdings, SERIES);

    expect(skipped).toEqual([
      { id: "z", name: "Mystery", symbol: "ZZZ", reason: NO_HISTORY_REASON }
    ]);
    expect(insufficientHistory).toHaveLength(0);
    expect(series).toHaveLength(4);
  });

  it("distinguishes a non-ticker 'symbol' from a real ticker with no data", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 1 },
      { id: "j", name: "Inst 500 Index", kind: "trackable", symbol: "inst 500", units: 1 }
    ];

    const { skipped } = computePortfolioSeries(holdings, SERIES);

    expect(skipped).toEqual([
      { id: "j", name: "Inst 500 Index", symbol: "inst 500", reason: NO_TICKER_REASON }
    ]);
  });

  it("keeps the full window and excludes a shorter-history holding separately", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 1 },
      { id: "s", name: "Short", kind: "trackable", symbol: "SHORT", units: 1 }
    ];

    const { series, included, insufficientHistory } = computePortfolioSeries(holdings, SERIES);

    // Window stays AAA's full Jan→Apr range; SHORT does not collapse it.
    expect(series.map((point) => point.date)).toEqual([
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04"
    ]);
    // Portfolio is AAA alone: 100, 110, 90, 120.
    expect(series.map((point) => point.value)).toEqual([100, 110, 90, 120]);
    expect(included.map((holding) => holding.symbol)).toEqual(["AAA"]);
    expect(insufficientHistory).toEqual([
      { id: "s", name: "Short", symbol: "SHORT", reason: expect.any(String) }
    ]);
  });
});

describe("reverse-split distortion guard", () => {
  it("flags a series whose earliest close towers over its latest", () => {
    // earliest 50000 vs latest 50 → 1000×, well over the 50× threshold.
    expect(isReverseSplitDistorted(indexSeriesByMonth(SERIES.DECAY))).toBe(true);
  });

  it("does not flag a normal appreciating or mildly declining series", () => {
    // AAA appreciates (100 → 120); BBB ends flat (50 → 50). Neither is distorted.
    expect(isReverseSplitDistorted(indexSeriesByMonth(SERIES.AAA))).toBe(false);
    expect(isReverseSplitDistorted(indexSeriesByMonth(SERIES.BBB))).toBe(false);
  });

  it("needs at least two months and a positive latest close", () => {
    expect(isReverseSplitDistorted(indexSeriesByMonth(SERIES.SHORT))).toBe(false);
    expect(isReverseSplitDistorted(new Map([["2025-01", 9999]]))).toBe(false);
  });

  it("excludes a distorted holding from the basket without distorting the rest", () => {
    const holdings: BacktestHoldingInput[] = [
      { id: "a", name: "Fund A", kind: "trackable", symbol: "AAA", units: 1 },
      { id: "u", name: "ProShares Ultra VIX", kind: "trackable", symbol: "DECAY", units: 100 }
    ];

    const { series, included, excludedDistorted } = computePortfolioSeries(holdings, SERIES);

    // DECAY is excluded with the leveraged/volatility label; AAA carries on,
    // so the basket starts at AAA's real value (100), not the inflated millions.
    expect(excludedDistorted).toEqual([
      { id: "u", name: "ProShares Ultra VIX", symbol: "DECAY", reason: REVERSE_SPLIT_REASON }
    ]);
    expect(included.map((holding) => holding.symbol)).toEqual(["AAA"]);
    expect(series[0]).toEqual({ date: "2025-01", value: 100 });
    expect(series.at(-1)).toEqual({ date: "2025-04", value: 120 });
  });
});

describe("isLikelyTicker", () => {
  it("accepts ticker-shaped strings and rejects fund descriptions", () => {
    expect(isLikelyTicker("AAPL")).toBe(true);
    expect(isLikelyTicker("brk.b")).toBe(true);
    expect(isLikelyTicker("BTC-USD")).toBe(true);
    expect(isLikelyTicker("inst 500")).toBe(false);
    expect(isLikelyTicker("large cap")).toBe(false);
    expect(isLikelyTicker("")).toBe(false);
    expect(isLikelyTicker(undefined)).toBe(false);
  });
});

describe("normalizeBenchmarkSeries", () => {
  it("grows the portfolio's starting dollars at the benchmark's rate", () => {
    const timeline = ["2025-01", "2025-02", "2025-03", "2025-04"];
    const normalized = normalizeBenchmarkSeries(SERIES.SPY, timeline, 1000);

    expect(normalized).not.toBeNull();
    expect(normalized?.[0]).toEqual({ date: "2025-01", value: 1000 }); // base
    // 420/400 * 1000 = 1050.
    expect(normalized?.[1].value).toBeCloseTo(1050, 6);
    // 440/400 * 1000 = 1100.
    expect(normalized?.at(-1)?.value).toBeCloseTo(1100, 6);
  });

  it("returns null when the benchmark lacks a point on the timeline", () => {
    const timeline = ["2025-01", "2025-02", "2025-03", "2025-04"];
    expect(normalizeBenchmarkSeries(SERIES.SHORT, timeline, 1000)).toBeNull();
  });
});

describe("return statistics", () => {
  it("computes CAGR from endpoints and elapsed years", () => {
    // Doubling over 10 years ≈ 7.18% CAGR.
    expect(computeCagrPercent(1000, 2000, 10)).toBeCloseTo(7.177, 2);
    expect(computeCagrPercent(1000, 1000, 5)).toBe(0);
    expect(computeCagrPercent(0, 100, 5)).toBe(0);
  });

  it("finds the worst peak-to-trough drawdown as a fraction", () => {
    expect(computeMaxDrawdown([100, 110, 90, 120])).toBeCloseTo((110 - 90) / 110, 6);
    expect(computeMaxDrawdown([100, 50, 200])).toBeCloseTo(0.5, 6);
    expect(computeMaxDrawdown([])).toBe(0);
  });

  it("rolls start, end, total return, CAGR, and drawdown into one summary", () => {
    const stats = computeReturnStats([
      { date: "2015-04", value: 1000 },
      { date: "2020-04", value: 800 },
      { date: "2025-04", value: 2000 }
    ]);

    expect(stats.startValue).toBe(1000);
    expect(stats.endValue).toBe(2000);
    expect(stats.totalReturnPercent).toBeCloseTo(100, 6);
    // 10 years, 1000 → 2000.
    expect(stats.cagrPercent).toBeCloseTo(7.177, 2);
    // Trough of 800 from a peak of 1000.
    expect(stats.maxDrawdownPercent).toBeCloseTo(20, 6);
  });
});
