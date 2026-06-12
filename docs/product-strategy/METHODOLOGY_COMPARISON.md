# Methodology Comparison — Plan My FIRE vs cFIREsim & FIREproof

*Created: 2026-06-12 · Last updated: 2026-06-12*

> An honest, technical look at **how Plan My FIRE actually calculates** versus how cFIREsim and FIREproof calculate — and a straight verdict on which approach is sounder, where ours is genuinely solid, and where it is oversimplified or could mislead. Our side is grounded in the real code (`file:line`); their side is grounded in researched, cited facts. No flattery.

---

## 1. Bottom line (read this first)

**Does their approach "make more sense" than ours? For the core safety question — "will my money actually last?" — yes, theirs is more rigorous. But it's nuanced, and it's not uniform across everything we do.**

- **For the FIRE projection itself (the "can I retire?" answer), cFIREsim/FIREproof are methodologically sounder.** They run your plan through **sequence-of-returns risk** and report a **probability of success**. Our live FIRE engine runs a **single fixed average return every year** and returns **one deterministic pass/fail age**. A plan that "passes" at a flat 7% can still fail in real life if a crash hits in the first few withdrawal years — and our model, by construction, cannot see that. That is a real methodological gap, not a cosmetic one.
- **For the four discrete calculators (Social Security, healthcare, mortgage, investment), we are competitive or genuinely strong.** Our Social Security calculator implements the actual SSA PIA/bend-point methodology; our healthcare model is a real present-value model with ACA premium-tax-credit, IRMAA, and Medicaid logic that is arguably *more* detailed than cFIREsim's (cFIREsim models **no** taxes or healthcare at all). Mortgage is the textbook amortization formula.
- **The single most important caveat:** our deterministic FIRE projection presents a **confident single answer** ("Estimated FIRE age: 52") for a question that is inherently probabilistic. That framing risks **false certainty**. The math isn't *wrong* — it's a correct deterministic projection — but presenting a deterministic projection as *the* answer to a sequence-risk-sensitive question can mislead.

**One important internal fact:** we already have a block-bootstrap Monte Carlo engine in the codebase (`src/lib/calculations/monte-carlo.ts`) that produces a success rate and percentile bands. **It is not wired into any live route** — it's effectively dead code — and the historical dataset behind it is a ~36-row hand-assembled toy sample, not a real long-horizon series. So the gap is partly "not shipped" rather than "can't be built." See §5.

---

## 2. Side-by-side methodology table

| Dimension | **Plan My FIRE (live)** | **cFIREsim** | **FIREproof** |
|---|---|---|---|
| **Core engine** | Deterministic year-by-year projection | Historical-cycles backtest (every start year since 1871) | cFIREsim's historical backtest + optional synthetic Monte Carlo |
| **Return modeling** | **Single fixed average** entered by the user, applied identically every year (`phase1/fire.ts:552`, `:357`) | Actual historical contiguous sequences (Shiller dataset, stocks/bonds/gold/CPI) | Same historical sequences; plus synthetic series (mean/SD/shape via Python `arch`) |
| **Sequence-of-returns risk** | **Not modeled at all** — order of returns is irrelevant to a constant rate | **Core of the method** — replays real crashes (1929, 1966, 2000) in sequence | Yes (historical) + Monte Carlo mode |
| **Output type** | **Single deterministic answer** ("Estimated FIRE age", pass/fail) | **Success rate %** (share of historical cycles the portfolio survived) | Success rate % + "Rich/Broke/Dead" mortality-weighted bands + deterministic mode |
| **Spending strategies** | Constant real (inflation-adjusted) or constant nominal; per-category/per-source timing; one-time home sale | Constant, % of portfolio (floor/ceiling), VPW, Guyton-Klinger, Hebeler, Variable CAPE | Guyton-Klinger, VPW, Variable CAPE, 3-bucket strategy, TIPS ladder |
| **Tax modeling** | **Simple gross-up** only: `gap / (1 − rate)`, one blended rate, no account types (`phase1/fire.ts:23-28`) | **None** — user must gross up spending manually | Account-type aware (Trad/Roth/taxable), income tax, RMDs, 72(t); cap-gains/cost-basis partial (beta) |
| **Inflation** | **Single fixed rate**, geometric compounding (`phase1/fire.ts:732-735`) | Historical CPI (per cycle) or flat rate | Historical CPI + "modified historic" scaling |
| **Social Security** | Standalone SSA-grade calculator (PIA/bend points), fed into FIRE as a flat income line | Income "adjustment" line (start/end year, inflation toggle); no benefit formula | Modeled + SSA mortality weighting |
| **ACA / healthcare** | Standalone present-value model w/ PTC, IRMAA, Medicaid/MSP | Not modeled | MAGI-based PTC, SLCSP ZIP lookup, withdrawal optimization for subsidy |
| **Probabilistic / confidence output** | **No** (deterministic) | Yes (success %) | Yes (success % + mortality bands) |

