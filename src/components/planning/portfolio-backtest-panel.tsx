"use client";

import { useEffect, useMemo, useState } from "react";
import { FlaskConical, Plus, X } from "lucide-react";
import { BacktestChart } from "@/components/charts/backtest-chart";
import type { BacktestChartLine } from "@/components/charts/backtest-chart";
import { calculatePortfolioItemBalance, isMarketPricedType } from "@/lib/phase1/portfolio";
import {
  computePortfolioSeries,
  computeReturnStats,
  DEFAULT_WINDOW_YEARS,
  getSeriesMonthBounds,
  isLikelyTicker,
  NO_TICKER_REASON,
  normalizeBenchmarkSeries,
  resolveBacktestWindow,
  sliceSeriesToWindow
} from "@/lib/phase1/backtest";
import type {
  BacktestHoldingInput,
  BacktestReturnStats,
  BacktestWindowSelection,
  MonthlySeriesBySymbol
} from "@/lib/phase1/backtest";
import type { MarketSymbolSearchResult } from "@/types/market-data";
import type { Phase1PortfolioItem, Phase1Workbook } from "@/types/phase1";

type PortfolioBacktestPanelProps = {
  workbook: Phase1Workbook;
};

type BacktestChartRow = { date: string; [key: string]: number | string };

// Everything captured at "Run backtest" time: the full (max-range) fetched
// series plus the inputs it was run against. The displayed result is derived
// from this by slicing to the selected window — no refetch on window change.
type BacktestRawRun = {
  seriesBySymbol: MonthlySeriesBySymbol;
  holdings: BacktestHoldingInput[];
  benchmarks: string[];
  excludedNonMarket: string[];
  warning: string | null;
};

type BacktestRunResult = {
  chartRows: BacktestChartRow[];
  portfolioStats: BacktestReturnStats;
  benchmarkStats: { symbol: string; stats: BacktestReturnStats }[];
  skippedBenchmarks: string[];
  skippedHoldings: { name: string; symbol: string; reason: string }[];
  noTickerHoldings: { name: string; symbol: string }[];
  insufficientHoldings: { name: string; symbol: string }[];
  distortedHoldings: { name: string; symbol: string }[];
  excludedNonMarket: string[];
  windowStart: string;
  windowEnd: string;
  warning: string | null;
};

const DEFAULT_PROXY = "VOO";
const DEFAULT_PROXY_OPTIONS = ["VOO", "VTI", "BND"];
const DEFAULT_BENCHMARK = "SPY";
const MAX_BENCHMARKS = 5;
// Always fetch the longest history the route allows (it caps at 30y) so every
// preset and custom range can be served by slicing client-side — changing the
// window after a run never triggers a refetch.
const BACKTEST_MAX_YEARS = 30;
// Quick-window presets. `years: null` is "Max" — the full available history.
const WINDOW_PRESETS: { label: string; years: number | null }[] = [
  { label: "1Y", years: 1 },
  { label: "3Y", years: 3 },
  { label: "5Y", years: 5 },
  { label: "10Y", years: DEFAULT_WINDOW_YEARS },
  { label: "Max", years: null }
];
// Chunk the history request so a large household portfolio never trips a URL
// length or per-request symbol cap; the chunks are merged client-side.
const REQUEST_CHUNK_SIZE = 25;
// Benchmark line colors, kept distinct from the emphasized portfolio line
// (chart-1) and from the reserved flagship gold.
const BENCHMARK_COLORS = [
  "var(--chart-4)",
  "var(--chart-6)",
  "var(--chart-2)",
  "var(--chart-5)",
  "var(--chart-negative)"
];

