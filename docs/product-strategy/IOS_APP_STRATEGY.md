# iOS App Strategy — Plan My FIRE

*Created: 2026-06-14 · Last updated: 2026-06-14*

## TL;DR
Build the iOS app by **reusing the existing web codebase + the portable TypeScript calculation engine**, wrapped with **Capacitor**, plus a few genuinely native features so it clears App Store Guideline 4.2 ("minimum functionality" — bare website wrappers get rejected). Position iOS differently from web: **web acquires and plans; iOS retains and tracks.**

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
Priority order:
1. **Home-screen widget** — portfolio value + FIRE age at a glance (most "app-like"; needs Swift/WidgetKit).
2. **Push notifications** — price/refresh reminders, milestone and off-track alerts (core to retention).
3. **Face ID / Touch ID lock** — expected for financial data.
4. **Offline snapshot** of the latest plan.
Later: Siri shortcut ("what's my FIRE age"), camera statement scan.
Two or three of these move the app from "repackaged website" to legitimate app.

## 4. Build phases
- **Phase 0 — Extract shared core.** Confirm the engine imports cleanly outside Next.js.
- **Phase 1 — Capacitor wrap.** iOS opens to the portfolio dashboard; mobile responsive polish; app icon/splash; Xcode + code-signing setup.
- **Phase 2 — Native features.** Add Face ID + push first; widget as v1.1.
- **Phase 3 — Ship.** TestFlight beta → submit. Handle compliance (below).

## 5. Effort projection (solo founder, AI-assisted, reusing web + portable TS engine)
Split by who does what — the founder handles web/TS coding, so the real incremental lift is the native/Apple side.
- **Web / shared (founder's wheelhouse, AI-assisted):** shared-core extraction, dashboard-first routes, mobile polish, onboarding, offline snapshot → **~25–55 hrs** (lower risk).
- **iOS-native + tooling + store (the genuine new lift; budget learning time here):** Capacitor/Xcode/code-signing, Face ID, push/APNs, home-screen widget (Swift), TestFlight + submission + compliance → **~55–110 hrs**. Push and the widget dominate.
- **Lean MVP (clears 4.2, no widget):** ~50–100 hrs total.
- **Fuller v1 (with widget):** ~90–150 hrs total.
- First-timer Xcode/signing learning curve can add 10–20 hrs on its own.
- Non-dev overhead: Apple Developer enrollment ($99/yr), app icon + screenshots, review wait (and possible rejection round).

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
- Which native features make v1 (recommended: push + Face ID minimum; widget in v1.1).
- Whether to trim/hide marketing routes entirely in the iOS shell.
