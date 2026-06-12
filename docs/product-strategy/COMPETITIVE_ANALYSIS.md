# Plan My FIRE — Competitive Analysis: cFIREsim & FIREproof

*Created: 2026-06-12 · Last updated: 2026-06-12*

> An honest, evidence-based read on whether **Plan My FIRE** ([planmyfi.com](https://www.planmyfi.com)) has a real competitive edge against **cFIREsim** ([cfiresim.com](https://www.cfiresim.com/)) and its sister site **FIREproof** ([fireproofme.com](https://fireproofme.com/)). Written to be skimmable and blunt. Where the answer is "no edge," it says so.
>
> **Research caveat:** Both competitors are JavaScript single-page apps with little server-rendered text, so feature details below come from the rendered app, the founders' own blog/marketing, and third-party reviews — not from deep crawls. Items sourced from a competitor's own marketing (e.g. FIREproof's "100% of cFIREsim + 20%") are labeled as claims, not verified facts. Traffic and some feature gaps come from third-party tools (SimilarWeb, QuantCalc) and are directional.

---

## 1. Bottom line up front — do we have an edge?

**Partial, and narrower than it feels. Yes on positioning; no on the thing the FIRE community actually rewards (simulation depth + brand).**

The blunt version:

- **Where we genuinely differentiate (real, but mostly *positioning*, not *technology*):** beginner-friendly plain language, a pre-65 healthcare module with IRMAA, household/couples multi-account framing, and a free/no-login/ad-free stance. These are real and they line up with under-served demand. None of them require a simulation engine we don't have.
- **Where we're clearly behind, and can't easily close it:** cFIREsim and FIREproof run **historical-cycle and Monte Carlo simulations** with sophisticated spending models (Guyton-Klinger, VPW, variable spending), tax-aware withdrawals, Roth-conversion optimizers, and glide paths. Plan My FIRE's three FIRE modes are **deterministic single-point calculators** — no probability of success, no sequence-of-returns stress test, no historical backtest. To a serious FIRE user, that is the headline feature, and we don't have it.
- **Is the differentiation defensible?** **Mostly not, at the technology level.** FIREproof already models ACA subsidies and is actively developing; it could add IRMAA, a household view, or a beginner mode in a sprint. cFIREsim has a 14-year brand and community trust we cannot buy. Our edges are **a head start on a niche they've chosen not to chase**, not a moat. The one structurally-different bet is the **all-in-one connected household plan** (calculators + portfolio feeding one picture) aimed at people who find cFIREsim intimidating — and that's a *segment* play, not a *features* play.

**Net:** We do not beat cFIREsim/FIREproof at being cFIREsim/FIREproof, and we shouldn't try. We have a defensible-enough *wedge* — beginners + pre-65 healthcare + households — only if we lean into it hard and don't get drawn into a simulation arms race we'll lose.

---

## 2. Side-by-side comparison

| Dimension | **Plan My FIRE** | **cFIREsim** | **FIREproof** |
|---|---|---|---|
| **Target segment / sophistication** | Beginner→intermediate; households who've maybe never heard "FIRE" | Advanced / power users; FIRE-fluent | Advanced FIRE community; cFIREsim loyalists upgrading |
| **Core job-to-be-done** | "Can *we* (the household) retire early, across all our accounts — in plain English?" | "What's my historical success rate for this withdrawal plan?" | "Model & visualize my full retirement with taxes, ACA, and withdrawal strategy" |
| **Design & UX** | Modern, calm, consumer-friendly, guided, mobile-aware, ad-free | Dense, spreadsheet-like, dated, many collapsible form sections; intimidating to beginners | Modern (SvelteKit/Tailwind), more polished than cFIREsim; still power-user-shaped |
| **Simulation depth** | **Deterministic only** — 3 single-point FIRE modes; no Monte Carlo, no historical cycles | **Deep** — historical cycles (1871→), constant-growth, single-sim; Guyton-Klinger, VPW, variable spending, floor/ceiling; glide paths; success-rate % | **Deepest** — Monte Carlo + cFIREsim's engine + tax-aware withdrawals, bucket strategy, Roth-conversion optimizer (claimed superset of cFIREsim) |
| **Tax modeling** | Blunt "gross-up" simple tax mode only | Basic fees/inflation; limited tax | Income + capital-gains w/ cost basis; ACA subsidy optimization; **no IRMAA, no state tax** (per QuantCalc) |
| **Healthcare (pre-65)** | **First-class module** — ACA subsidy, 400% cliff, Medicare, **IRMAA** | None | ACA subsidy modeling + ZIP premium lookup; **no IRMAA** (per QuantCalc) |
| **Household / couples** | **Yes** — multi-owner accounts (User 1/2/Joint/Child), tax buckets, household portfolio | Single blended portfolio | Account/asset-allocation tracking; not framed as a two-person household tool |
| **Connected portfolio** | **Yes** — Portfolio Lab w/ EOD prices feeds the FIRE number | No portfolio holdings tracker; you type one number | Asset/account tracking, cost basis; richer than cFIREsim |
| **Content / SEO footprint** | **Growing** — server-rendered calculator pages, What-is-FIRE, glossary, FAQ schema | **Thin** — essentially one JS tool, little surrounding content | Thin — app + a blog; SPA |
| **Monetization** | None yet (donations planned; affiliate later; no ads ever) | Free, no account; donation-supported | **Freemium** — free tier + paid "Pro" (Stripe), account required |
| **Brand / community / trust** | **Zero** — brand-new, ~no traffic | **High** — ~14 yrs, beloved on Reddit/Bogleheads; built by an r/fire & r/financialindependence moderator | Inherits cFIREsim's trust; "14 years track record" positioning |
| **Privacy / login** | **No login required**, local-first, no brokerage linking | No account needed for basic use | **Account required** (Auth0) |
| **Accessibility to beginners** | **High** — plain language, "Help me choose," defines FIRE | Low — assumes you know withdrawal rates & spending models | Medium — friendlier than cFIREsim but still optimizer-shaped |

---

## 3. cFIREsim — strengths we likely can't beat, weaknesses we can exploit

**What it is:** A free, crowdsourced historical FIRE simulator created ~2012–2013 by Lauren Boland. It runs a plan against every historical market cycle (stocks/bonds/gold/cash, CPI inflation, from 1871) plus constant-growth and single-simulation modes, and reports a **success rate** (e.g. "96.67% — failed 4 of 119 cycles"). Inputs include multiple spending models (Inflation-Adjusted, Variable, VPW, Guyton-Klinger), floor/ceiling spending, glide-path allocation, two Social Security streams, up to ten custom income/expense adjustments, rebalancing and fees.

**Strengths we likely can't beat:**
- **Simulation depth & rigor.** Historical-cycle + the spending-model library is its core value, and it's miles ahead of our deterministic modes. We are not going to out-simulate it casually.
- **Brand & community trust.** ~14 years, a fixture in Reddit/Bogleheads "best calculator" conversations, made by a community moderator. That credibility is earned over a decade — unbuyable.
- **Power-user trust in transparency.** It "feels like a spreadsheet," shows its math, no sales motive. The audience that wants that is loyal.

**Weaknesses we can exploit:**
- **Intimidating for beginners.** Dense, jargon-heavy, spreadsheet-like form. A first-timer who just wants "can I retire at 55?" bounces. *This is our opening.*
- **Single-purpose.** One simulator. No connected portfolio, no calculator suite, no household coordination. You type one blended number.
- **No pre-65 healthcare.** No ACA-subsidy/cliff, no Medicare/IRMAA modeling — a real, current, expensive gap (esp. the 2026 cliff). *Our strongest differentiated bet.*
- **No household/couples framing.** Everything collapses to one portfolio and one person's lens.
- **Thin content/SEO.** A single JS tool with little surrounding text — it ranks on *brand*, not long-tail content. We can win long-tail it never targets.
- **Dated UX** and **flat-to-declining traffic** (SimilarWeb: ~14.5K visits/3mo, ~−31% MoM) — it isn't a fast-moving target.

---

## 4. FIREproof — strengths and weaknesses

**What it is:** The **sister/successor site** to cFIREsim, by the same creator (Lauren Boland), launched in **beta July 2025** at fireproofme.com. The founder's own claim: **"100% of cFIREsim's features with an extra ~20% in new features"** (their marketing — treat as a claim). Adds Monte Carlo, income + capital-gains tax with cost-basis tracking, ACA subsidy modeling with ZIP-based marketplace premium lookup, tax-aware withdrawal strategies (incl. a bucket strategy), and Roth-conversion planning (manual + optimizer). Built on a modern stack (Django/Python, SvelteKit, Tailwind, Auth0, Stripe). **Freemium**: free tier + paid "Pro."

**Strengths we likely can't beat:**
- **Deepest simulation + tax sophistication** in this comparison — Monte Carlo *and* the cFIREsim engine, plus tax-aware withdrawals and Roth-conversion optimization. Far beyond our deterministic modes.
- **Inherited brand & 14-year track record** via cFIREsim; active development by a trusted community figure.
- **It already entered our "healthcare" turf** — ACA subsidy modeling with premium lookup. This is the most important fact in this doc: our healthcare edge is **partially already contested.**

**Weaknesses we can exploit (carefully — it's actively developed):**
- **Per third-party review (QuantCalc): no IRMAA modeling and no state income tax.** So our healthcare depth (IRMAA, Medicare) is *still* a step ahead — but narrowly, and on features they could add quickly. *Confidence: medium — third-party claim, not verified in-app.*
- **Account required (Auth0)** and **Pro paywall** — friction and cost vs. our free/no-login stance. Privacy-first and beginner users may balk.
- **Still optimizer-shaped, not beginner-shaped.** Friendlier than cFIREsim, but the job-to-be-done is "model my full retirement with taxes," not "explain this to someone who's never heard of FIRE."
- **Not a household/couples tool** in the way we frame it.
- **Thin content/SEO** — app + a blog, JS SPA. Same long-tail opening as cFIREsim.
- **Beta** — newer, less battle-tested than the cFIREsim brand it leans on.

---

## 5. Where Plan My FIRE can actually win (validated)

Scored honestly — **real edge** vs. **nice-to-have** vs. **already contested**:

1. **Beginner-friendliness / plain language — REAL edge, NOT defensible.** Both competitors assume fluency in withdrawal rates and spending models. Our "Help me choose," plain-English framing, and What-is-FIRE/glossary genuinely serve a segment they ignore. *But anyone can copy plain language; the moat is being *known* for beginners, not the feature itself.*

2. **Pre-65 ACA / Medicare / IRMAA healthcare module — REAL edge, PARTIALLY CONTESTED, narrow.** cFIREsim has nothing here. FIREproof has ACA subsidies but (per QuantCalc) **no IRMAA**. So we're ahead on *depth* (IRMAA, Medicare) but the headline (ACA subsidies) is no longer unique. Still our **strongest single differentiated bet** because demand is high, current (2026 cliff), and the competitors lead with simulation, not healthcare. *Erodable — guard it by going deeper and ranking for the long-tail first.*

3. **Household / couples multi-account framing — REAL edge, the most structural.** Both competitors collapse to one blended portfolio. Our multi-owner accounts (User 1/2/Joint/Child) + tax buckets + a connected portfolio is a genuinely different product shape, not a setting. Hardest for them to bolt on. *This is the most defensible differentiator.*

4. **All-in-one *connected* plan (calculators + portfolio → one number) — REAL edge as a *segment* play.** cFIREsim is one simulator; we're a workspace where Social Security, healthcare, mortgage, investment, and the household portfolio feed one picture. Valuable to beginners who want a guided hub, not a single power tool. *Nice-to-have to a power user; real to our target.*

5. **Privacy / no-login / free / ad-free — REAL but commoditized edge.** cFIREsim is also free/no-login (we don't beat it there). We *do* beat **FIREproof** (account + Pro paywall). Good for trust and conversion; not a standalone reason to switch.

6. **Modern UX — REAL but cosmetic.** Cleaner than cFIREsim's dated form; roughly par with FIREproof. Helps first impressions; doesn't win on its own.

7. **SEO long-tail content footprint — REAL and important *operationally*.** Both competitors are thin-content JS SPAs ranking on brand. Our server-rendered calculator pages + guides + glossary can win dozens of long-tail terms they never target. This is less a "product edge" and more **our only realistic growth engine** (see `GROWTH_ASSESSMENT_5K.md`).

**The honest synthesis:** #2, #3, and #4 are the real, somewhat-defensible edges — and they're all the *same bet*: **beginners + pre-65 healthcare + households**, served as one connected plan. #1, #5, #6 are true but copyable. #7 is how we get found, not why we win.

---

## 6. Where we're behind, and what to do about it

**Behind, and it matters:**
- **Simulation depth.** No Monte Carlo, no historical cycles, no success-rate %, no sequence-of-returns stress test, no advanced spending models. To a serious FIRE user this reads as "not a real FIRE tool yet."
- **Tax sophistication.** Blunt gross-up vs. FIREproof's cost-basis + capital-gains + Roth-conversion optimization.
- **Brand & community trust.** Zero vs. cFIREsim's 14 years. We can't shortcut this.

**The honest strategic call:** **Out-competing cFIREsim/FIREproof on simulation is NOT the play.** They have a decade head start, a community moderator's credibility, and a working Monte Carlo + historical engine. Chasing them there means a long, expensive build to reach *parity* with their headline feature — and we'd still be the unknown newcomer. 

**What to do instead:** Win a **different segment** they under-serve — beginners who find cFIREsim intimidating, pre-65 healthcare planners, and couples/households — and be unmistakably *the* tool for that. Add just enough credibility-signaling depth (below) to not look like a toy, but don't try to win the optimizer war.

**The minimum we should still add (credibility, not parity):**
- A **lightweight "what if markets are bad?"** signal — even a simple historical-worst-case or a coarse Monte Carlo "success rate" band would close the most glaring credibility gap without a full optimizer suite. (Noted in the PRD long-term roadmap.)
- Finish and deepen **healthcare (IRMAA/Medicare)** so the one place we're ahead stays ahead.
- Tighten the **household/couples** story, since it's the hardest for them to copy.

---

## 7. Strategic recommendation

**Lean into the differentiation. Niche down on beginners + pre-65 healthcare + households. Add depth only as a credibility floor — not as a strategy.**

Given the founder's low-maintenance constraint, an arms race on Monte Carlo / tax optimization is exactly the wrong fight: high build cost, ongoing maintenance, and we'd still lose on brand. The realistic, low-maintenance-compatible play:

1. **Own the wedge.** Make Plan My FIRE the clear answer to "can *we* retire early, in plain English, including healthcare before 65?" That's a real, under-served segment both competitors structurally ignore. This is positioning + content, which fits a solo founder.
2. **Defend the two real moats** — pre-65 healthcare *depth* (IRMAA/Medicare, where even FIREproof is thin) and the *household/couples* framing. Go deeper here, not wider.
3. **Add a credibility floor, not a feature war.** One coarse risk/"success-rate" signal (PRD long-term: historical-block / Monte Carlo) is worth more than ten optimizer features — it stops serious users dismissing us, without committing to out-simulating a 14-year-old engine. Time-box it; don't let it become the roadmap.
4. **Win discovery on long-tail SEO**, where both competitors are thin (see `GROWTH_ASSESSMENT_5K.md`). This is our growth engine regardless of features.
5. **Don't bother competing on:** simulation sophistication for power users, brand/community trust (earn it slowly via genuine community presence), or tax-optimization breadth. Those are FIREproof's home turf.

**One-line recommendation:** *Be the friendly, household, healthcare-aware on-ramp to FIRE that cFIREsim/FIREproof are too power-user-focused to be — add only enough simulation to look credible, and never try to beat them at their own game.*

---

### Sources
- cFIREsim app (inputs, spending models, free/no-account, JS SPA): https://www.cfiresim.com/
- FIREproof launch blog (creator, relationship to cFIREsim, "100%+20%" claim, freemium, stack): https://fireproofme.com/blog/welcome-to-fireproof
- FIREproof site (modeling/visualization positioning): https://fireproofme.com/
- Bogleheads — "cFIREsim creator launches FireProof" (confirms sister-site lineage): https://www.bogleheads.org/forum/viewtopic.php?t=459927
- QuantCalc — 2026 retirement calculator comparison (FIREproof: Monte Carlo, tax-aware, ACA; "no IRMAA," "no state income tax," freemium, community trust): https://quantcalc.app/blog/best-retirement-calculator-2026-comparison/
- The Ways To Wealth — cFIREsim as historical/Monte-Carlo simulator, success-rate output, "feels like a spreadsheet," advanced users: https://www.thewaystowealth.com/free-monte-carlo-simulation-calculator/
- cFIREsim-open (open-source lineage, JS rewrite, transparency goal): https://github.com/boknows/cFIREsim-open · https://alistair-marshall.github.io/cFIREsim-open/
- SimilarWeb — cfiresim.com traffic (~14.5K visits/3mo, ~−31% MoM): https://www.similarweb.com/website/cfiresim.com/
- @cFIREsim on X (active FIREproof/cFIREsim development): https://x.com/cFIREsim

*Competitor sites are JavaScript SPAs; feature lists are best-effort from rendered apps, founders' own marketing, and third-party reviews, not exhaustive crawls. Claims attributed to a competitor's marketing or to single third-party reviews are labeled as such. Plan My FIRE provides planning estimates only; this is internal strategy analysis, not advice.*
