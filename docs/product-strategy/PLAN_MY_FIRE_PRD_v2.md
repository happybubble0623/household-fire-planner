# Plan My FIRE — Product Requirements Document v2

Status: Living strategy document
Owner: Founder (solo / AI-assisted build)
Last updated: 2026-06-12
Live at: https://www.planmyfi.com

---

## 1. Document Purpose & Lineage

This is **PRD v2 for Plan My FIRE**, the current strategy and roadmap document for the product. It succeeds and builds on the original **"Household FIRE Planner — Full Codex Handoff PRD v1.7"** (`freedom_path_full_codex_handoff_prd_v1_7.md`).

It is grounded in three sources:

1. **The founder's original PRD/handoff** — v1.7 PRD plus `docs/AI_HANDOFF.md`. These capture the original vision, scope, legal guardrails, data model, and the full MVP backlog. They remain valid as the *broad product vision and backlog*, not as the literal current scope.
2. **The founder ↔ AI interaction log** (`docs/product-strategy/founder-codex-interaction-log.md`) — the June 8–12, 2026 record of founder direction, challenges, reversals, and decisions that reshaped scope.
3. **The actually-shipped product** — the live code under `src/app` and `src/components`, plus `MARKETING_PLAN.md`, `MONETIZATION_PLAN.md`, and the `SEO_*` docs.

Where the original PRD and the shipped product disagree, **this document treats the shipped product and the interaction log as authoritative for current state**, and v1.7 as the originating vision and backlog.

### What changed since v1.7

- **Product renamed twice.** "Freedom Path" → **"Household FIRE Planner"** (2026-06-10) → **"Plan My FIRE"** (current brand at planmyfi.com). The package name is `plan-my-fire`; the live domain is `www.planmyfi.com` (www is the deliberate canonical host).
- **Shipped and live.** The product is deployed on Vercel at planmyfi.com, with Google Search Console + Vercel Web Analytics in place.
- **Scope was narrowed, then re-broadened deliberately.** v1.7 envisioned a heavy MVP (historical net-worth engine, effective-dated snapshots, Monte Carlo, Saved Paths, optional accounts). The founder cut all of that to a focused, local-first Phase 1, then layered back in select pieces — three FIRE strategy modes, a richer calculator suite, optional account sync, and an SEO/Learn surface — in a different order than v1.7 prescribed.
- **The FIRE engine evolved past v1.7's two modes.** v1.7 specified only Withdrawal-Rate and Income-Only as MVP, with Principal-Preservation and Hybrid as roadmap-only. The shipped product instead ships **three modes**: Portfolio Drawdown, Principal-Preserving, and Income Stream — and made Principal-Preserving FIRE age an *output*, not an input.
- **Discoverability became a first-class concern.** v1.7 had "no landing page" and "no launch GTM"; v2 has Learn content, structured-data SEO, a marketing plan, and a monetization plan.

---

## 2. Vision & Positioning

### Mission

Help everyday households see, in plain language and without a login, whether and when they can reach financial independence / early retirement (FIRE) — across **all** of their accounts — and use that clarity to make better planning decisions.

### Who it's for

**Primary beachhead:** Multi-account FIRE households — people with several investment accounts across taxable brokerage, Roth, traditional IRA, 401(k), brokerage-link 401(k), HSA, cash, home, and liabilities, often including a spouse's accounts, who struggle to see their true household-level FIRE readiness without manually wrangling spreadsheets and who don't want to link brokerage accounts.

**Supporting segments:**
- DIY FIRE spreadsheet power users
- Self-directed investors with tax-bucket complexity
- Privacy-first, no-account portfolio consolidators
- Stock/ETF/mutual-fund-heavy self-directed investors
- High-income accumulation-stage FIRE aspirants
- Pre-retirees worried about pre-65 healthcare costs (ACA cliff, Medicare, IRMAA)
- Couples planning jointly

The target user sits **between beginner and advanced**: they know FIRE basics, are motivated to learn more, and want guided help with the harder parts (Social Security timing, inflation, taxes, allocation, healthcare) without being given personalized investment advice.

### Positioning

> A free, private, guided FIRE planning workspace that starts simple and gets more accurate as you add your real household accounts.

### What makes it different
- **Household-level, multi-account truth** instead of one blended number.
- **Pre-65 healthcare depth** (ACA subsidy cliff, Medicare, IRMAA) that generic calculators skip.
- **Free, private, and no-login-required** to start.
- **Plain-language, one connected plan** — a guided workspace, not an enterprise dashboard.

