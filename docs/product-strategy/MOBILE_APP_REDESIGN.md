# Plan My FIRE — Mobile App Redesign Proposal

**Date:** June 15, 2026
**Context:** The iOS app currently wraps the website as-is (hosted shell). The website's structure was built desktop-first and carried straight into the app. This proposes a mobile-first redesign of the in-app experience — easy navigation, the key advantage made obvious, and retention built in — while honoring the repositioning (portfolio/consolidation as the hook, financial independence as the moat). All changes are responsive layouts on the same codebase, so mobile web improves too.

---

## 1. The core problem with today's structure

The current app is the website hierarchy on a phone. From the structure audit:

- **The brand's landing route (`/app/fire-path`) is a marketing page, not a tool.** A user opens the app and lands on an Aurora hero + stat stripe + comparison cards — then has to tap into a *separate* page to actually plan. The primary task is one hop behind a long promo scroll.
- **The real planning lives on three long single-scroll strategy pages** (3 input cards + add-item accordions + a manual Calculate bar + multi-card results + a wide year-by-year table + a calculator grid + FAQ). Desktop tables on a 380px screen.
- **The portfolio is one enormous stacked page**, and **adding a holding — the most common action — is buried at the very bottom**, below overview, collections, backtest, and a full spreadsheet table.
- **Navigation is nested website dropdowns** turned into collapsed accordions: hamburger → expand Calculators → scroll past five items to reach Tax.
- **Links open in new tabs** (`target="_blank"`) — a desktop habit that spawns tab clutter in a WebView.
- **The plan ↔ portfolio loop is weak** — two separate long pages, linked only by a one-shot "use my portfolio total" button.

Net: navigation is deep, the primary tasks are buried, and the thing that makes the product special is hidden behind marketing scroll.

---

## 2. Design principles for the app

1. **One thumb, two taps.** Anything important is reachable from a persistent bottom tab bar in <=2 taps. No hamburger, no nested accordions.
2. **Open into value, not a pitch.** App users already converted — drop the marketing hero in-app and open straight into the plan.
3. **Cards, not tables.** Replace desktop tables (year-by-year, holdings) with stacked, tappable cards and progressive disclosure.
4. **Tighten the loop.** Planning, portfolio, and calculators are one system: results feed back into your numbers. Make that visible and one-tap.
5. **Lead with the hook, keep the moat.** Portfolio consolidation is the daily reason to return; FI planning + the pre-65 healthcare gap is what makes us different from every tracker.
6. **Earn the "real app" badge.** Native Face ID, safe-area-correct chrome, and (later) notifications — also clears Apple's 4.2 "not just a website" bar.

---

## 3. Proposed navigation — bottom tab bar (4 tabs)

Replaces the top dropdown nav on mobile. Sits above the home indicator (safe-area correct).

| Tab | Route it maps to | What it becomes |
|---|---|---|
| **Plan** | `/app/fire-path/*` (the strategy workspace) | Your active plan — inputs + results, mobile-first. Strategy switcher at top. *App opens here.* |
| **Calculators** | `/app/fire-path/tools/*` | All **6** calculators in one consistent list. |
| **Portfolio** | `/app/portfolio-lab` | The tracker, with **Add holdings** promoted to the top + its own page. |
| **More** | account, learn, about | Account/login, Learn (What is FIRE, Guide, Glossary), About, Settings, Feedback. |

- **No separate "Home" tab.** The marketing hub (`/app/fire-path` landing) is dropped *in-app* (kept on the web for SEO). The app opens on **Plan**.
- **Drop `target="_blank"`** everywhere in-app — navigation stays in the tab stack.
- **Legacy redirect routes** are removed from any in-app surface.

> Open question for you: open the app on **Plan** (the moat) or **Portfolio** (the hook)? Recommendation below.

---

## 4. Tab-by-tab redesign

