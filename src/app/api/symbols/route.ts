import { NextResponse } from "next/server";
import { fetchEodhdSymbolSearch } from "@/lib/market-data/eodhd";
import type { MarketSymbolSearchType } from "@/types/market-data";

const SYMBOL_SEARCH_UNAVAILABLE =
  "Symbol search is unavailable. Check EODHD_API_KEY or enter assets by import fallback.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const rawType = searchParams.get("type");
  const type = parseSymbolSearchType(rawType);

  if (rawType && !type) {
    return NextResponse.json({
      symbols: [],
      warning: "Symbol search supports stocks, ETFs, mutual funds, crypto, and bonds."
    });
  }

  if (query.length < 2) {
    return NextResponse.json({
      symbols: [],
      warning: "Type at least 2 characters to search symbols."
    });
  }

  const provider = process.env.MARKET_DATA_PROVIDER ?? "eodhd";
  const eodhdApiKey = process.env.EODHD_API_KEY;

  if (provider !== "eodhd" || !eodhdApiKey) {
    return NextResponse.json({ symbols: [], warning: SYMBOL_SEARCH_UNAVAILABLE });
  }

  return NextResponse.json({
    symbols: await fetchEodhdSymbolSearch(query, eodhdApiKey, type ?? undefined),
    warning: null
  });
}

function parseSymbolSearchType(value: string | null): MarketSymbolSearchType | null {
  if (
    value === "stock" ||
    value === "etf" ||
    value === "mutual_fund" ||
    value === "crypto" ||
    value === "bond"
  ) {
    return value;
  }

  return null;
}