### Non-negotiable promise
- No login required to start; optional account only to save and sync.
- No brokerage or bank linking.
- Planning estimates only — **not** investment, tax, legal, or financial advice.

---

## 3. Current State — What's Actually Built

Accurate inventory of the shipped product as of 2026-06-12. Items marked *(partial)* or *(stub)* are noted.

### Home hub & strategy picker
- **`/` → `/app/fire-path`** — root redirects into the workspace home hub.
- **Home hub** (`PathToFirePanel`) — benefit-led hero ("Three paths to reach early retirement"), the three strategy cards, and links to the free calculators. Strategy/tool cards open in new tabs to keep the workspace available.
- **"Three paths" picker** (`PathPicker`) — a short guided "Help me choose" flow that recommends one of the three FIRE strategies.

### Three FIRE strategy modes
Each opens on its own page with compact result cards, info popovers, progress bars, a year-by-year projection table (audit trail), and a FAQ section with FAQPage JSON-LD.
- **Portfolio Drawdown FIRE** (`/app/fire-path/withdrawal-rate`) — earliest age where liquid FIRE assets can fund inflation-adjusted spending through life expectancy. Annual expenses (not a withdrawal rate) are the primary input; implied withdrawal rate is an output. Single "Expected total return" field; optional one-time home-sale inflow; real estate excluded from the drawdown pool.
- **Principal-Preserving FIRE** (`/app/fire-path/principal-preserving`) — earliest age where income + cash-generating yield cover expenses while assets stay at or above the FIRE-age principal floor. **FIRE age is a computed output**, not a user input. Non-overlapping return fields: spendable yield vs. appreciation (not spent).
- **Income Stream FIRE** (`/app/fire-path/income-stream`) — checks whether recurring income streams alone cover expenses from a planned FIRE age. Intentionally the simplest mode; ignores assets/savings/portfolio return. (`/app/fire-path/passive-income` kept as a legacy compatibility route.)

Shared engine features: simple annual expense **or** optional itemized expense categories; simple passive income **or** optional itemized income sources (with start/end ages, ownership, per-item inflation); inflation toggles; a blunt "Option B" simple tax mode (gross-up) across all three modes; "Use Portfolio FIRE Assets" on the asset-based modes.

### Free calculators (supporting tools)
- **Social Security** (`/app/fire-path/tools/social-security`) — unofficial worker-benefit estimate using SSA-style AIME/PIA with 2026 bend points; compares claiming at 62 / FRA / 70; historical 1978–2026 taxable wage caps and credit thresholds; 40-credit eligibility check with a "Not eligible" state. Does **not** model spouse/survivor/WEP/GPO yet.
- **Healthcare / Medicare** (`/app/fire-path/tools/healthcare`) — pre-65 ACA subsidy, Medicare premiums, IRMAA. This is the **SEO template page** (server-rendered intro, unique title/meta, FAQPage schema). *(Some default-figure sanity checks still in progress — see Open Questions.)*
- **Mortgage** (`/app/fire-path/tools/mortgage`) — payment, taxes, insurance, HOA, PMI, amortization.
- **Investment** (`/app/fire-path/tools/investment`) — contribution growth / compounding projections.

### Household portfolio
- **Portfolio Lab** (`/app/portfolio-lab`) — household portfolio with account owner (User 1 / User 2 / Joint / Child), account type, tax treatment, "Include in FIRE", units/price/balance, and **Collections** (group holdings across accounts for allocation analysis).
- **Portfolio Overview** — guided lens bar (scope / analyze-by / focus / allocation view), summary stats, ring + bar allocation visuals, Market Holding Risk Exposure (Stock / ETF / Mutual Fund / Crypto / Bond–Fixed Income / Cash) and holding-level allocation. Fixed-height scroll areas, column preferences, batch delete, CSV/XLSX import-export.
- **EOD pricing** *(partial vs. "daily")* — EODHD-backed symbol search and end-of-day price refresh via `/api/prices` and `/api/symbols`. **Refresh is user-triggered, not an automatic daily cron.** Plan-only holdings (e.g. CITs without public tickers) can be entered manually. Home/liability are forced to household-shared.

### Accounts & sync *(partial)*
- **Optional email-code login** (`AuthPanel`, `/login`; `/signup` redirects to `/login`) — passwordless OTP (email → code → sign-in), with "Continue as Guest" always available.
- **Cross-device sync** via Supabase (cloud plan save/load, local↔cloud reconciliation, conflict dialog). Guest mode stores everything locally in IndexedDB (Dexie). *Cloud sync exists but is secondary to the local-first experience.*

