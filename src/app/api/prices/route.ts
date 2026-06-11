import { NextResponse } from "next/server";
import { fetchEodhdLatestPrice, inferEodhdAssetType } from "@/lib/market-data/eodhd";
import type { FetchedMarketPrice } from "@/types/market-data";
import type { Phase1AssetType } from "@/types/phase1";

const EOD_WARNING =
  "End-of-day prices fetched. Market data may be delayed, stale, estimated, or manually entered.";
const MANUAL_WARNING = "Could not fetch latest price. Enter a manual price or try again later.";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = Array.from(
    new Set(
      (searchParams.get("symbols") ?? "")
        .split(",")
        .map((symbol) => symbol.trim().toUpperCase())
        .filter(Boolean)
    )
  );
  const assetTypes = parseAssetTypes(searchParams.get("assetTypes"));

  if (symbols.length === 0) {
    return NextResponse.json({ prices: [], warning: "No symbols requested." });
  }

  const provider = process.env.MARKET_DATA_PROVIDER ?? "eodhd";
  const eodhdApiKey = process.env.EODHD_API_KEY;
  const prices =
    provider === "eodhd" && eodhdApiKey
      ? await Promise.all(
          symbols.map((symbol) =>
            fetchEodhdLatestPrice(
              symbol,
              eodhdApiKey,
              assetTypes.get(symbol) ?? inferEodhdAssetType(symbol)
            )
          )
        )
      : symbols.map((symbol) => manualRequiredPrice(symbol));

  return NextResponse.json({
    prices,
    warning: prices.some((price) => price.closePrice === null)
      ? "Some prices could not be fetched. Enter a manual price or try again later."
      : EOD_WARNING
  });
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

function manualRequiredPrice(symbol: string): FetchedMarketPrice {
  return {
    symbol,
    priceDate: new Date().toISOString().slice(0, 10),
    closePrice: null,
    source: "manual_required",
    warning: MANUAL_WARNING
  };
}