Sources for the competitor columns are listed in §7.

---

## 3. Where OUR method is genuinely sound

### 3.1 Social Security — standard SSA methodology ✅
`src/lib/calculations/social-security.ts` implements the real benefit formula, not a hand-wave:
- **AIME**: top-35 indexed years summed and divided by 420 months (`:163-174`) — exactly the SSA definition.
- **PIA bend-point formula**: 90% / 32% / 15% across the two bend points (`:176-182`).
- **Claiming adjustment**: 5/9% per month for the first 36 early months, 5/12% beyond, and 2/3% per month delayed credit to 70 (`:184-207`) — the correct SSA reduction/credit schedule.
- **Full retirement age** by birth year (`:327-333`), **wage indexing (AWI)**, taxable-maximum caps, and quarter-of-coverage credit tests are all present with real 1978–2026 tables (`:59-161`).

**Caveat (honest):** future bend points, NAWI, taxable max, and credit thresholds are projected forward with a **single flat 3% wage-growth assumption** (`:56`, `:289-306`). That's a reasonable simplification, but it's a deterministic projection of figures SSA actually sets annually.

### 3.2 Healthcare — real present-value model ✅
`src/lib/calculations/healthcare-cost.ts` is the most sophisticated calculator we have:
- **ACA premium tax credit** via the piecewise-linear applicable-percentage table with the 400% FPL cliff, sourced to Rev. Proc. 2025-25 (`:156-174`, `:222-255`).
- **SLCSP benchmark estimate** from age curve × region band (`:180-193`), so users don't have to window-shop healthcare.gov.
- **IRMAA tiers** for Medicare Part B/D surcharges by MAGI (`:257-268`).
- **Medicaid (<138% FPL) and Medicare Savings Program / Extra Help** drive premiums and cost-sharing to ~free at low incomes (`:325-326`, `:382-420`).
- **Present-value discounting**: each future year's real cost is discounted to today, and the per-year rows **reconcile to the headline total** (`:298-307`, `:436-439`). This is correct PV methodology.

**Caveat:** medical trend is a **deterministic** inflation rate (separate ACA vs Medicare), not a distribution. Reasonable, but single-point.

### 3.3 Mortgage — textbook amortization ✅
`src/components/planning/planning-tool-panel.tsx:136-191` uses the standard fixed-payment formula
`payment = P·r / (1 − (1+r)^−n)` and builds a true month-by-month amortization schedule (interest = balance × monthly rate, principal = payment − interest). This is exactly correct.

### 3.4 Investment compounding — correct, but nominal-only ⚠️
`planning-tool-panel.tsx:214-243` compounds monthly with end-of-month contributions (an ordinary annuity) — mechanically correct. **But it uses a single fixed nominal return and has no inflation field**, while the default-return helper text tells users 7% "≈ the S&P's long-run *real* (after-inflation) return" (`:698`). So the input is framed as *real* but the growing balance is displayed as *nominal*. That mixed basis is a minor framing inconsistency worth tightening.

---

## 4. Where OUR method is weaker or could mislead