export function PortfolioBacktestPanel({ workbook }: PortfolioBacktestPanelProps) {
  const [scope, setScope] = useState("all");
  const [proxyByItemId, setProxyByItemId] = useState<Record<string, string>>({});
  const [benchmarks, setBenchmarks] = useState<string[]>([DEFAULT_BENCHMARK]);
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [rawRun, setRawRun] = useState<BacktestRawRun | null>(null);
  const [presetYears, setPresetYears] = useState<number | null>(DEFAULT_WINDOW_YEARS);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const collections = workbook.portfolioCollections;
  const scopeItems = useMemo(
    () => getScopeItems(workbook, scope),
    [workbook, scope]
  );
  const partitioned = useMemo(() => partitionScopeItems(scopeItems), [scopeItems]);

  // Both endpoints must be set for the custom range to take over from the preset.
  const usingCustom = customFrom !== "" && customTo !== "";
  const selection: BacktestWindowSelection = usingCustom
    ? { kind: "custom", from: customFrom, to: customTo }
    : { kind: "preset", years: presetYears };

  // Available data bounds, used to clamp custom inputs and label the range.
  const bounds = useMemo(
    () => (rawRun ? getSeriesMonthBounds(rawRun.seriesBySymbol) : null),
    [rawRun]
  );

  // The displayed result is derived: slice the once-fetched series to the
  // selected window, then recompute. Changing the window is instant.
  const result = useMemo<BacktestRunResult | null>(() => {
    if (!rawRun) return null;
    const window = resolveBacktestWindow(bounds, selection);
    if (!window) return null;

    return buildRunResult({
      seriesBySymbol: sliceSeriesToWindow(rawRun.seriesBySymbol, window),
      holdings: rawRun.holdings,
      benchmarks: rawRun.benchmarks,
      excludedNonMarket: rawRun.excludedNonMarket,
      warning: rawRun.warning
    });
  }, [rawRun, bounds, selection]);

  const resolveProxy = (itemId: string) => proxyByItemId[itemId] ?? DEFAULT_PROXY;

  const handleRunBacktest = async () => {
    setIsRunning(true);
    setRunError(null);

    const holdings: BacktestHoldingInput[] = [
      ...partitioned.trackable.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "trackable" as const,
        symbol: (item.symbol as string).toUpperCase(),
        units: item.units as number
      })),
      ...partitioned.proxied.map((item) => ({
        id: item.id,
        name: item.name,
        kind: "proxy" as const,
        symbol: resolveProxy(item.id).toUpperCase(),
        currentValue: calculatePortfolioItemBalance(item)
      }))
    ];

    if (holdings.length === 0) {
      setIsRunning(false);
      setRawRun(null);
      setRunError("No market holdings in scope to backtest. Add a market holding or pick another scope.");
      return;
    }

    const assetTypePairs = partitioned.trackable
      .filter((item) => item.symbol)
      .map((item) => `${(item.symbol as string).toUpperCase()}:${item.type}`);
    // Only request symbols that look like real tickers — fund descriptions stored
    // in the symbol field would just waste request slots and come back empty.
    // Deduped so the same ticker held in several accounts is fetched once.
    const symbols = Array.from(
      new Set([
        ...holdings.map((holding) => holding.symbol),
        ...benchmarks.map((benchmark) => benchmark.toUpperCase())
      ])
    ).filter(isLikelyTicker);

    try {
      const { series: seriesBySymbol, warning } = await fetchHistorySeries(
        symbols,
        assetTypePairs
      );

      const excludedNonMarket = partitioned.excluded.map((item) => item.name);

      // Sanity-check that there is some usable history before storing the run, so
      // the "no overlap" error surfaces on the click rather than silently
      // yielding an empty result panel.
      const probe = buildRunResult({
        seriesBySymbol,
        holdings,
        benchmarks,
        excludedNonMarket,
        warning
      });

      if (!probe) {
        setRawRun(null);
        setRunError(
          "No overlapping price history was found for the holdings in scope. Try different proxies or holdings."
        );
        return;
      }

      setRawRun({ seriesBySymbol, holdings, benchmarks, excludedNonMarket, warning });
    } catch (error) {
      setRawRun(null);
      setRunError(error instanceof Error ? error.message : "Backtest failed. Try again later.");
    } finally {
      setIsRunning(false);
    }
  };

  const handleAddBenchmark = (symbol: string) => {
    const normalized = symbol.trim().toUpperCase();
    setBenchmarks((current) =>
      current.includes(normalized) || current.length >= MAX_BENCHMARKS
        ? current
        : [...current, normalized]
    );
  };

  const handleRemoveBenchmark = (symbol: string) => {
    setBenchmarks((current) => current.filter((benchmark) => benchmark !== symbol));
  };

  return (
    <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 [&::-webkit-details-marker]:hidden">
        <div className="flex items-center gap-2">
          <FlaskConical aria-hidden="true" size={18} className="text-[var(--muted-foreground)]" />
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Backtest</h2>
          <span className="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted-foreground)]">
            ⚗️ Under testing
          </span>
        </div>
        <span className="text-sm text-[var(--muted-foreground)] group-open:hidden">Show</span>
        <span className="hidden text-sm text-[var(--muted-foreground)] group-open:inline">Hide</span>
      </summary>

      <div className="border-t border-[var(--border)] p-5">
        <p className="text-sm text-[var(--muted-foreground)]">
          Models holding today&apos;s quantities over the selected window — a basket simulation, not
          your actual trade history. Prices are monthly end-of-day, not real-time.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Scope">
            <select
              value={scope}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="all">All market holdings</option>
              {collections.map((collection) => (
                <option key={collection.id} value={`collection:${collection.id}`}>
                  {collection.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={`Benchmarks (max ${MAX_BENCHMARKS})`}>
            <div className="flex flex-wrap items-center gap-2">
              {benchmarks.map((benchmark) => (
                <span
                  key={benchmark}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  {benchmark}
                  <button
                    type="button"
                    aria-label={`Remove ${benchmark}`}
                    className="text-[var(--muted-foreground)] hover:text-[var(--negative)]"
                    onClick={() => handleRemoveBenchmark(benchmark)}
                  >
                    <X aria-hidden="true" size={13} />
                  </button>
                </span>
              ))}
              {benchmarks.length < MAX_BENCHMARKS ? (
                <SymbolSearchField
                  placeholder="Add benchmark"
                  onSelect={(option) => handleAddBenchmark(option.symbol)}
                />
              ) : null}
            </div>
          </Field>
        </div>

        {partitioned.proxied.length > 0 ? (
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--foreground)]">
              Proxy tickers for untrackable holdings
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Holdings without a usable symbol are modeled total-value based off a proxy.
            </p>
            <div className="mt-2 grid gap-2">
              {partitioned.proxied.map((item) => (
                <ProxyRow
                  key={item.id}
                  item={item}
                  proxy={resolveProxy(item.id)}
                  onChange={(symbol) =>
                    setProxyByItemId((current) => ({ ...current, [item.id]: symbol }))
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-4">
          <WindowControl
            presetYears={presetYears}
            usingCustom={usingCustom}
            customFrom={customFrom}
            customTo={customTo}
            bounds={bounds}
            onPreset={(years) => {
              setPresetYears(years);
              setCustomFrom("");
              setCustomTo("");
            }}
            onCustomFrom={setCustomFrom}
            onCustomTo={setCustomTo}
            onClearCustom={() => {
              setCustomFrom("");
              setCustomTo("");
            }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--foreground)] px-4 text-sm font-semibold text-[var(--surface)] hover:opacity-90 disabled:opacity-60"
            onClick={() => void handleRunBacktest()}
            disabled={isRunning}
          >
            {isRunning ? "Running…" : "Run backtest"}
          </button>
          <span className="text-xs text-[var(--muted-foreground)]">
            {partitioned.trackable.length + partitioned.proxied.length} holding(s) in scope ·
            {" "}
            {partitioned.excluded.length} excluded
          </span>
        </div>

        {runError ? (
          <p className="mt-3 rounded-md border border-[var(--negative)]/30 bg-[var(--negative-bg)] px-3 py-2 text-sm text-[var(--negative)]">
            {runError}
          </p>
        ) : null}

        {result && rawRun ? (
          <BacktestResult result={result} benchmarks={rawRun.benchmarks} />
        ) : null}
      </div>
    </details>
  );
}

function BacktestResult({
  result,
  benchmarks
}: {
  result: BacktestRunResult;
  benchmarks: string[];
}) {
  const activeBenchmarks = benchmarks.filter(
    (benchmark) => !result.skippedBenchmarks.includes(benchmark)
  );
  const lines: BacktestChartLine[] = [
    { dataKey: "portfolio", name: "Portfolio", color: "var(--chart-1)", emphasized: true },
    ...activeBenchmarks.map((benchmark, index) => ({
      dataKey: benchmark,
      name: benchmark,
      color: BENCHMARK_COLORS[index % BENCHMARK_COLORS.length]
    }))
  ];

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs text-[var(--muted-foreground)]">
        Window: {result.windowStart} → {result.windowEnd}
        {result.warning ? ` · ${result.warning}` : ""}
      </p>
      <BacktestChart data={result.chartRows} lines={lines} />

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Start value" value={formatCurrency(result.portfolioStats.startValue)} />
        <Stat label="End value" value={formatCurrency(result.portfolioStats.endValue)} />
        <Stat
          label="Total return"
          value={formatPercent(result.portfolioStats.totalReturnPercent)}
        />
        <Stat label="CAGR" value={formatPercent(result.portfolioStats.cagrPercent)} />
        <Stat
          label="Max drawdown"
          value={formatPercent(-Math.abs(result.portfolioStats.maxDrawdownPercent))}
        />
      </div>

      {result.benchmarkStats.length > 0 ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
                <th className="py-1 pr-4 font-medium">Benchmark</th>
                <th className="py-1 pr-4 font-medium">Total return</th>
                <th className="py-1 font-medium">CAGR</th>
              </tr>
            </thead>
            <tbody>
              {result.benchmarkStats.map(({ symbol, stats }) => (
                <tr key={symbol} className="border-t border-[var(--border)]">
                  <td className="py-1.5 pr-4 font-medium text-[var(--foreground)]">{symbol}</td>
                  <td className="py-1.5 pr-4 tabular-nums">
                    {formatPercent(stats.totalReturnPercent)}
                  </td>
                  <td className="py-1.5 tabular-nums">{formatPercent(stats.cagrPercent)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {result.skippedHoldings.length > 0 ? (
        <p className="mt-3 text-xs text-[var(--muted-foreground)]">
          No price history: {result.skippedHoldings.map((holding) => holding.name).join(", ")}.
        </p>
      ) : null}
      {result.insufficientHoldings.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Too little history for the full window (excluded):{" "}
          {result.insufficientHoldings.map((holding) => holding.name).join(", ")}.
        </p>
      ) : null}
      {result.distortedHoldings.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Excluded — leveraged/volatility product (history not meaningful to backtest):{" "}
          {result.distortedHoldings.map((holding) => holding.name).join(", ")}.
        </p>
      ) : null}
      {result.noTickerHoldings.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          No ticker to look up: {result.noTickerHoldings.map((holding) => holding.name).join(", ")}.
        </p>
      ) : null}
      {result.skippedBenchmarks.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Benchmarks without full history: {result.skippedBenchmarks.join(", ")}.
        </p>
      ) : null}
      {result.excludedNonMarket.length > 0 ? (
        <p className="mt-1 text-xs text-[var(--muted-foreground)]">
          Excluded (cash, home, liabilities &amp; other): {result.excludedNonMarket.join(", ")}.
        </p>
      ) : null}
    </div>
  );
}

function ProxyRow({
  item,
  proxy,
  onChange
}: {
  item: Phase1PortfolioItem;
  proxy: string;
  onChange: (symbol: string) => void;
}) {
  const options = DEFAULT_PROXY_OPTIONS.includes(proxy)
    ? DEFAULT_PROXY_OPTIONS
    : [...DEFAULT_PROXY_OPTIONS, proxy];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-md border border-[var(--border)] px-3 py-2">
      <span className="flex-1 text-sm text-[var(--foreground)]">{item.name}</span>
      <select
        value={proxy}
        aria-label={`Proxy for ${item.name}`}
        className="min-h-9 rounded-md border border-[var(--border)] px-2 text-sm"
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <SymbolSearchField
        placeholder="Search proxy"
        onSelect={(option) => onChange(option.symbol.toUpperCase())}
      />
    </div>
  );
}

// Compact symbol search reusing the existing /api/symbols endpoint, with the
// same debounce + abort pattern as the Add-asset form.
function SymbolSearchField({
  placeholder,
  onSelect
}: {
  placeholder: string;
  onSelect: (option: MarketSymbolSearchResult) => void;
}) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<MarketSymbolSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    // The dropdown is gated on a 2+ char query, so stale options stay hidden
    // without a synchronous clear here (which React discourages in effects).
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setIsSearching(true);
      void fetch(`/api/symbols?query=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal
      })
        .then(async (response) => {
          const payload = (await response.json()) as { symbols: MarketSymbolSearchResult[] };
          setOptions(payload.symbols ?? []);
        })
        .catch(() => {
          if (!controller.signal.aborted) setOptions([]);
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="relative">
      <div className="flex items-center gap-1 rounded-md border border-[var(--border)] px-2">
        <Plus aria-hidden="true" size={13} className="text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          className="min-h-9 w-32 bg-transparent text-sm outline-none"
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {query.trim().length >= 2 && (options.length > 0 || isSearching) ? (
        <ul className="absolute z-20 mt-1 max-h-56 w-64 overflow-auto rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
          {isSearching && options.length === 0 ? (
            <li className="px-2 py-1 text-xs text-[var(--muted-foreground)]">Searching…</li>
          ) : null}
          {options.map((option) => (
            <li key={`${option.symbol}-${option.exchange ?? ""}`}>
              <button
                type="button"
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-[var(--muted)]"
                onClick={() => {
                  onSelect(option);
                  setQuery("");
                  setOptions([]);
                }}
              >
                <span className="font-medium">{option.symbol}</span>{" "}
                <span className="text-[var(--muted-foreground)]">{option.name}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function WindowControl({
  presetYears,
  usingCustom,
  customFrom,
  customTo,
  bounds,
  onPreset,
  onCustomFrom,
  onCustomTo,
  onClearCustom
}: {
  presetYears: number | null;
  usingCustom: boolean;
  customFrom: string;
  customTo: string;
  bounds: { minMonth: string; maxMonth: string } | null;
  onPreset: (years: number | null) => void;
  onCustomFrom: (value: string) => void;
  onCustomTo: (value: string) => void;
  onClearCustom: () => void;
}) {
  return (
    <Field label="Window">
      <div className="flex flex-wrap items-center gap-3">
        <div
          role="group"
          aria-label="Quick window presets"
          className="inline-flex rounded-md border border-[var(--border)] p-0.5"
        >
          {WINDOW_PRESETS.map((preset) => {
            const active = !usingCustom && presetYears === preset.years;
            return (
              <button
                key={preset.label}
                type="button"
                aria-pressed={active}
                onClick={() => onPreset(preset.years)}
                className={`min-h-9 rounded px-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[var(--foreground)] text-[var(--surface)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--muted-foreground)]">
          <span className="font-medium">Custom</span>
          <input
            type="month"
            aria-label="Custom window start"
            value={customFrom}
            min={bounds?.minMonth}
            max={bounds?.maxMonth}
            className={`min-h-9 rounded-md border px-2 text-sm ${
              usingCustom
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-[var(--border)]"
            }`}
            onChange={(event) => onCustomFrom(event.target.value)}
          />
          <span aria-hidden="true">→</span>
          <input
            type="month"
            aria-label="Custom window end"
            value={customTo}
            min={bounds?.minMonth}
            max={bounds?.maxMonth}
            className={`min-h-9 rounded-md border px-2 text-sm ${
              usingCustom
                ? "border-[var(--foreground)] text-[var(--foreground)]"
                : "border-[var(--border)]"
            }`}
            onChange={(event) => onCustomTo(event.target.value)}
          />
          {customFrom || customTo ? (
            <button
              type="button"
              className="rounded px-1.5 py-0.5 text-[var(--muted-foreground)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
              onClick={onClearCustom}
            >
              clear
            </button>
          ) : null}
        </div>
      </div>
    </Field>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">{label}</p>
      <p className="text-base font-semibold tabular-nums text-[var(--foreground)]">{value}</p>
    </div>
  );
}

function getScopeItems(workbook: Phase1Workbook, scope: string): Phase1PortfolioItem[] {
  if (scope === "all") {
    return workbook.portfolioItems;
  }

  const collectionId = scope.replace("collection:", "");
  const memberIds = new Set(
    workbook.portfolioCollectionMemberships
      .filter((membership) => membership.collectionId === collectionId)
      .map((membership) => membership.portfolioItemId)
  );

  return workbook.portfolioItems.filter((item) => memberIds.has(item.id));
}

function partitionScopeItems(items: Phase1PortfolioItem[]) {
  const trackable: Phase1PortfolioItem[] = [];
  const proxied: Phase1PortfolioItem[] = [];
  const excluded: Phase1PortfolioItem[] = [];

  for (const item of items) {
    if (!isMarketPricedType(item.type)) {
      excluded.push(item);
      continue;
    }

    const untrackable =
      !item.symbol ||
      item.units === undefined ||
      item.priceStatus === "failed" ||
      item.priceStatus === "unsupported";

    if (untrackable) {
      proxied.push(item);
    } else {
      trackable.push(item);
    }
  }

  return { trackable, proxied, excluded };
}

// Fetch monthly history in chunks and merge the per-symbol series. Each chunk is
// keyed by the requested symbol, so merging is a plain object spread. Throws if
// any chunk request fails so the caller can surface a single error.
async function fetchHistorySeries(
  symbols: string[],
  assetTypePairs: string[]
): Promise<{ series: MonthlySeriesBySymbol; warning: string | null }> {
  const merged: MonthlySeriesBySymbol = {};
  const warnings: string[] = [];

  for (let offset = 0; offset < symbols.length; offset += REQUEST_CHUNK_SIZE) {
    const chunk = symbols.slice(offset, offset + REQUEST_CHUNK_SIZE);
    const chunkSet = new Set(chunk);
    const params = new URLSearchParams({
      symbols: chunk.join(","),
      years: String(BACKTEST_MAX_YEARS)
    });
    const relevantPairs = assetTypePairs.filter((pair) =>
      chunkSet.has(pair.split(":")[0])
    );
    if (relevantPairs.length > 0) {
      params.set("assetTypes", relevantPairs.join(","));
    }

    const response = await fetch(`/api/prices/history?${params.toString()}`);
    const payload = (await response.json()) as {
      series: MonthlySeriesBySymbol;
      warning: string | null;
    };

    if (!response.ok) {
      throw new Error(payload.warning ?? "Could not fetch historical prices.");
    }

    Object.assign(merged, payload.series ?? {});
    if (payload.warning) warnings.push(payload.warning);
  }

  return { series: merged, warning: warnings[0] ?? null };
}

function buildRunResult({
  seriesBySymbol,
  holdings,
  benchmarks,
  excludedNonMarket,
  warning
}: {
  seriesBySymbol: MonthlySeriesBySymbol;
  holdings: BacktestHoldingInput[];
  benchmarks: string[];
  excludedNonMarket: string[];
  warning: string | null;
}): BacktestRunResult | null {
  const portfolio = computePortfolioSeries(holdings, seriesBySymbol);

  if (portfolio.series.length === 0) {
    return null;
  }

  const timeline = portfolio.series.map((point) => point.date);
  const startValue = portfolio.series[0].value;
  const chartRows: BacktestChartRow[] = portfolio.series.map((point) => ({
    date: point.date,
    portfolio: round2(point.value)
  }));

  const benchmarkStats: { symbol: string; stats: BacktestReturnStats }[] = [];
  const skippedBenchmarks: string[] = [];

  for (const benchmark of benchmarks) {
    const normalized = normalizeBenchmarkSeries(
      seriesBySymbol[benchmark.toUpperCase()],
      timeline,
      startValue
    );

    if (!normalized) {
      skippedBenchmarks.push(benchmark);
      continue;
    }

    normalized.forEach((point, index) => {
      chartRows[index][benchmark] = round2(point.value);
    });
    benchmarkStats.push({ symbol: benchmark, stats: computeReturnStats(normalized) });
  }

  return {
    chartRows,
    portfolioStats: computeReturnStats(portfolio.series),
    benchmarkStats,
    skippedBenchmarks,
    skippedHoldings: portfolio.skipped
      .filter((holding) => holding.reason !== NO_TICKER_REASON)
      .map((holding) => ({
        name: holding.name,
        symbol: holding.symbol,
        reason: holding.reason
      })),
    noTickerHoldings: portfolio.skipped
      .filter((holding) => holding.reason === NO_TICKER_REASON)
      .map((holding) => ({ name: holding.name, symbol: holding.symbol })),
    insufficientHoldings: portfolio.insufficientHistory.map((holding) => ({
      name: holding.name,
      symbol: holding.symbol
    })),
    distortedHoldings: portfolio.excludedDistorted.map((holding) => ({
      name: holding.name,
      symbol: holding.symbol
    })),
    excludedNonMarket,
    windowStart: timeline[0],
    windowEnd: timeline[timeline.length - 1],
    warning
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function formatCurrency(value: number) {
  return `$${Math.round(value).toLocaleString()}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}