### Learn & SEO surface
- **`/what-is-fire`** — plain-English FIRE explainer (Article + BreadcrumbList schema, TOC, deep-linked terms).
- **`/fire-glossary`** — 30+ plain-language terms (DefinedTermSet schema).
- **Single "Learn" nav dropdown** rather than new top-level tabs (honors the no-nav-bloat constraint).
- **Sitewide SEO** — Organization + WebSite JSON-LD, OG/Twitter cards, FAQPage schema on strategy pages, `sitemap.ts`, `robots.ts`. Sitemap emits valid `https://www.planmyfi.com` URLs; root "/" dropped from the sitemap (it redirects) and `/app/fire-path` promoted to priority 1.0.

### About, feedback, analytics
- **`/about`** — mission + contact/feedback form (submits to Supabase).
- **Vercel Web Analytics** wired into the root layout.
- **Google Search Console** connected (Domain property covering www + non-www).

### Stubbed / deferred routes
These exist in code but **redirect to `/app/fire-path`** and are not current navigation: `/app/saved-paths`, `/app/wealth-records`, `/app/settings`, `/app/family-plan`, `/app/path-comparison`, `/app/freedom-map`, `/app/roadmap`. (`/app/social-security-guide` redirects to the Social Security tool.) Supabase schema for plan documents exists, indicating these were designed and deferred, not abandoned.

---

## 4. Gaps & Deltas vs. the Original v1.7 Vision

### Built, broadly as envisioned
- Guest mode + optional account; local-first IndexedDB; no brokerage linking.
- EOD stock pricing with manual override and graceful API-failure fallback.
- Basic Portfolio Lab + allocation views (and beyond — Collections, lens-based overview, risk exposure).
- Social Security formula calculator (AIME/PIA, 62/FRA/70, eligibility) — no SSN, no SSA login.
- FIRE timing as an earliest-age search; simple tax gross-up; legal/disclaimer guardrails.
- Optional accounts (Supabase) and cross-device sync.

### Built differently (intentional changes of direction)
- **FIRE modes.** v1.7: MVP = Withdrawal-Rate + Income-Only; Principal-Preservation/Hybrid roadmap-only. Shipped: **Portfolio Drawdown + Principal-Preserving + Income Stream**. *Rationale (from log):* the founder reworked mode semantics for clarity — "Portfolio Drawdown" instead of a withdrawal-rate shortcut, Principal-Preserving age made an output, Income Stream simplified — and pulled Principal-Preserving forward because it answers the question users actually have.
- **Withdrawal rate demoted.** v1.7 made 5% withdrawal a core input; shipped product makes annual expenses primary and shows implied withdrawal rate as a *diagnostic output*. *Rationale:* the founder found the withdrawal-rate-first framing confusing.
- **Calculator suite expanded.** v1.7 implied Social Security + tax; shipped adds standalone **Healthcare/Medicare, Mortgage, and Investment** calculators as SEO-friendly supporting tools.
- **No landing page → Learn + SEO.** v1.7 said no landing page and no GTM in MVP; v2 deliberately added Learn content, structured data, and growth plans because discoverability is now a goal.
- **Renamed.** Freedom Path → Household FIRE Planner → Plan My FIRE, for a clearer, less generic name plus a plain-language tagline.

### Called for in v1.7 but NOT yet built (open backlog)
- **Historical net-worth engine & effective-dated snapshots** — the single biggest v1.7 "must-have." *Deferred by design:* Phase 1 uses current/latest portfolio only; history is later.
- **Monte Carlo simulation** (historical block bootstrap) and the three-tier Simple/Deterministic/Monte Carlo FIRE-age outputs — not built. Current modes are deterministic.
- **Saved Paths & Path Comparison** — route stubs only; not shipped as a feature.
- **Family Plan** (two-person horizon, joint planning UI) — stub.
- **Account-level tax model** (per-bucket effective rates, pro-rata withdrawal) — only the blunt simple gross-up ships.
- **In-product Roadmap / Next Development page** — v1.7 required it; currently a redirect stub.
- **Full workbook JSON export/import** (all FIRE inputs + collections, not just portfolio rows) — still the known transfer gap.
- **Spouse/survivor Social Security, WEP/GPO; options pricing; backtesting; rebalancing/allocation-drift tooling; asset-allocation templates** — documented, not built.
- **Automatic daily EOD price refresh** — pricing is user-triggered on demand, not a scheduled job.