### 4.1 The FIRE projection is 100% deterministic — the central gap ❌
The live FIRE engine is `src/lib/phase1/fire.ts`, driving all three strategy modes shown in `fire-strategy-panel.tsx`. Every mode applies **one fixed return every single year**:
- **Portfolio Drawdown (withdrawal-rate)**: `projectWithdrawalRateSurvival` (`:547-576`) walks year by year, withdrawing the spending gap and growing the remainder at `expectedAnnualPortfolioReturnPercent` — the *same* rate every year. It finds the earliest age the balance never hits zero. (To its credit, this is **not** a static 25×/4% rule — the withdrawal rate is reported as an *implied output*, `:164-167`, and survival is a real depletion test. But the return is constant.)
- **Principal-Preserving**: `projectPrincipalPreservingSurvival` (`:306-335`) — same fixed appreciation + fixed cash yield, every year.
- **Income Stream**: `calculateIncomeStreamFire` (`:196-231`) — a pure coverage test (income ≥ expenses), no portfolio dynamics at all.

**Why this matters:** with a constant return, the *order* of returns is mathematically irrelevant — so the model is **structurally blind to sequence-of-returns risk**, the single biggest threat to an early retiree. Two portfolios with an identical 7% average can end in opposite places if one eats a 2008 in year one. cFIREsim exists precisely to surface those bad-sequence failures; we cannot, by construction.

### 4.2 One confident number implies false certainty ❌
The UI presents a definite "Estimated FIRE age" and pass/fail. There is **no success probability, no confidence band, no downside percentile** in the live product. A user reasonably reads "you can retire at 52" as a settled fact, when the honest answer is "at your assumed average, with no allowance for a bad early market." This is the framing risk: the *math* is a valid deterministic projection; the *presentation* over-claims.

### 4.3 Taxes are a blunt instrument ⚠️
`calculateTaxAdjustedGap` (`phase1/fire.ts:23-28`) grosses up spending by a single blended effective rate; the UI only offers "none" or "simple" (`fire-strategy-panel.tsx:999-1001`). No distinction between taxable, tax-deferred, and Roth; no capital-gains vs ordinary treatment; no bracket-by-bracket modeling. FIREproof models all of this (account types, RMDs, 72(t), ACA-MAGI-aware withdrawal ordering). For a US early-retiree, withdrawal sequencing and ACA-MAGI management are first-order to the result — so this is a meaningful simplification, not a rounding error.

### 4.4 The Monte Carlo we *do* have is orphaned and thinly-sourced ⚠️
`src/lib/calculations/monte-carlo.ts` implements a real **block-bootstrap** simulation producing a success rate and 10th/50th/90th-percentile ending balances (`:32-80`). **But:**
- It is only consumed by `src/components/planning/plan-workspace.tsx`, which **is imported by no route** — it doesn't ship to users.
- Its data source, `src/lib/data/historical-returns.ts`, is **~36 hand-entered monthly rows** spanning only 2008, 2013, and 2020 — three cherry-picked regimes, non-contiguous. Block-bootstrapping 12-month blocks from that is not comparable to cFIREsim's 150+ years of contiguous Shiller data.

So even the latent capability, as built, would need a real dataset before it could be trusted.

---

## 5. Closing the gap — pragmatic, low-maintenance options

Ranked by effort. The founder wants set-and-forget, so the bias is toward static, no-backend, no-recurring-data options.

| Option | Effort | Maintenance | What it buys |
|---|---|---|---|
| **A. Sequence-risk caveat + conservative-return sensitivity toggle** | **Lowest** (½–1 day) | ~None | Add a one-line caveat next to the FIRE age and a "stress test" toggle that re-runs the existing deterministic engine at, say, return − 2% (and/or a "first-5-years-flat" variant). Honest framing + a downside number, **zero new math**. |
| **B. Wire up the existing Monte Carlo with a *real* static dataset** | **Medium** (2–4 days) | Low (refresh annually) | Replace the 36-row toy file with a proper monthly real-return series (e.g. Shiller-derived, shipped as a static JSON), then surface `runMonteCarloProjection`'s success rate in the strategy panel. The engine, percentiles, and "survived in X% of paths" wording (`monte-carlo.ts:78`) already exist. This is the highest-leverage move. |
| **C. Coarse historical-cycles backtest** | **Medium-High** (4–7 days) | Low | A cfiresim-style rolling-window pass over the same static series, reported as a success %. More faithful to sequence risk than bootstrap, but more work than (B) and largely redundant once (B) ships. |
| **D. Account-type / ACA-MAGI tax modeling** | **High** | Medium-High | Matches FIREproof's tax engine. High value but high build + ongoing tax-table maintenance — *not* low-maintenance. Defer. |

