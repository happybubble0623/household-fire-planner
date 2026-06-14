import { NextResponse } from "next/server";
import { fetchEodhdMonthlyHistory } from "@/lib/market-data/eodhd-history";
import { inferEodhdAssetType } from "@/lib/market-data/eodhd";
import type { MonthlyPricePoint } from "@/lib/phase1/backtest";
import type { Phase1AssetType } from "@/types/phase1";

const HISTORY_UNAVAILABLE =
  "Historical prices are unavailable. Check EODHD_API_KEY or try again later.";
const HISTORY_WARNING =
  "Monthly end-of-day history. Prices are delayed, may be adjusted, and are not real-time.";
const DEFAULT_YEARS = 10;
// A generous ceiling that guards against abuse without silently dropping the
// tail of a real household portfolio. Symbols are fetched in bounded-concurrency
// batches, so a large request degrades gracefully instead of truncating.
const MAX_SYMBOLS = 120;
const FETCH_CONCURRENCY = 8;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = Array.from(
    new Set(
      (searchParams.get("symbols") ?? "")
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    )
  ).slice(0, MAX_SYMBOLS);
  const assetTypes = parseAssetTypes(searchParams.get("assetTypes"));
  const range = resolveRange(searchParams.get("years"));

  if (symbols.length === 0) {
    return NextResponse.json({ series: {}, warning: "No symbols requested." });
  }

  const provider = process.env.MARKET_DATA_PROVIDER ?? "eodhd";
  const eodhdApiKey = process.env.EODHD_API_KEY;

  if (provider !== "eodhd" || !eodhdApiKey) {
    return NextResponse.json({ series: {}, warning: HISTORY_UNAVAILABLE });
  }

  // Fetch in bounded-concurrency batches so a 30+ symbol request resolves fully
  // without firing every upstream call at once. Each series is keyed by the
  // ORIGINAL requested symbol so the client can look it up by the same string.
  const series: Record<string, MonthlyPricePoint[]> = {};
  for (let offset = 0; offset < symbols.length; offset += FETCH_CONCURRENCY) {
    const batch = symbols.slice(offset, offset + FETCH_CONCURRENCY);
    const fetched = await Promise.all(
      batch.map(async (symbol) => {
        const points = await fetchEodhdMonthlyHistory(
          symbol,
          eodhdApiKey,
          range,
          assetTypes.get(symbol) ?? inferEodhdAssetType(symbol)
        );

        return [symbol, points] as const;
      })
    );

    for (const [symbol, points] of fetched) {
      series[symbol] = points;
    }
  }

  const missing = symbols.filter((symbol) => series[symbol].length === 0);

  return NextResponse.json({
    series,
    warning:
      missing.length > 0
        ? `${HISTORY_WARNING} No history for: ${missing.join(", ")}.`
        : HISTORY_WARNING
  });
}

function resolveRange(yearsParam: string | null) {
  const parsedYears = Number(yearsParam);
  const years = Number.isFinite(parsedYears) && parsedYears > 0 ? Math.min(parsedYears, 30) : DEFAULT_YEARS;
  const to = new Date();
  const from = new Date(to);
  from.setFullYear(from.getFullYear() - years);

  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10)
  };
}

function parseAssetTypes(assetTypesParam: string | null) {
  const assetTypes = new Map<string, Phase1AssetType>();

  (assetTypesParam ?? "")
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .forEach((pair) => {
      const [rawSymbol, rawAssetType] = pair.split(":");
      const symbol = rawSymbol?.trim().toUpperCase();
      const assetType = rawAssetType?.trim() as Phase1AssetType | undefined;

      if (symbol && isPhase1AssetType(assetType)) {
        assetTypes.set(symbol, assetType);
      }
    });

  return assetTypes;
}

function isPhase1AssetType(value: string | undefined): value is Phase1AssetType {
  return (
    value === "stock" ||
    value === "etf" ||
    value === "mutual_fund" ||
    value === "crypto" ||
    value === "bond" ||
    value === "option" ||
    value === "cash" ||
    value === "home" ||
    value === "liability" ||
    value === "other_asset"
  );
}
