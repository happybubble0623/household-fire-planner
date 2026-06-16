/*
 * Plan My FIRE offline service worker.
 *
 * Goal: the app shell and the calculator routes load and run with no network,
 * so the native Capacitor shell (which loads the remote site) is not a blank
 * screen when offline. The calculators compute entirely client-side, so once
 * the shell + their JS/CSS chunks are cached they work fully offline.
 *
 * Strategy:
 *   - Navigations: network-first, cache-fallback (fresh when online, the cached
 *     route or app-shell when offline).
 *   - Same-origin static assets (Next /_next/static chunks, fonts, brand SVGs,
 *     images): stale-while-revalidate, so offline reloads have everything.
 *   - /api/* (live prices): never cached. Returns a clean 503 {offline:true}
 *     when the network is down so callers can degrade gracefully.
 *
 * Hashed Next chunks can't be precached by name from a hand-written SW, so they
 * are captured at runtime on the first online visit and served from cache after.
 */

const VERSION = "v1";
const PRECACHE = `pmf-precache-${VERSION}`;
const RUNTIME = `pmf-runtime-${VERSION}`;

// App shell + the six calculator tools and their hub routes. These are fetched
// at install so a cold offline start has the route document to fall back to.
const APP_SHELL = "/app/fire-path/withdrawal-rate";
const PRECACHE_ROUTES = [
  APP_SHELL,
  "/app/calculators",
  "/app/more",
  "/app/fire-path/tools/social-security",
  "/app/fire-path/tools/healthcare",
  "/app/fire-path/tools/mortgage",
  "/app/fire-path/tools/investment",
  "/app/fire-path/tools/expenses",
  "/app/fire-path/tools/tax"
];

// Brand assets + manifest + icon. Small, stable, safe to precache by name.
const PRECACHE_ASSETS = [
  "/manifest.webmanifest",
  "/favicon.svg",
  "/brand/mark-a.svg",
  "/brand/mark-b.svg",
  "/brand/mark-c.svg",
  "/brand/wordmark.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // Resilient: a single 404/redirect must not abort the whole install, so
      // each entry is added independently and failures are ignored.
      await Promise.allSettled(
        [...PRECACHE_ROUTES, ...PRECACHE_ASSETS].map((url) =>
          cache.add(new Request(url, { cache: "reload" }))
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  // Live data: never serve stale prices. Fail cleanly when offline.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(request).catch(
        () =>
          new Response(JSON.stringify({ offline: true, error: "offline" }), {
            status: 503,
            headers: { "Content-Type": "application/json" }
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached =
      (await cache.match(request, { ignoreSearch: true })) ||
      (await caches.match(request, { ignoreSearch: true })) ||
      (await caches.match(APP_SHELL, { ignoreSearch: true }));
    if (cached) return cached;
    return new Response("You're offline.", {
      status: 503,
      headers: { "Content-Type": "text/plain" }
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => undefined);
  return cached || (await network) || new Response("", { status: 504 });
}
