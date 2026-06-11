import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/prices/route";
import { GET as getSymbols } from "@/app/api/symbols/route";
import {
  fetchEodhdLatestPrice,
  fetchEodhdSymbolSearch,
  normalizeEodhdSymbol,
  parseEodhdLatestPrice,
  parseEodhdSymbolSearchResults
} from "@/lib/market-data/eodhd";

describe("EODHD helpers", () => {
  it("adds .US to plain US stock and ETF symbols", () => {
    expect(normalizeEodhdSymbol("vti", "etf")).toBe("VTI.US");
    expect(normalizeEodhdSymbol("AAPL", "stock")).toBe("AAPL.US");
  });

  it("keeps explicit EODHD symbols unchanged", () => {
    expect(normalizeEodhdSymbol("BTC-USD.CC", "crypto")).toBe("BTC-USD.CC");
    expect(normalizeEodhdSymbol("VTI.US", "etf")).toBe("VTI.US");
  });

  it("keeps direct bond identifiers unchanged for manual EODHD fallback", () => {
    expect(normalizeEodhdSymbol("912797HD4", "bond")).toBe("912797HD4");
    expect(normalizeEodhdSymbol("US912797HD45", "bond")).toBe("US912797HD45");
  });

  it("parses the newest EODHD close from descending results", () => {
    expect(
      parseEodhdLatestPrice("VTI", [
        { date: "2026-06-05", close: 301.25 },
        { date: "2026-06-04", close: 300.1 }
      ])
    ).toEqual({
      symbol: "VTI",
      priceDate: "2026-06-05",
      closePrice: 301.25,
      source: "eodhd_eod"
    });
  });

  it("prefers adjusted_close when available and positive", () => {
    expect(
      parseEodhdLatestPrice("AAPL", [
        { date: "2026-06-05", close: 202.9, adjusted_close: 203.92 }
      ])
    ).toEqual({
      symbol: "AAPL",
      priceDate: "2026-06-05",
      closePrice: 203.92,
      source: "eodhd_eod"
    });
  });

  it("returns manual required when there are no usable rows", () => {
    expect(
      parseEodhdLatestPrice("VTI", [
        { date: "2026-06-05", close: 0 },
        { date: "2026-06-04", close: -1, adjusted_close: 0 }
      ])
    ).toEqual({
      symbol: "VTI",
      priceDate: expect.any(String),
      closePrice: null,
      source: "manual_required",
      warning: "Could not fetch latest price. Enter a manual price or try again later."
    });
  });

  it("returns unsupported for option assets without calling fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await expect(fetchEodhdLatestPrice("AAPL260116C00200000", "test-key", "option")).resolves.toEqual({
      symbol: "AAPL260116C00200000",
      priceDate: expect.any(String),
      closePrice: null,
      source: "unsupported",
      warning: "Options are not supported by automated price refresh yet. Enter a manual price."
    });
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});

