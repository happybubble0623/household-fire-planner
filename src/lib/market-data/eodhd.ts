import type {
  FetchedMarketPrice,
  MarketSymbolSearchResult,
  MarketSymbolSearchType
} from "@/types/market-data";
import type { Phase1AssetType } from "@/types/phase1";

const MANUAL_WARNING = "Could not fetch latest price. Enter a manual price or try again later.";
const OPTION_WARNING = "Options are not supported by automated price refresh yet. Enter a manual price.";

type EodhdRow = {
  date?: string;
  close?: number | string | null;
  adjusted_close?: number | string | null;
};

type EodhdSymbolRow = {
  Code?: unknown;
  Name?: unknown;
  Exchange?: unknown;
  Currency?: unknown;
  Type?: unknown;
};

export function inferEodhdAssetType(symbol: string): Phase1AssetType {
  const normalizedSymbol = symbol.trim().toUpperCase();

  if (
    normalizedSymbol.endsWith(".CC") ||
    normalizedSymbol.includes("-USD") ||
    normalizedSymbol.includes("USD-") ||
    normalizedSymbol === "BTC" ||
    normalizedSymbol === "ETH"
  ) {
    return "crypto";
  }

  if (/^[A-Z]{1,6}\d{6}[CP]\d{8}$/.test(normalizedSymbol)) {
    return "option";
  }

  return "stock";
}

export function normalizeEodhdSymbol(symbol: string, assetType?: Phase1AssetType) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const resolvedAssetType = assetType ?? inferEodhdAssetType(normalizedSymbol);

  if (
    normalizedSymbol.includes(".") ||
    resolvedAssetType === "crypto" ||
    resolvedAssetType === "bond" ||
    resolvedAssetType === "option" ||
    resolvedAssetType === "cash" ||
    resolvedAssetType === "home" ||
    resolvedAssetType === "liability" ||
    resolvedAssetType === "other_asset"
  ) {
    return normalizedSymbol;
  }

  return `${normalizedSymbol}.US`;
}

export function parseEodhdLatestPrice(
  symbol: string,
  rows: EodhdRow[] | unknown
): FetchedMarketPrice {
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const adjustedClose = toPositiveNumber(row.adjusted_close);
      const close = toPositiveNumber(row.close);
      const closePrice = adjustedClose ?? close;

      if (row.date && closePrice !== null) {
        return {
          symbol,
          priceDate: row.date,
          closePrice,
          source: "eodhd_eod"
        };
      }
    }
  }

  return manualRequiredPrice(symbol);
}

export function parseEodhdSymbolSearchResults(
  rows: EodhdSymbolRow[] | unknown,
  assetType?: MarketSymbolSearchType
): MarketSymbolSearchResult[] {
  if (!Array.isArray(rows)) return [];

  const results = rows
    .map((row) => parseEodhdSymbolSearchRow(row, assetType))
    .filter((row): row is MarketSymbolSearchResult => row !== null);

  return dedupeSymbolResults(results).slice(0, 12);
}

export async function fetchEodhdSymbolSearch(
  query: string,
  apiKey: string | undefined,
  assetType?: MarketSymbolSearchType
): Promise<MarketSymbolSearchResult[]> {
  const normalizedQuery = query.trim();
  if (!apiKey || normalizedQuery.length < 2) return [];

  const searchParams = new URLSearchParams({
    api_token: apiKey,
    fmt: "json"
  });
  const searchType = assetType ? getEodhdSearchType(assetType) : null;
  searchParams.set("type", searchType ?? "all");

  const url = `https://eodhd.com/api/search/${encodeURIComponent(normalizedQuery)}?${searchParams.toString()}`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 24 } });
    if (!response.ok) return [];

    return parseEodhdSymbolSearchResults(await response.json(), assetType);
  } catch {
    return [];
  }
}

