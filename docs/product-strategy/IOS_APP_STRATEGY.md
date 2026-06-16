# iOS App Strategy — Plan My FIRE

*Created: 2026-06-14 · Last updated: 2026-06-14*

> **Implementation reference:** for how app mode is detected/gated, the Capacitor native-shell navigation gotchas (incl. the "tabs open Safari" fix), the current `capacitor.config.ts` config of record, the navigation/IA decisions, and the deploy-vs-rebuild model, see [IOS_APP_MODE_AND_NAV.md](./IOS_APP_MODE_AND_NAV.md).

## TL;DR
Build the iOS app by **reusing the existing web codebase + the portable TypeScript calculation engine**, wrapped with **Capacitor**, plus a few genuinely native features so it clears App Store Guideline 4.2 ("minimum functionality" — bare website wrappers get rejected). Position iOS differently from web: **web acquires and plans; iOS retains and tracks.**

## Recommended v1 scope (decided)
**v1 = Capacitor-wrapped app, dashboard-first, + Face ID lock.** Add push notifications if it's not painful. **No home-screen widget in v1** — it's the most expensive, least AI-assistable native piece (separate Swift/WidgetKit extension + cross-process data sharing) and only a retention nice-to-have; defer to a v1.x update. The ONLY real App Store rejection risk is a bare wrapper with zero native features; Face ID (and/or push) comfortably clears Guideline 4.2. A portfolio tracker that stores data, works well on mobile, and has login/sync already feels app-like.

## 1. Positioning: web vs iOS (different jobs, different mindsets)
- **Web = discovery + deep planning.** Found via Google/SEO, often desktop, "figure it out" mode. Hero stays the calculators, FIRE models, and the guide. The acquisition front door.
- **iOS = retention + ongoing tracking.** Already-committed users, on the go, want quick check-ins — not to re-learn FIRE. The app's job: "keep your plan on track, in your pocket."
- **The iOS app does NOT open to the marketing hero.** It opens to the **portfolio dashboard / "am I on track?" view.** Calculators remain available, but tracking + status lead. SEO/marketing pages (pillar, What-is-FIRE) stay on web; they don't belong in the app.
- **Onboarding differs:** iOS = "import/sync holdings, turn on alerts," not "learn what FIRE is."

## 2. Architecture: Capacitor + shared core
- Extract a **shared core** — the calculation engine (already pure TS), types, and data — into a package both surfaces import. Single source of truth; fix a calc once, both get it.
- **Capacitor** wraps the web build; point the **iOS entry at dashboard-first routes**, not the marketing home. Keep it one repo so the engine never drifts.
- Start by wrapping the existing responsive app; tailor the iOS entry/onboarding over time.
- Later option: migrate to **React Native/Expo** (reusing the same TS core) for a fully native UI if the wrapper becomes limiting. The TS core carries over either way.

## 3. Native features (define the iOS value AND clear Guideline 4.2)
These are **options to add native value, not a required checklist.** **v1 minimum = Face ID** (push optional). Pick enough to move the app from "repackaged website" to legitimate app — one or two is plenty.
1. **Face ID / Touch ID lock** — expected for financial data. **v1 pick.**
2. **Push notifications** — price/refresh reminders, milestone and off-track alerts (core to retention). **v1 pick (optional — add if not painful).**
3. **Offline snapshot** of the latest plan.
4. **Home-screen widget** — portfolio value + FIRE age at a glance (most "app-like"; needs Swift/WidgetKit). **v1.x — optional, retention nice-to-have. DEFERRED, not in v1.**
Later: Siri shortcut ("what's my FIRE age"), camera statement scan.

## 4. Build phases
- **Phase 0 — Extract shared core.** Confirm the engine imports cleanly outside Next.js.
- **Phase 1 — Capacitor wrap.** iOS opens to the portfolio dashboard; mobile responsive polish; app icon/splash; Xcode + code-signing setup.
- **Phase 2 — Native features.** Add Face ID first; push if not painful; widget deferred to v1.x.
- **Phase 3 — Ship.** TestFlight beta → submit. Handle compliance (below).

## 5. Effort projection (solo founder, AI-assisted, reusing web + portable TS engine)
Vibe-coded (AI-assisted), reusing the web app + portable TS engine. AI slashes the code-writing parts but not the Apple tooling/process.
- Web / shared TS (founder's wheelhouse, AI-strong): extract shared core, dashboard routes, mobile polish, onboarding, offline snapshot → ~15–30 hrs.
- Apple tooling + process floor (AI helps least): Developer setup, certificates/code-signing, Xcode build-debug loop, push/APNs config, App Store Connect listing + review → a ~30–50 hr floor you can't AI away.
- Lean MVP (wrapped app + Face ID, push optional, NO widget): ~35–70 hrs total (low end if push is skipped).
- Add widget later (v1.x, Swift/WidgetKit): +~30–40 hrs.
- First-timer Xcode/code-signing curve can add 10–20 hrs; AI can even cost time generating subtly-wrong native config.
- Non-dev overhead: Apple Developer $99/yr, app icon + screenshots, review wait (+ possible rejection round).

## 6. App Store compliance to plan for
- **Guideline 4.2 (Minimum Functionality):** a bare website wrapper is rejected — the native features above are the mitigation.
- **In-app account deletion** is required if accounts are offered (optional login exists).
- **In-app purchase / 30% cut:** only for selling digital goods. The free + donations/affiliate model is mostly fine, but keep payment/"upgrade" links OUT of the iOS app; for-profit external donation links are a gray area.
- **Privacy nutrition labels**; if third-party login is offered, **Sign in with Apple** may be required.
- Review the current App Store Review Guidelines before submitting — they change.

## 7. Launch tie-in
The iOS release is the **"now on iPhone" second launch moment** — a fresh headline and a new audience (mobile/App Store discovery), landing on the warm base built on web by then. (See marketing plan: phased web-now → iOS-later rollout.)

## 8. Open decisions
- Capacitor first vs jump straight to React Native/Expo.
- v1 = Face ID (push optional), no widget — DECIDED.
- Whether to trim/hide marketing routes entirely in the iOS shell.
