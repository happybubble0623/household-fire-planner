// v1 native shell points at the HOSTED site (hosted-shell approach) — it does NOT
// bundle a static web build. `webDir: "public"` is only a placeholder to satisfy
// the Capacitor CLI; the live app is loaded from `server.url` below.
//
// ⚠️ Revisit before App Store submission re: Apple Guideline 4.2 ("Minimum
// Functionality" — a pure webview wrapper gets rejected). To clear it we'll need
// genuine native value (v1: Face ID lock) and likely some bundling / offline
// snapshot / native features rather than a bare pointer at the website.
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.planmyfi.app',
  appName: 'Plan My FIRE',
  webDir: 'public',
  ios: {
    // Append a stable token to the WKWebView User-Agent so the hosted site can
    // detect APP MODE on the SERVER for every request — including a bare
    // full-page reload from a bottom-tab tap, where the query flag is gone and
    // WKWebView does not reliably attach the persisted `pmf_app` cookie. The
    // server (root layout) keys app mode off this token (see
    // APP_MODE_USER_AGENT_TAG in src/lib/app-mode.ts), so SSR renders the
    // in-app chrome from the first byte and never flashes the website header.
    // Must stay in sync with APP_MODE_USER_AGENT_TAG. Requires `npx cap sync ios`
    // + a native rebuild to take effect (the UA is baked into the build).
    appendUserAgent: 'PlanMyFIREApp',
  },
  server: {
    // Open the app straight into the plan (Portfolio Drawdown strategy) — app
    // users have already converted, so skip the marketing hub. The website's
    // own `/` redirect is unchanged; this only affects the native shell.
    //
    // `?pmfApp=1` flags the very first in-app load as APP MODE: the site reads
    // it, persists a `pmf_app=1` cookie + localStorage, and from then on serves
    // the mobile-app redesign (bottom tab bar, hidden header, etc.). Normal
    // browsers never carry this flag, so the website stays in website mode. The
    // appended User-Agent token above is the durable server-side signal; this
    // flag remains as a belt-and-suspenders client signal for the first load.
    url: 'https://www.planmyfi.com/app/fire-path/withdrawal-rate?pmfApp=1',
    // CRITICAL — keep ALL in-app navigation inside the WebView. Capacitor only
    // treats a top-level navigation as "in-app" if the URL string STARTS WITH
    // the full `server.url` above (path + query included) OR its host matches
    // `allowNavigation` (see WebViewDelegationHandler.decidePolicyFor). Because
    // `server.url` carries a deep launch path, a full-document navigation to a
    // DIFFERENT path (e.g. tapping the Calculators tab → /app/calculators) fails
    // the prefix test and Capacitor hands it to Safari, ejecting the user from
    // the app. Allowing the host(s) makes the host match win first, so every
    // same-site navigation — any path, with or without the query — stays in the
    // WebView. Apex + wildcard cover the www→apex 308 and any future subdomain.
    allowNavigation: ['planmyfi.com', '*.planmyfi.com'],
    cleartext: false,
  },
};

export default config;