export async function fetchEodhdLatestPrice(
  symbol: string,
  apiKey: string | undefined,
  assetType?: Phase1AssetType
): Promise<FetchedMarketPrice> {
  const resolvedAssetType = assetType ?? inferEodhdAssetType(symbol);

  if (resolvedAssetType === "option") {
    return {
      symbol,
      priceDate: todayIsoDate(),
      closePrice: null,
      source: "unsupported",
      warning: OPTION_WARNING
    };
  }

  if (!apiKey) {
    return manualRequiredPrice(symbol);
  }

  const eodhdSymbol = normalizeEodhdSymbol(symbol, resolvedAssetType);
  const url = `https://eodhd.com/api/eod/${encodeURIComponent(
    eodhdSymbol
  )}?api_token=${encodeURIComponent(apiKey)}&fmt=json&period=d&order=d`;

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });

    if (!response.ok) {
      throw new Error("EODHD request failed.");
    }

    return parseEodhdLatestPrice(symbol, await response.json());
  } catch {
    return manualRequiredPrice(symbol);
  }
}

function manualRequiredPrice(symbol: string): FetchedMarketPrice {
  return {
    symbol,
    priceDate: todayIsoDate(),
    closePrice: null,
    source: "manual_required",
    warning: MANUAL_WARNING
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toPositiveNumber(value: number | string | null | undefined) {
  const parsedValue = Number(value);

  if (Number.isFinite(parsedValue) && parsedValue > 0) {
    return parsedValue;
  }

  return null;
}

function parseEodhdSymbolSearchRow(
  row: EodhdSymbolRow,
  assetType: MarketSymbolSearchType | undefined
): MarketSymbolSearchResult | null {
  const code = optionalString(row.Code)?.toUpperCase();
  const name = optionalString(row.Name);
  const exchange = optionalString(row.Exchange)?.toUpperCase();
  const currency = optionalString(row.Currency)?.toUpperCase();
  const rowType = optionalString(row.Type);

  const resolvedAssetType = assetType ?? inferSymbolSearchType({ exchange, rowType });

  if (
    !code ||
    !name ||
    !resolvedAssetType ||
    !matchesRequestedSymbolType({ assetType: resolvedAssetType, exchange, rowType })
  ) {
    return null;
  }

  return {
    symbol: normalizeSearchSymbol(code, exchange, resolvedAssetType),
    name,
    exchange,
    currency,
    type: resolvedAssetType
  };
}

function inferSymbolSearchType({
  exchange,
  rowType
}: {
  exchange: string | undefined;
  rowType: string | undefined;
}): MarketSymbolSearchType | null {
  const normalizedType = rowType?.toLowerCase() ?? "";

  if (
    exchange === "CC" ||
    normalizedType.includes("crypto") ||
    normalizedType.includes("currency")
  ) {
    return "crypto";
  }

  if (normalizedType.includes("etf")) return "etf";
  if (normalizedType.includes("bond")) return "bond";
  if (normalizedType.includes("fund")) return "mutual_fund";
  if (normalizedType.includes("stock")) return "stock";

  return null;
}

function matchesRequestedSymbolType({
  assetType,
  exchange,
  rowType
}: {
  assetType: MarketSymbolSearchType;
  exchange: string | undefined;
  rowType: string | undefined;
}) {
  const normalizedType = rowType?.toLowerCase() ?? "";

  if (assetType === "crypto") {
    return (
      exchange === "CC" ||
      normalizedType.includes("crypto") ||
      normalizedType.includes("currency")
    );
  }

  if (assetType === "etf") {
    return normalizedType.includes("etf");
  }

  if (assetType === "mutual_fund") {
    return normalizedType.includes("fund") && !normalizedType.includes("etf");
  }

  if (assetType === "bond") {
    return normalizedType.includes("bond");
  }

  return normalizedType.includes("stock") && !normalizedType.includes("etf");
}

function normalizeSearchSymbol(
  code: string,
  exchange: string | undefined,
  assetType: MarketSymbolSearchType
) {
  if (code.includes(".")) return code;
  if (assetType === "crypto" && exchange === "CC") return `${code}.CC`;
  return code;
}

function dedupeSymbolResults(results: MarketSymbolSearchResult[]) {
  const seenSymbols = new Set<string>();

  return results.filter((result) => {
    const symbol = result.symbol.toUpperCase();
    if (seenSymbols.has(symbol)) return false;

    seenSymbols.add(symbol);
    return true;
  });
}

function getEodhdSearchType(assetType: MarketSymbolSearchType) {
  if (assetType === "mutual_fund") return "fund";
  if (assetType === "stock" || assetType === "etf" || assetType === "bond") return assetType;
  return null;
}

function optionalString(value: unknown) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue ? normalizedValue : undefined;
}