describe("EODHD symbol search", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("parses provider symbol rows into Phase 1 symbol choices", () => {
    expect(
      parseEodhdSymbolSearchResults(
        [
          {
            Code: "AAPL",
            Name: "Apple Inc",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock"
          },
          {
            Code: "VTI",
            Name: "Vanguard Total Stock Market ETF",
            Exchange: "US",
            Currency: "USD",
            Type: "ETF"
          },
          {
            Code: "BTC-USD",
            Name: "Bitcoin USD",
            Exchange: "CC",
            Currency: "USD",
            Type: "Currency"
          }
        ],
        "crypto"
      )
    ).toEqual([
      {
        symbol: "BTC-USD.CC",
        name: "Bitcoin USD",
        exchange: "CC",
        currency: "USD",
        type: "crypto"
      }
    ]);
  });

  it("fetches symbol choices without returning the API key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            Code: "AAPL",
            Name: "Apple Inc",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock"
          }
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    const results = await fetchEodhdSymbolSearch("apple", "secret-route-key", "stock");

    expect(results).toEqual([
      {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "US",
        currency: "USD",
        type: "stock"
      }
    ]);
    expect(JSON.stringify(results)).not.toContain("secret-route-key");
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/search/apple?"),
      expect.any(Object)
    );
  });

  it("serves Phase 1 symbol choices from the symbols API", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            Code: "VTI",
            Name: "Vanguard Total Stock Market ETF",
            Exchange: "US",
            Currency: "USD",
            Type: "ETF"
          }
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    const response = await getSymbols(
      new Request("http://localhost/api/symbols?query=vanguard&type=etf")
    );
    const payload = await response.json();

    expect(payload).toEqual({
      symbols: [
        {
          symbol: "VTI",
          name: "Vanguard Total Stock Market ETF",
          exchange: "US",
          currency: "USD",
          type: "etf"
        }
      ],
      warning: null
    });
    expect(JSON.stringify(payload)).not.toContain("secret-route-key");
  });

  it("parses mixed market holding symbol choices without a requested type", () => {
    expect(
      parseEodhdSymbolSearchResults([
        {
          Code: "AAPL",
          Name: "Apple Inc",
          Exchange: "US",
          Currency: "USD",
          Type: "Common Stock"
        },
        {
          Code: "VTI",
          Name: "Vanguard Total Stock Market ETF",
          Exchange: "US",
          Currency: "USD",
          Type: "ETF"
        },
        {
          Code: "VFINX",
          Name: "Vanguard 500 Index Fund",
          Exchange: "US",
          Currency: "USD",
          Type: "FUND"
        },
        {
          Code: "BTC-USD",
          Name: "Bitcoin USD",
          Exchange: "CC",
          Currency: "USD",
          Type: "Currency"
        },
        {
          Code: "US912797HD45",
          Name: "United States Treasury Bill",
          Exchange: "BOND",
          Currency: "USD",
          Type: "Bond"
        }
      ])
    ).toEqual([
      {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "US",
        currency: "USD",
        type: "stock"
      },
      {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        exchange: "US",
        currency: "USD",
        type: "etf"
      },
      {
        symbol: "VFINX",
        name: "Vanguard 500 Index Fund",
        exchange: "US",
        currency: "USD",
        type: "mutual_fund"
      },
      {
        symbol: "BTC-USD.CC",
        name: "Bitcoin USD",
        exchange: "CC",
        currency: "USD",
        type: "crypto"
      },
      {
        symbol: "US912797HD45",
        name: "United States Treasury Bill",
        exchange: "BOND",
        currency: "USD",
        type: "bond"
      }
    ]);
  });

  it("passes type=bond through to EODHD search when direct bonds are requested", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            Code: "US912797HD45",
            Name: "United States Treasury Bill",
            Exchange: "BOND",
            Currency: "USD",
            Type: "Bond"
          }
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    const results = await fetchEodhdSymbolSearch("912797HD45", "secret-route-key", "bond");

    expect(results).toEqual([
      {
        symbol: "US912797HD45",
        name: "United States Treasury Bill",
        exchange: "BOND",
        currency: "USD",
        type: "bond"
      }
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("type=bond"),
      expect.any(Object)
    );
  });

  it("serves combined market holding choices when type is omitted", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            Code: "AAPL",
            Name: "Apple Inc",
            Exchange: "US",
            Currency: "USD",
            Type: "Common Stock"
          },
          {
            Code: "VTI",
            Name: "Vanguard Total Stock Market ETF",
            Exchange: "US",
            Currency: "USD",
            Type: "ETF"
          }
        ]),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    const response = await getSymbols(new Request("http://localhost/api/symbols?query=apple"));
    const payload = await response.json();

    expect(payload.symbols).toEqual([
      {
        symbol: "AAPL",
        name: "Apple Inc",
        exchange: "US",
        currency: "USD",
        type: "stock"
      },
      {
        symbol: "VTI",
        name: "Vanguard Total Stock Market ETF",
        exchange: "US",
        currency: "USD",
        type: "etf"
      }
    ]);
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/search/apple?"),
      expect.any(Object)
    );
    expect(JSON.stringify(payload)).not.toContain("secret-route-key");
  });
});

describe("prices API EODHD route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns manual required rows when EODHD_API_KEY is missing", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(new Request("http://localhost/api/prices?symbols=AAPL,VTI"));
    const payload = await response.json();

    expect(payload).toEqual({
      prices: [
        {
          symbol: "AAPL",
          priceDate: expect.any(String),
          closePrice: null,
          source: "manual_required",
          warning: "Could not fetch latest price. Enter a manual price or try again later."
        },
        {
          symbol: "VTI",
          priceDate: expect.any(String),
          closePrice: null,
          source: "manual_required",
          warning: "Could not fetch latest price. Enter a manual price or try again later."
        }
      ],
      warning: "Some prices could not be fetched. Enter a manual price or try again later."
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uses assetTypes query to return unsupported options without calling fetch", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(
      new Request(
        "http://localhost/api/prices?symbols=AAPL260116C00200000&assetTypes=AAPL260116C00200000:option"
      )
    );
    const payload = await response.json();

    expect(payload.prices).toEqual([
      {
        symbol: "AAPL260116C00200000",
        priceDate: expect.any(String),
        closePrice: null,
        source: "unsupported",
        warning: "Options are not supported by automated price refresh yet. Enter a manual price."
      }
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not include the EODHD API key in the JSON response", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ date: "2026-06-05", close: 203.92 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const response = await GET(new Request("http://localhost/api/prices?symbols=AAPL"));
    const responseBody = JSON.stringify(await response.json());

    expect(responseBody).not.toContain("secret-route-key");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("deduplicates requested symbols", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ date: "2026-06-05", close: 301.25 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const response = await GET(new Request("http://localhost/api/prices?symbols=AAPL,aapl,AAPL"));
    const payload = await response.json();

    expect(payload.prices).toHaveLength(1);
    expect(payload.prices[0].symbol).toBe("AAPL");
    expect(fetchSpy).toHaveBeenCalledOnce();
  });

  it("infers obvious crypto symbols when assetTypes is omitted", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ date: "2026-06-05", close: 65000 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    await GET(new Request("http://localhost/api/prices?symbols=BTC-USD"));

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/api/eod/BTC-USD?"),
      expect.any(Object)
    );
  });

  it("infers OCC-like option symbols when assetTypes is omitted", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(
      new Request("http://localhost/api/prices?symbols=AAPL260116C00200000")
    );
    const payload = await response.json();

    expect(payload.prices).toEqual([
      {
        symbol: "AAPL260116C00200000",
        priceDate: expect.any(String),
        closePrice: null,
        source: "unsupported",
        warning: "Options are not supported by automated price refresh yet. Enter a manual price."
      }
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