### Plan (opens here)
- **Top: a personal snapshot strip** — your headline numbers at a glance: **FIRE age / years to FI**, **FIRE number vs. current assets** (progress ring), and **lifetime/pre-65 healthcare estimate**. This is the moat made visible in the first second.
- **Strategy switcher** — a segmented control or chip row (Drawdown / Income Stream / Principal-Preserving) instead of three separate routes. Defaults to the user's last-used model.
- **Inputs as compact cards / a short stepped flow** — Timeline, Money, Assumptions collapsed into tap-to-edit cards rather than three tall stacked forms.
- **Results as cards**, with the **year-by-year projection** behind a "See full projection" disclosure (and rendered as a chart + scannable rows, not a wide table).
- **"Refine with calculators"** inline — tapping a calculator returns its result *into the plan* (tighten the loop), instead of opening a new tab.

### Calculators
- **One consistent list of all 6** (Social Security, Healthcare, Mortgage, Investment, Living expense, Tax) — fixes today's "4 in the grid, 6 in the dropdown, 4 in the footer" inconsistency.
- Each calculator is a focused single-purpose screen; **its result can be pushed back into the Plan** with one tap.
- Lead the list with **Healthcare** — it's the differentiator nobody else nails.

### Portfolio (the hook)
- **Add holdings = a prominent button at the top** + a floating **+** (FAB), opening a **dedicated Add Holdings page** (ticker search -> shares -> owner/account/tax -> Include-in-FIRE). No more scrolling to the bottom.
- **Net-worth / overview card first** (total value, allocation donut), then holdings as **cards** (not a spreadsheet), then **Backtest** and **Collections** behind disclosures.
- **"Sign in to sync"** nudge inline (contextual, not buried) — this is where cross-device value is most felt.
- **One-tap "Use in my plan"** so the portfolio total flows into FIRE assets visibly.

### More
- **Account** at the top — sign in / profile / sync status (today it's a near-invisible gray link; give it a real home).
- **Learn** — What is FIRE, Early Retirement Guide, Glossary.
- **About**, **Settings**, **Send feedback**.

---

## 5. Spotlighting the key advantage (retention)

The app should keep reminding users why they're not just using Empower or a generic tracker:

- **The snapshot strip on Plan** surfaces the three things no tracker answers: *when* you can retire early, *how* you cover **health insurance before Medicare**, and *whether the money lasts*.
- **Healthcare leads the calculators** — the pre-65 gap is the wedge.
- **The integrated loop** (calculators + portfolio -> your plan) is the "all-in-one" promise made tangible; competitors are either a tracker *or* a calculator, not a connected system.
- **Local-first privacy** is a genuine differentiator vs. aggregation apps — state it plainly ("your data stays on your device").
- **Native retention hooks (phase 2+):** Face ID lock (already scaffolded), and opt-in **notifications** — a monthly "check your plan" nudge or a "markets moved, see your portfolio" ping. These bring people back *and* strengthen the App Store 4.2 case.

---

## 6. How the repositioning shows up in the app

Hybrid positioning (portfolio/consolidation hook + FI moat) maps cleanly onto the tabs:

- **Portfolio is a first-class tab** — the sticky, return-visit surface that the hook promises.
- **Plan is the default open and the snapshot lead** — the moat (FI planning + healthcare) is the first thing seen, so we capture the bigger tracking audience without becoming a commodity tracker.
- **Account/sync stays opt-in and light** — consistent with low-maintenance, privacy-first operations; we are not racing the aggregation incumbents.

---

## 7. Suggested build order

1. **Foundation:** safe-area fix + bottom tab bar (Plan / Calculators / Portfolio / More), drop in-app marketing hub, kill `target="_blank"`, app icon. *(Biggest perceived-quality jump for least work.)*
2. **Portfolio:** Add Holdings as its own page + top button/FAB; holdings as cards; sign-in nudge.
3. **Plan:** snapshot strip + strategy switcher + inputs-as-cards + year-by-year behind disclosure.
4. **Calculators:** unified 6-item list + push-result-into-plan.
5. **More:** account hub; consolidate Learn/About/Settings.
6. **Retention (native):** Face ID gate, then opt-in notifications.

Phases 1-2 are enough to make it feel like a real app and submit to TestFlight; 3-6 deepen it.

---

## 8. Open decisions

1. **Default open tab** — Plan (moat, recommended) or Portfolio (hook)?
2. **Strategy switcher** — fold the 3 models into one Plan tab with a switcher (recommended), or keep them as separate destinations?
3. **Notifications in v1** or defer to a later update?
4. **Snapshot strip** — is FIRE age / progress / healthcare the right trio to lead with, or different numbers?