### Net read
The product traded v1.7's heavy historical/Monte Carlo machinery for a **lighter, clearer, more shippable planning workspace plus a growth surface**. The deferred items remain a coherent backlog rather than abandoned scope.

---

## 5. Product Principles / Non-Negotiables

1. **Privacy & no-login-required.** Guest mode works fully and locally; an account is optional and only for save/sync. No SSN, no brokerage/bank credentials, no account numbers required.
2. **Not advice.** Planning estimates only. No buy/sell/allocation/retirement-date recommendations; no "you can safely retire" language. Outputs are labeled estimates under the user's own assumptions.
3. **Plain language, no jargon.** Define FIRE and its terms; lead with plain questions ("Can I retire early?"). Tooltips explain the gotcha, not the label.
4. **Simple navigation, no bloat.** Keep top-level navigation minimal; add depth via in-page sections and dropdowns (e.g. the single "Learn" menu), not new tabs.
5. **SEO & crawlability.** Server-render public/Learn content; structured data (FAQPage, Article, DefinedTermSet, Organization/WebSite); clean sitemap/robots; unique titles/meta; internal linking.
6. **Fast load & mobile-friendly.** Static where possible; the workspace should feel quick and usable on a phone.
7. **Clean, ad-free, trust-first UX.** Calm finance aesthetic (light background, dark-gray text, green only for key CTAs), consumer-friendly rather than enterprise dashboard. **No display ads, no dark patterns, never sell user data.**
8. **Clean code & verifiable correctness.** Typed, tested calculation logic; financial math validated against scenarios before shipping. Lint/typecheck/build/test must pass.
9. **User-controlled cost.** Manual EOD refresh by button; respect free tiers and market-data terms; keep the build cheap.
10. **Progressive accuracy.** Start with one simple number; let motivated users add itemized expenses, income sources, and real household accounts to sharpen the plan.
11. **Founder-directed, not AI-directed.** Strategy and scope decisions are the founder's; AI assists and documents.

---

## 6. Future Roadmap

Phased and tied to solo-founder reality. Three tracks run through each phase: **Product**, **Growth/SEO**, and **Monetization**. Sequencing follows the monetization principle *never spend trust faster than you build it* (donations → affiliate → Pro → B2B).

### Near-term (next ~1–3 months)

**Theme: finish what's started; convert SEO groundwork into indexed traffic.**

- **Product**
  - Verify and finalize the **Healthcare calculator** (present-value headline, Medicaid/low-income handling, couple OOP fix, default figures like Medigap ~$155/mo and home insurance ~$2,400/yr).
  - Roll the **healthcare SEO template** out to the other calculators (server-rendered intro + FAQ + schema + unique title/meta on Social Security, Mortgage, Investment).
  - Ship a real **Roadmap / "What's next"** page (replace the redirect stub) — also reinforces transparency and trust.
  - **Full workbook JSON export/import** so users can move *all* their data between devices (closes the known transfer gap).
  - Tighten mobile layouts and load performance on the workspace.
- **Growth/SEO**
  - Submit the corrected sitemap in GSC; request indexing for individual calculator pages.
  - Expand the **glossary** and add 2–3 plain-language guides targeting high-intent long-tail ("retire at 55", "early retirement healthcare before Medicare", "household FIRE calculator").
  - Light, value-first community presence (Reddit) with disclosed authorship.
- **Monetization**
  - Add an on-brand, low-stakes **donation / "support this project"** link. Nothing else yet.

### Mid-term (~3–9 months)

**Theme: deepen the plan; earn the first non-donation revenue carefully.**

