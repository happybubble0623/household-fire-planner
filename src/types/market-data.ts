export type MarketPrice = {
  symbol: string;
  priceDate: string;
  closePrice: number;
  source: "manual_override" | "cache" | "free_eod_api" | "static_sample";
  fetchedAt?: string;
  stale?: boolean;
  warning?: string;
};

export type FetchedMarketPrice = {
  symbol: string;
  priceDate: string;
  closePrice: number | null;
  source: "alpha_vantage_eod" | "eodhd_eod" | "manual_required" | "unsupported";
  warning?: string;
};

export type MarketSymbolSearchType = "stock" | "etf" | "mutual_fund" | "crypto" | "bond";

export type MarketSymbolSearchResult = {
  symbol: string;
  name: string;
  exchange?: string;
  currency?: string;
  type: MarketSymbolSearchType;
};
