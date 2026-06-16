# iOS App Mode & Native-Shell Navigation — Engineering Reference

*Created: 2026-06-16 · Companion to [IOS_APP_STRATEGY.md](./IOS_APP_STRATEGY.md) (positioning) — this doc is the **implementation** record.*

How the same hosted website renders a distinct **app experience** inside the Capacitor iOS shell, and the native-shell gotchas that have already bitten us. The iOS app is a **hosted-shell**: the native app loads the LIVE site (`https://www.planmyfi.com/...`); it does **not** bundle a web build. So **web changes deploy via Vercel and reach the app on next open — no rebuild** (see §5).

> **Golden rule:** every app-only UI change must be gated on app mode. The **website must stay byte-for-byte unchanged** for normal browsers.

---

## 1. App-mode detection

"App mode" = the redesign that only shows inside the iOS shell: hidden website header, bottom tab bar, snapshot/strategy switcher, etc.

**Signals & precedence** — client detector `detectAppModeClient()` in `src/lib/app-mode.ts`, in trust order:

1. **`?pmfApp=1` query flag** (`APP_MODE_QUERY_PARAM = "pmfApp"`) — carried by the launch URL and every bottom-tab link.
2. **User-Agent token `PlanMyFIREApp`** (`APP_MODE_USER_AGENT_TAG`) — the durable signal; see below.
3. **`window.Capacitor.isNativePlatform()`** — NOT reliable for a remote `server.url`, so it's only a fallback.
4. **`pmf_app=1` cookie** (`APP_MODE_COOKIE = "pmf_app"`).
5. **`localStorage` `pmf_app=1`** (`APP_MODE_STORAGE_KEY`).

Once detected, `persistAppModeClient()` writes the cookie (1yr, `SameSite=Lax`) + localStorage so later in-app loads stay in app mode.

**Server-side SSR gate** — `src/app/layout.tsx` renders the in-app chrome from the **first byte** (no website-header flash) by gating on **UA-token OR cookie**:

```ts
const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
const isAppMode =
  isAppModeUserAgent(headerStore.get("user-agent")) ||      // src/lib/app-mode.ts
  cookieStore.get(APP_MODE_COOKIE)?.value === "1";
// → <html data-app-mode={isAppMode ? "1" : undefined}> and AppModeProvider initialIsAppMode
```

**Why the UA token is the durable one:** the User-Agent rides on **every** request — the initial document, every full-page reload, every RSC round-trip. A Next.js **layout cannot read query params** (only pages can), and WKWebView does **not** reliably attach the `document.cookie` cookie to navigation requests. So on a bare full-document load the UA token is the only signal the server can trust. The token is appended natively via `capacitor.config.ts` → `ios.appendUserAgent` (§3).

**Consuming app mode in components:** `useIsAppMode()` from `src/components/app-mode-provider.tsx`. ALL app-only UI is gated on it (tab bar, hidden header, in-app pointers). Provider seeds from `initialIsAppMode` (SSR) and only ever upgrades to app mode, never down — so it agrees with SSR and never flashes. Normal browsers carry none of these signals → website mode → website unchanged.

---

## 2. Capacitor "tabs open Safari" gotcha — DO NOT REINTRODUCE

**Symptom we hit:** tapping a bottom tab ejected the user out of the app into **Safari**.

**Root cause (from Capacitor source `node_modules/@capacitor/ios/Capacitor/Capacitor/WebViewDelegationHandler.swift`, `decidePolicyFor`):** a top-level navigation stays in the WebView only if **either**

- its **host** is allowed by `server.allowNavigation` (`shouldAllowNavigation(to:)`, ~line 96), **or**
- the URL string **`starts(with:)` the FULL `server.url`** — *including its deep path and query* (`isApplicationNavigation`, ~line 105).

Otherwise Capacitor calls `UIApplication.shared.open(navURL)` → **Safari**, and cancels the in-app load (~line 108–113).

Because `server.url` is a **deep path** (`/app/fire-path?pmfApp=1`) and `allowNavigation` was **unset**, a full-document navigation to any *other* path (e.g. `/app/calculators`) failed the prefix test → Safari. (It regressed exactly when `server.url` went from bare host `https://www.planmyfi.com` to the deep path.) Note: it was **not** a cross-host redirect — all `/app/*` routes return 200 on `www` with 0 redirects.

**Fix (config of record):**

```ts
server: { allowNavigation: ['planmyfi.com', '*.planmyfi.com'], ... }
```

Host match wins first, so **every same-site navigation stays in the WebView**, any path, full-load or SPA, with/without the query. Matching is host-based (`CAPInstanceConfiguration.doesHost`): the wildcard `*.planmyfi.com` matches `www.` and any subdomain (equal dot-count required), and the literal `planmyfi.com` covers the apex (and the apex→www 308). `target="_blank"` / `window.open` always open Safari (`createWebViewWith`) regardless — so in-app links must never use them (the one `target="_blank"` in `src/components/planning/fire-strategy-panel.tsx` is gated to **non**-app-mode).

---

## 3. Config of record

**`capacitor.config.ts`:**