- **Product**
  - **Saved Paths + Path Comparison** (ship the stubbed routes): name, duplicate, compare scenarios side by side.
  - **Family Plan**: two-person life-expectancy horizon and joint household planning.
  - **Account-level tax model** (per-bucket effective rates, pro-rata withdrawal) beyond the blunt gross-up.
  - **Asset-allocation templates** (role-based: Stocks / Bond Equivalent / Cash) with allocation-drift comparison against the real portfolio — labeled planning templates, not recommendations.
  - Begin the **historical net-worth direction**: effective-dated snapshots + a net-worth-over-time chart (v1.7's deferred core), scoped carefully.
- **Growth/SEO**
  - Content engine cadence: one solid guide/glossary expansion per week; build the internal-link hub (home ↔ calculators ↔ guides ↔ glossary).
  - Outreach to FIRE content creators; pursue a few quality backlinks.
- **Monetization**
  - **Affiliate partnerships** at genuine moments of need (brokerages, robo-advisors, ACA marketplace, high-yield savings), with **mandatory disclosure, sparse placement, ranked by user fit — never by payout.** No display ads, ever.

### Long-term (~9+ months)

**Theme: from calculators to a trusted planning companion; durable revenue at scale.**

- **Product**
  - **Monte Carlo / risk-aware FIRE age** (historical block bootstrap) and a Simple/Deterministic/Monte Carlo three-tier output — the major remaining v1.7 capability.
  - **Spouse/survivor Social Security** (and eventually WEP/GPO); richer household claiming logic.
  - **Rebalancing / allocation-drift awareness** framed as planning information, not advice.
  - Optional richer modeling: Roth-ladder/conversion planning, RMD awareness, backtesting — each gated on the "not advice" guardrails and legal-review triggers.
- **Growth/SEO**
  - Own the household + early-retirement + no-login long-tail; expand into adjacent high-volume plain-language queries where the product genuinely answers the question.
- **Monetization**
  - **Pro / freemium tier** (additive for power users: saved scenarios, PDF export, Monte Carlo stress tests, advanced modeling). Expect ~1–3% conversion; only meaningful at scale.
  - **B2B** explored last (e.g. embeddable calculators / white-label for advisors or communities) only once consumer trust and traffic are established.
  - Trigger **legal review** before charging, before any recommendation-like feature, and before storing materially more personal data (per v1.7 §5A).

---

## 7. Success Metrics

Tied to the analytics now in place plus product-engagement signals.

### Discovery & SEO (Google Search Console)
- Indexed pages (target: all calculators + Learn pages indexed, zero "URL not allowed"/redirect errors).
- Impressions and clicks (trend up week-over-week).
- Average position on target long-tail queries (household FIRE calculator, early-retirement healthcare/ACA cliff, "retire at 55", glossary terms).
- Click-through rate on calculator and guide pages.

### Audience & traffic (Vercel Web Analytics)
- Unique visitors and visits per month.
- Top pages (which calculators/guides pull traffic) and top referrers (organic vs. community vs. creator links).
- Geography and device mix (validate mobile-friendliness priority).

### Product engagement
- Share of visitors who run at least one strategy calculation.
- Share who use the "Help me choose" picker.
- Portfolio Lab usage: holdings entered, successful EOD refreshes, CSV/XLSX imports.
- Optional-account adoption and successful cross-device sync (small but rising).
- Repeat visits / returning users.

### Trust & monetization (as introduced)
- Feedback-form submissions and qualitative sentiment.
- Donation conversions (near-term).
- Affiliate click-through and conversion *with disclosure* (mid-term); Pro conversion rate (long-term).
- Guardrail metric: complaints or confusion about ads/advice should stay near zero — trust is the leading indicator.

### Health
- Production uptime; EOD price-fetch success rate (regression guard after the Vercel env-key fix).
- Core Web Vitals / load performance.

---

## 8. Open Questions / Decisions to Revisit

Carried forward from the interaction log's "Current Open Strategy Questions" plus current strategic decisions:

- **First experience.** Should the first visible screen be a quick FIRE snapshot, then portfolio setup — or keep the current strategy-picker home? (New users may not enter a portfolio before seeing value.)
- **Account fields.** What minimum account fields are needed for Phase 1 vs. a Phase 1.5 (historical) push?
- **Allocation depth.** How much allocation clarity belongs in the planner before it becomes too much?
- **Education vs. content site.** How far do we go with Learn/glossary/guides without turning into a content site?
- **Rebalancing language.** How do we discuss rebalancing and drift without giving personalized investment advice?
- **Social Security depth.** How deep should household claiming logic go after the simple worker-benefit calculator (spouse/survivor/WEP/GPO)?
- **Competitor analysis.** How much more is needed before locking final positioning?
- **Historical net-worth timing.** When (if ever) do we take on v1.7's effective-dated history + Monte Carlo machinery, given the cost/complexity?
- **Monetization timing.** When does affiliate go live, and how do we prove disclosure + sparse placement don't dent trust? When is there enough traffic for Pro to be worth building?
- **Analytics depth.** Do we add Google Analytics 4 (needs a `G-XXXXXXX` Measurement ID) on top of GSC + Vercel, or keep it lean?
- **Cloud-sync prominence.** Should optional accounts/sync stay quietly secondary, or become a more visible value driver?

---

*Plan My FIRE provides planning estimates only. It is not investment, tax, legal, or financial advice. Roadmap items are planned directions and may change.*
