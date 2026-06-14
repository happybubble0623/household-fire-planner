import { inferEodhdAssetType, normalizeEodhdSymbol } from "@/lib/market-data/eodhd";
import type { MonthlyPricePoint } from "@/lib/phase1/backtest";
import type { Phase1AssetType } from "@/types/phase1";

type EodhdHistoryRow = {
  date?: string;
  close?: number | string | null;
  adjusted_close?: number | string | null;
};

// Parse an EODHD EOD series (period=m, ascending) into clean monthly points.
// Prefers adjusted_close and drops bad rows. adjusted_close is SPLIT- and
// dividend-adjusted, which is the field the backtest needs: it values TODAY's
// (post-split) share counts against historically consistent prices, so a stock
// that split (AAPL, NVDA, TSLA) doesn't inflate the early portfolio value. The
// dividend component makes it a total-return-ish series (past prices a touch
// lower than a price-only split adjustment) — acceptable, and the chart is
// labeled as adjusted. Falling back to raw `close` would reintroduce the
// split-inflation bug, so the split regression in prices-history.test.ts locks
// adjusted_close in.
export function parseEodhdMonthlySeries(rows: EodhdHistoryRow[] | unknown): MonthlyPricePoint[] {
  if (!Array.isArray(rows)) return [];

  const points: MonthlyPricePoint[] = [];

  for (const row of rows) {
    const close = toPositiveNumber(row?.adjusted_close) ?? toPositiveNumber(row?.close);

    if (row?.date && close !== null) {
      points.push({ date: row.date, close });
    }
  }

  return points.sort((first, second) => first.date.localeCompare(second.date));
}

// One cached monthly-history call per symbol. Returns [] on any failure so a
// single bad symbol never breaks the whole backtest.
export async function fetchEodhdMonthlyHistory(
  symbol: string,
  apiKey: string | undefined,
  range: { from: string; to: string },
  assetType?: Phase1AssetType
): Promise<MonthlyPricePoint[]> {
  if (!apiKey) return [];

  const resolvedAssetType = assetType ?? inferEodhdAssetType(symbol);

  if (resolvedAssetType === "option") return [];

  const eodhdSymbol = normalizeEodhdSymbol(symbol, resolvedAssetType);
  const searchParams = new URLSearchParams({
    api_token: apiKey,
    fmt: "json",
    period: "m",
    order: "a",
    from: range.from,
    to: range.to
  });
  const url = `https://eodhd.com/api/eod/${encodeURIComponent(eodhdSymbol)}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });
    if (!response.ok) return [];

    return parseEodhdMonthlySeries(await response.json());
  } catch {
    return [];
  }
}

function toPositiveNumber(value: number | string | null | undefined) {
  const parsedValue = Number(value);

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return null;
}
