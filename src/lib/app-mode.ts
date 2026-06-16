// "App mode" = the site running inside the Capacitor iOS app (the native shell
// loads the live site as a hosted WebView). The mobile redesign (bottom tab
// bar, hidden website header, snapshot/strategy switcher, holdings cards, …)
// must apply ONLY in app mode. The normal website — desktop AND mobile web —
// is the default and is unaffected.
//
// Detection signal, in order of trust:
//   1. The Capacitor shell opens its `server.url` with `?pmfApp=1` (see
//      capacitor.config.ts), so the very first in-app load carries the flag.
//   2. `window.Capacitor.isNativePlatform()` is true inside the native runtime.
//   3. Once detected we persist a `pmf_app=1` cookie + localStorage so app mode
//      survives in-app navigations (where the query flag is gone) AND can be
//      read SERVER-SIDE in the root layout to gate SSR from the first paint.

export const APP_MODE_COOKIE = "pmf_app";
export const APP_MODE_STORAGE_KEY = "pmf_app";
export const APP_MODE_QUERY_PARAM = "pmfApp";

// The Capacitor iOS shell appends this token to the WebView's User-Agent (see
// `ios.appendUserAgent` in capacitor.config.ts). Unlike the cookie or query
// flag, the User-Agent rides on EVERY HTTP request the WebView makes — the
// initial document, every full-page reload, AND every server round-trip — and
// it is the same in-process value the browser exposes as `navigator.userAgent`.
// That makes it the one app-mode signal that:
//   • the SERVER can read on a bare full-load (the root layout can't read the
//     query param, and WKWebView does not reliably attach the `document.cookie`
//     cookie to navigation requests), so SSR gates app mode from the first byte
//     with no website-chrome flash; and
//   • does not depend on cookie/localStorage persistence (unreliable across
//     WKWebView navigations) or on the Capacitor bridge being injected.
// Normal browsers never carry this token, so the website is unaffected.
export const APP_MODE_USER_AGENT_TAG = "PlanMyFIREApp";

// Works on both the server (pass a request User-Agent header) and the client
// (pass navigator.userAgent). Pure + side-effect-free so it's safe to import in
// a Server Component.
export function isAppModeUserAgent(userAgent: string | null | undefined): boolean {
  return typeof userAgent === "string" && userAgent.includes(APP_MODE_USER_AGENT_TAG);
}

type CapacitorGlobal = {
  Capacitor?: { isNativePlatform?: () => boolean };
};

// Client-only. Returns true if this load looks like the Capacitor iOS app:
// the launch query flag, the native runtime, or a previously-persisted marker
// (cookie / localStorage) from an earlier in-app load.
export function detectAppModeClient(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const params = new URLSearchParams(window.location.search);
    if (params.get(APP_MODE_QUERY_PARAM) === "1") return true;
  } catch {
    // Malformed URL — fall through to the other signals.
  }

  // The native shell's appended User-Agent token is present on every in-app
  // load (full or client-side), so this re-confirms app mode even when the
  // query flag, cookie, and localStorage are all absent.
  if (typeof navigator !== "undefined" && isAppModeUserAgent(navigator.userAgent)) {
    return true;
  }

  const capacitor = (window as unknown as CapacitorGlobal).Capacitor;
  if (typeof capacitor?.isNativePlatform === "function" && capacitor.isNativePlatform()) {
    return true;
  }

  if (typeof document !== "undefined" && document.cookie.includes(`${APP_MODE_COOKIE}=1`)) {
    return true;
  }

  try {
    if (window.localStorage?.getItem(APP_MODE_STORAGE_KEY) === "1") return true;
  } catch {
    // Storage can throw in private modes — ignore.
  }

  return false;
}

// Client-only. Persists app mode so it survives in-app navigations and is
// readable server-side (cookie) for flash-free SSR gating on later loads.
export function persistAppModeClient(): void {
  if (typeof document !== "undefined") {
    // ~1 year, site-wide, Lax so it rides along with in-app navigations.
    document.cookie = `${APP_MODE_COOKIE}=1; path=/; max-age=31536000; SameSite=Lax`;
  }

  try {
    window.localStorage?.setItem(APP_MODE_STORAGE_KEY, "1");
  } catch {
    // Storage unavailable — the cookie alone is enough to persist app mode.
  }
}
