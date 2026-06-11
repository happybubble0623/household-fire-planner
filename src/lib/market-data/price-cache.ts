import type { MarketPrice } from "@/types/market-data";

const memoryCache = new Map<string, MarketPrice>();

export function getPriceCacheKey(symbol: string, priceDate: string) {
  return `${symbol.toUpperCase()}:${priceDate}`;
}

export function readCachedPrice(symbol: string, priceDate: string) {
  return memoryCache.get(getPriceCacheKey(symbol, priceDate)) ?? null;
}

export function writeCachedPrice(price: MarketPrice) {
  memoryCache.set(getPriceCacheKey(price.symbol, price.priceDate), price);
  return price;
}