**Recommendation:** ship **A immediately** (it directly fixes the false-certainty problem with near-zero effort), then do **B** as the real differentiator. A + B together convert "one confident number" into "an estimate plus an honest survival probability" without committing the founder to a heavy, high-maintenance tax engine.

---

## 6. Honest conclusion — is our math *wrong*, or just *simpler*?

**Simpler, not wrong — with one important asterisk on presentation.**

- The **discrete calculators are correct and, in healthcare/SS, genuinely strong.** SSA PIA/bend points, ACA PTC, IRMAA, and amortization are implemented to standard. No correctness problem there.
- The **FIRE projection math is a valid deterministic model** — it correctly computes "if returns average X every year and inflation is Y, here's when the portfolio survives to life expectancy." Nothing in it is arithmetically wrong.
- **The asterisk:** a deterministic projection answers a *different question* than the one users are really asking. They ask "will this work?" (probabilistic, sequence-sensitive); we answer "does this work at a constant average?" (deterministic). Presenting that single number as the headline answer, with no probability and no sequence-risk allowance, **over-claims certainty.** That's the line between "simpler" and "potentially misleading" — and it's a framing/UX problem we can fix cheaply (§5, option A) long before we build any new simulation.

In short: **cFIREsim/FIREproof are sounder for the safety question because they model the risk that actually sinks early retirements. Our calculators are accurate; our FIRE projection is honest math wrapped in over-confident framing. The cheapest, highest-integrity fix is to stop presenting a single number as a verdict — then surface the success rate our own (currently shelved) engine was built to produce.**

---

## 7. Sources

**Plan My FIRE (this repo):**
- `src/lib/phase1/fire.ts` — live deterministic FIRE engine (all three modes)
- `src/components/planning/fire-strategy-panel.tsx` — strategy UI / result framing
- `src/lib/calculations/social-security.ts` — SSA PIA/bend-point methodology
- `src/lib/calculations/healthcare-cost.ts` — ACA/IRMAA/Medicaid present-value model
- `src/components/planning/planning-tool-panel.tsx` — mortgage amortization (`:136-191`) & investment compounding (`:214-243`)
- `src/lib/calculations/monte-carlo.ts` + `src/lib/data/historical-returns.ts` — orphaned block-bootstrap Monte Carlo and its ~36-row dataset

**cFIREsim:**
- https://www.cfiresim.com/ (live app: spending strategies, simulation types, inputs)
- https://github.com/boknows/cFIREsim-open/blob/master/faq.php (cycles, data range, success definition, manual-tax guidance)
- https://boglecenter.net/bogleheads-chapter-series-cfiresim-demonstration/ (Shiller dataset, success definition, allocation defaults)
- https://guide.ficalc.app/how-it-works/historical-data-source/ (Shiller dataset composition)

**FIREproof** (by the cFIREsim author; active beta — marketing page sometimes runs ahead of disclosed implementation):
- https://fireproofme.com/ and https://fireproofme.com/features
- https://fireproofme.com/blog/welcome-to-fireproof (cFIREsim lineage; cost-basis disclosed as partial/conservative)
- https://fireproofme.com/blog/monte-carlo-assets (synthetic-asset Monte Carlo via `arch`)
- https://fireproofme.com/blog/tax-strategy (Roth conversion ladder, fill-to-bracket)
- https://fireproofme.com/blog/aca-healthcare-subsidies (MAGI-based PTC, SLCSP ZIP lookup, 400% cliff)
- https://fireproofme.com/blog/bond-ladders (bucket strategy vs TIPS ladder; Constant/Monte Carlo modes)
