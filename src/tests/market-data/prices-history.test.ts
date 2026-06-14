import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/prices/history/route";
import {
  fetchEodhdMonthlyHistory,
  parseEodhdMonthlySeries
} from "@/lib/market-data/eodhd-history";

describe("parseEodhdMonthlySeries", () => {
  it("prefers adjusted_close, drops bad rows, and sorts ascending", () => {
    expect(
      parseEodhdMonthlySeries([
        { date: "2025-03-31", close: 90, adjusted_close: 91 },
        { date: "2025-01-31", close: 100 },
        { date: "2025-02-28", close: 0 },
        { date: "2025-04-30", close: -5, adjusted_close: 0 }
      ])
    ).toEqual([
      { date: "2025-01-31", close: 100 },
      { date: "2025-03-31", close: 91 }
    ]);
  });

  it("returns an empty series for non-array payloads", () => {
    expect(parseEodhdMonthlySeries(null)).toEqual([]);
    expect(parseEodhdMonthlySeries({ error: "nope" })).toEqual([]);
  });
});

describe("fetchEodhdMonthlyHistory", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests a monthly, ascending, windowed series and never leaks the key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify([{ date: "2025-01-31", close: 100 }]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      })
    );

    const points = await fetchEodhdMonthlyHistory(
      "VTI",
      "secret-route-key",
      { from: "2015-06-13", to: "2025-06-13" },
      "etf"
    );

    expect(points).toEqual([{ date: "2025-01-31", close: 100 }]);
    const [requestedUrl] = fetchSpy.mock.calls[0];
    expect(String(requestedUrl)).toContain("/api/eod/VTI.US?");
    expect(String(requestedUrl)).toContain("period=m");
    expect(String(requestedUrl)).toContain("order=a");
    expect(String(requestedUrl)).toContain("from=2015-06-13");
  });

  it("returns an empty series without calling fetch when the key is missing", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await expect(
      fetchEodhdMonthlyHistory("VTI", undefined, { from: "2015-06-13", to: "2025-06-13" })
    ).resolves.toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("prices history API route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns an empty map when no symbols are requested", async () => {
    const response = await GET(new Request("http://localhost/api/prices/history?symbols="));
    expect(await response.json()).toEqual({ series: {}, warning: "No symbols requested." });
  });

  it("returns history per symbol and flags missing ones without leaking the key", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("/api/eod/SPY")) {
        return new Response(JSON.stringify([{ date: "2025-01-31", close: 400 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    });

    const response = await GET(
      new Request("http://localhost/api/prices/history?symbols=SPY,ZZZ&years=10")
    );
    const payload = await response.json();

    expect(payload.series.SPY).toEqual([{ date: "2025-01-31", close: 400 }]);
    expect(payload.series.ZZZ).toEqual([]);
    expect(payload.warning).toContain("ZZZ");
    expect(JSON.stringify(payload)).not.toContain("secret-route-key");
  });

  it("resolves a batch larger than the legacy 30-symbol cap, keyed by the requested symbol", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "secret-route-key");
    // Echo a single point back for every symbol so each one has history. A fresh
    // Response per call is required — a Response body stream can only be read once.
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify([{ date: "2025-01-31", close: 100 }]), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        })
    );

    // 35 distinct tickers — beyond the old MAX_SYMBOLS=30 truncation.
    const symbols = Array.from({ length: 35 }, (_, index) => `SYM${index}`);
    const response = await GET(
      new Request(`http://localhost/api/prices/history?symbols=${symbols.join(",")}&years=10`)
    );
    const payload = await response.json();

    // No silent truncation: every requested symbol comes back, keyed by the
    // exact requested string (not a normalized "SYM0.US").
    expect(Object.keys(payload.series)).toHaveLength(35);
    for (const symbol of symbols) {
      expect(payload.series[symbol]).toEqual([{ date: "2025-01-31", close: 100 }]);
    }
  });

  it("reports history unavailable when the key is absent", async () => {
    vi.stubEnv("MARKET_DATA_PROVIDER", "eodhd");
    vi.stubEnv("EODHD_API_KEY", "");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await GET(new Request("http://localhost/api/prices/history?symbols=SPY"));
    const payload = await response.json();

    expect(payload.series).toEqual({});
    expect(payload.warning).toContain("unavailable");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