```ts
server: {
  url: 'https://www.planmyfi.com/app/fire-path?pmfApp=1',  // cold launch = Plan HUB (§4)
  allowNavigation: ['planmyfi.com', '*.planmyfi.com'],     // §2 — never remove
  cleartext: false,
},
ios: {
  appendUserAgent: 'PlanMyFIREApp',                        // §1 — must equal APP_MODE_USER_AGENT_TAG
},
```

**`ios/App/App/Info.plist`:** **no `WKAppBoundDomains`** today. Consequence: **WKWebView does not run service workers** for remote content, so `public/sw.js` **never executes in the iOS app** — it is a **website-PWA-only** feature. (App HTML is served `no-store` with content-hashed chunks, so the WebView fetches fresh HTML every launch anyway.) If real in-app offline/PWA is ever wanted, add `WKAppBoundDomains` + `limitsNavigationsToAppBoundDomains` — separate change.

**`public/sw.js`** (website PWA only): `VERSION = "v2"`; navigations **and** RSC requests are network-first (a deploy is never shadowed by a stale shell); hashed `/_next/static` stay cache-first; registered with `updateViaCache: "none"` in `src/components/pwa/service-worker-register.tsx`.

---

## 4. Navigation / IA decisions

- **Cold launch → Plan-tab HOME HUB** `/app/fire-path` (`fireView="home"` → `PathToFirePanel`, the "guided path to early retirement" hero with *Track your whole portfolio* / *Map your path*). Set via `server.url`. NOT a specific strategy.
- **Bottom tab bar** — `src/components/layout/mobile-tab-bar.tsx`, app-mode-gated (renders `null` on the website). Tabs: **Plan** `/app/fire-path` · **Calculators** `/app/calculators` · **Portfolio** `/app/portfolio-lab` · **More** `/app/more`. Every href carries `?pmfApp=1`.
- **Plan tab returns to the HUB** (current behavior, commit `80b7529`). Highlight uses **broad** `isActive` (`startsWith("/app/fire-path")`) so Plan stays lit across the hub **and** every strategy page (keeps the `StrategySwitcher` in `fire-strategy-panel.tsx` happy). The scroll-to-top gesture keys off the **exact** destination (`pathname === tab.href`), so a re-tap while on the hub scrolls; from a strategy page, tapping Plan navigates back to the hub.
  - *Note:* this requirement flip-flopped during the session — `c077fe3` (Plan→hub) → `f08cf72` (Plan→strategy workspace) → `80b7529` (Plan→hub, **current**). If it changes again, only the Plan `href` in `mobile-tab-bar.tsx` needs editing; keep the broad `isActive` + exact-destination scroll.
- **Strategy routes** `/app/fire-path/{withdrawal-rate,income-stream,principal-preserving}` → `FireStrategyPanel` ("Refine your estimate with these calculators" → `StrategyCalculatorLinks`) with the strategy switcher.
- **"Check more calculators" link** (app-only, → `/app/calculators`) appears in **two** places, both gated on `useIsAppMode()`: the hub's "Free calculators that sharpen…" section (`src/components/planning/path-to-fire-panel.tsx`) and the strategy view's `StrategyCalculatorLinks` (`src/components/planning/fire-strategy-panel.tsx`).

---

## 5. Deploy / rebuild model (read before shipping changes)

| Change type | Files | How it reaches the app |
|---|---|---|
| **Web code** | `src/**`, `public/sw.js` | Vercel deploy → reaches the app on **next open/reload, NO rebuild** (app loads the live site; HTML is `no-store`). |
| **Native shell** | `capacitor.config.ts` (`server.url`, `allowNavigation`, `appendUserAgent`), `ios/App/App/Info.plist` | Bundled into the native build → requires **`npx cap sync ios` + Xcode rebuild + reinstall**. Reopening the current build does NOT pick it up. |

```bash
npx cap sync ios     # writes server.url + allowNavigation + appendUserAgent into the native config
npx cap open ios     # Xcode → Run onto the device (reinstall over the app is fine; no full delete)
```

**Vercel deploy constraint:** commits to `main` **must be authored `happybubble0623 <blueocean.wh@gmail.com>`** or Vercel Hobby blocks the deploy (so the app never sees the change). Use `git -c user.name=... -c user.email=...` when committing.

---

## 6. Session changelog (2026-06-16)

One line each; all on `origin/main`.

| Commit | Purpose |
|---|---|
| `47a75bc` | Clamp in-app `<main>` (`overflow-x: clip`) so WKWebView can't latch a wide viewport on sign-out. |
| `b257e82` | Add app-only "Check more calculators" link to the hub calculators section (`path-to-fire-panel.tsx`). |
| `0bb9f05` | Carry `?pmfApp=1` on tab links; add the "Check more calculators" link to the strategy view (`StrategyCalculatorLinks`). |
| `ced86ff` | **App-mode via WebView User-Agent** (`appendUserAgent` + server-side `isAppModeUserAgent`); SW hardening (v2, network-first nav+RSC, `updateViaCache:"none"`). |
| `ab05a0e` | **`allowNavigation = ['planmyfi.com','*.planmyfi.com']`** — stop tab taps opening Safari (§2). |
| `c077fe3` | Launch on the Plan hub (`server.url → /app/fire-path?pmfApp=1`); Plan tab → hub; exact-destination scroll. |
| `f08cf72` | Plan tab → specific strategy workspace. **Superseded.** |
| `80b7529` | Plan tab → hub again (**current**). |
