# Plan My FIRE — Monetization Options Plan

*Created: 2026-06-12 · Last updated: 2026-06-12*

> Product: **Plan My FIRE** · Site: **[planmyfi.com](https://planmyfi.com)** · Market: US · Status: launching
> Reads alongside [`MARKETING_PLAN.md`](./MARKETING_PLAN.md) and [`SEO_AUDIENCE_RESEARCH.md`](./SEO_AUDIENCE_RESEARCH.md).

---

## The non-negotiable lens

Every option below is judged against the four promises the brand is built on:

1. **Free** — the core planning experience stays genuinely free, not a crippled teaser.
2. **Clean & ad-free** — no clutter, no popups, no chasing you around the web.
3. **Privacy-first, no login required** — numbers stay in the browser; nothing to link, no account forced.
4. **Plain language, no sales pressure** — this is a workspace, not a funnel into someone's commission.

If a money idea dents any of these, it has to earn its place loudly — and some don't earn it at all. This doc is honest about which.

**The headline reality:** a brand-new free tool makes very little money early. The near-term play is **audience + trust**, not revenue. Trust is the asset that *all* future monetization compounds on, so the cardinal rule is: **never spend trust faster than you build it.**

---

## Quick comparison

| Option | Revenue potential (at meaningful traffic) | Effort | Trust / UX risk | Verdict |
|---|---|---|---|---|
| 1. Affiliate / referral | Medium–High | Medium | Medium (disclosure-dependent) | **Yes, done carefully** — the natural primary engine |
| 2. Freemium / Pro tier | Medium | High | Low–Medium | **Yes, later** — once there's a power-user base |
| 3. Donations / supporter | Low | Very low | Very low | **Yes, now** — cheap, on-brand, low stakes |
| 4. Display ads | Low–Medium | Low | **High** | **Recommend against** (see why) |
| 5. Sponsorships / newsletter | Medium | Medium | Low–Medium | **Yes, once an audience exists** |
| 6. B2B / white-label / embeds | Medium–High | High | Low (separate surface) | **Yes, opportunistic** — keeps consumer app pure |
| 7. Selling user data / dark patterns | — | — | **Fatal** | **Never. Off the table.** |

---

## 1. Affiliate / referral partnerships

**How it works for this product.** Plan My FIRE already surfaces the exact moments where a user realizes they need a financial product: "I should open a Roth," "I need a higher-yield place for my cash bridge," "I need ACA coverage for the pre-65 gap," "I should consolidate old 401(k)s." A *contextual, clearly-labeled* "learn more" link to a relevant provider (brokerage, robo-advisor, high-yield savings, ACA marketplace like a licensed broker, budgeting tool) can pay a referral fee when a user signs up. The fit is genuine because the need is real and surfaced by the user's own numbers — not invented.

**Realistic revenue (order-of-magnitude, tied to traffic).**
- Affiliate income scales with *qualified clicks → conversions*, not pageviews.
- At **~1–5k visitors/mo** (early): essentially noise — **$0–low tens of dollars/mo**.
- At **~20–50k visitors/mo** (moderate): **low hundreds/mo**, depending heavily on placement and category. High-yield-savings and brokerage payouts can be $50–$200+ per funded account, so even a handful of conversions a month matters.
- At **100k+ visitors/mo** (scale): **four figures/mo is plausible** if placements are relevant and trust is intact. This is realistically the single largest revenue lever for a content+calculator finance site.

**Implementation effort: Medium.** Apply to affiliate programs / networks, get approved (finance programs vet sites — you need real content and traffic first), add tracked links, build a disclosure component, and instrument clicks so you can see what actually works.

**UX / trust tradeoff — the big caveats.**
- **Disclosure is mandatory, not optional.** This is financial content with paid relationships → FTC requires clear, conspicuous affiliate disclosure. Add a standing disclosure (footer + a short line near any affiliate link) and an `/affiliate-disclosure` page.
- **Never let payouts bias the recommendation.** The instant a user suspects link placement is driven by commission rather than their interest, the whole "transparent, no-sales" positioning collapses — and the FIRE community (per the marketing plan) *punishes anything that smells like advisor sales*. Rank by genuine fit, disclose, and ideally show non-affiliate options too.
- **Avoid anything that reads as financial advice.** Keep language to "here are options people in your situation use" — never "you should buy X." No personalized recommendations that could imply fiduciary advice.
- **Keep it sparse and contextual.** One tasteful, relevant link at a moment of genuine need beats a wall of "our partners." Sparse placement *protects* conversion quality and trust simultaneously.

**Recommendation:** This is the **primary long-term engine**, but it only works if it's disclosed, sparse, and never biased. Start applying once there's enough content/traffic to get approved; deploy only contextual, labeled links.

---

## 2. Freemium / Pro tier

**How it works for this product.** Keep the entire current planning experience free forever — all calculators, all three FIRE strategy modes, the household portfolio view, the no-login workspace. "Pro" is **additive convenience and depth for power users**, never a paywall around the core promise. Candidate Pro features:
- **Saved scenarios / multiple plans** (e.g. "retire at 52 vs 55", side-by-side compare).
- **PDF / shareable report export** of a plan (genuinely useful for couples, and for users taking numbers to an advisor).
- **Advanced projections** — Monte Carlo / sequence-of-returns stress testing, historical-sequence backtests, more granular Roth-ladder modeling.
- **More accounts / higher limits** if the free tier ever caps them (it shouldn't cap below what a normal household needs).
- **Priority / more-frequent data refresh** on the portfolio view (free = daily, Pro = intraday).
- **Cross-device sync as a premium nicety** — *only* if the free no-login experience stays fully intact (sync is opt-in already).

**Realistic revenue (order-of-magnitude).**
- Free-tool conversion to paid is typically **~1–3% of engaged users**, and lower for a tool used a few times rather than daily.
- At **~20–50k visitors/mo**, with a small fraction engaged enough to convert at ~$5/mo or ~$30–50/yr: **low-to-mid hundreds/mo** at the optimistic end.
- At **scale (100k+/mo)** with a strong power-user base: **four figures/mo is reachable**, but only if the Pro features are compelling enough that enthusiasts *want* to pay (FIRE optimizers will pay for serious projection depth + export + saved scenarios).

**Implementation effort: High.** Requires auth tied to accounts (already partially there via optional login), billing (Stripe), entitlement gating, and ongoing support obligations once people pay. Paid users expect reliability and responsiveness — that's a real commitment.

**UX / trust tradeoff.**
- **Low–Medium risk *if* the free/paid line is drawn honestly.** The danger is scope-creep: features that "obviously belong free" drifting behind the paywall. Write down the free guarantee and defend it.
- Pro must feel like "**support the project + get power-user extras**," not "the free version is deliberately annoying." Avoid dark patterns (nagging, artificial limits on basic use).
- Billing means accounts → a privacy surface. Keep the **no-login free path fully usable** so privacy-conscious users never *have* to create an account; Pro is the only thing that requires one.

**Recommendation:** Strong fit, but **later** — only once there's a base of repeat power users and a clearly additive feature set. Build saved-scenarios + PDF export + advanced projections first as the natural Pro bundle.

---

## 3. Donations / "buy me a coffee" / supporter tier

**How it works.** A simple, no-pressure "support this project" link (Buy Me a Coffee, Ko-fi, GitHub Sponsors, or Stripe one-tap). Framing matters: "*This tool is free and ad-free. If it helped, you can chip in to keep it that way.*" Optionally a tiny "supporter" recognition (a name in a thank-you list, a subtle badge) — no gated features, so it stays clean.

**Realistic revenue (order-of-magnitude).**
- Donations are **low and lumpy** — a tiny fraction of users ever give. Rule of thumb: a few dollars per *thousands* of visitors.
- Early/moderate traffic: **$0–low tens/mo**. At scale with a loyal audience: **low hundreds/mo** in good months. It rarely becomes a primary income source.

**Implementation effort: Very low.** A link and a short line of copy. No accounts, no billing infra you have to own (the platforms handle it), no support burden.

**UX / trust tradeoff: Very low — actually trust-*building*.** A polite, dismissible "keep it free and ad-free" ask *reinforces* the positioning rather than undermining it. The only risk is over-asking (popups, guilt-trips) — keep it to a quiet footer/about-page placement.

**Recommendation:** **Do this now.** It's nearly free to add, on-brand, and signals values. Don't expect it to pay the bills — treat it as a values signal and a small bonus.

---

## 4. Display ads

**How it works.** Banner/programmatic ad units (e.g. an ad network) injected into pages, paying per impression/click.

**Realistic revenue (order-of-magnitude).** Finance is a high-CPM vertical, so ads *can* earn more here than average — but they still need volume. At small/moderate traffic it's **single digits to low tens of dollars/mo** — not worth the cost below. Only at serious scale (100k+/mo) do ads reach **hundreds/mo**, and even then they typically underperform well-placed affiliate links per visitor.

**Implementation effort: Low** to add — which is exactly the trap.

**UX / trust tradeoff: HIGH — this conflicts most directly with the brand.**
- The positioning is *literally* "clean, ad-free." Adding ads contradicts the homepage promise and the pitch used across the marketing plan ("free, private, no login," "your numbers stay yours").
- Programmatic ad networks often drop **tracking/retargeting scripts and cookies** — a direct hit to the privacy-first promise, and potentially a contradiction of any "we don't track you" messaging.
- Finance ads are frequently the *exact* predatory products (high-fee advisors, sketchy "retire rich" pitches) the audience distrusts. They'd actively cheapen the brand.
- Ads slow the page and clutter the workspace — degrading the calm, focused UX.

**Recommendation: Recommend against.** The trust/UX cost is far larger than the modest revenue at any realistic traffic level, and it breaks an explicit brand promise. If ever revisited at large scale, the *only* defensible form is **one tasteful, static, privacy-respecting placement** (e.g. a single hand-picked sponsor slot with no third-party tracking — which is really sponsorship, see §5), never a programmatic network. Default answer: **no ads.**

---

## 5. Sponsorships / sponsored newsletter

**How it works.** Once there's an audience (email list and/or steady traffic), sell *curated, relevant* sponsorship — a single tasteful "supported by" slot, or a sponsor in a periodic FIRE/early-retirement newsletter. Unlike programmatic ads, **you control who appears**, vet them for alignment (a reputable brokerage or HSA provider, not a payday lender), and there's no tracking-script baggage.

**Realistic revenue (order-of-magnitude).**
- Newsletter sponsorship is priced on list size/engagement — roughly **$20–40 per 1,000 engaged subscribers per send** in finance.
- A **2–5k** subscriber list: **low hundreds per sponsored send**. A **10k+** engaged list: **mid hundreds to low four figures per send**, and the list itself becomes a durable, ownable asset (independent of Google's algorithm).
- Site sponsorship scales with traffic similarly to affiliate but with more control and a cleaner footprint.

**Implementation effort: Medium.** Requires building an email list (ethically — opt-in only, given the privacy stance), publishing a newsletter people *want*, and doing sponsor sales/vetting. The content engine is the real cost.

**UX / trust tradeoff: Low–Medium.** Done right (one clearly-labeled, well-aligned sponsor, no tracking), it's far gentler than display ads and respects the reader. The risks: a poorly-matched sponsor erodes trust, and **any email list must be strictly opt-in and privacy-respecting** to honor the brand. Always label sponsored content clearly.

**Recommendation:** **Yes — once there's an audience.** It pairs perfectly with the content/SEO strategy in the marketing plan. Build the (opt-in) list first as an audience asset; monetize it gently and selectively later.

---

## 6. B2B / white-label / embeddable calculators

**How it works.** The calculators and household model are valuable to *other* businesses:
- **Embeddable / white-label calculators** for fee-only financial advisors, employers/benefits teams, or personal-finance publishers who want a quality FIRE/healthcare calculator on their own site (licensed, branded to them).
- **A lightweight API or widget** for the same audiences.
- **Lead-gen for fee-only (flat-fee, non-commission) advisors** — *only* the kind the FIRE audience actually respects — as an optional, clearly-separate "talk to a planner" surface.

The strategic beauty: this monetizes **on a separate B2B surface**, leaving the consumer app clean, free, and untouched.

**Realistic revenue (order-of-magnitude).** B2B deals are few but each is worth far more than consumer micro-payments — think **$X00–$X,000+ per client** for a white-label license or embed, per year. A handful of advisor/employer clients can outweigh thousands of consumer visitors. Revenue is **lumpy and sales-driven**, not traffic-driven, so it can start before consumer traffic is large — but it needs the product to be polished and a sales motion you're willing to run.

**Implementation effort: High.** Requires productizing for embedding (theming, isolation, licensing, support, possibly an API), plus a B2B sales process. Real engineering + business-development work.

**UX / trust tradeoff: Low for the consumer app** — it lives on a separate surface and doesn't touch the free experience. The one caution: any "talk to an advisor" feature must route **only to fee-only, non-commission** advisors and be clearly optional, or it reintroduces the "advisor sales" smell the audience hates.

**Recommendation:** **Opportunistic / medium-term.** High value per deal and keeps the consumer app pure — but it's a different business with its own effort curve. Pursue if inbound interest appears (e.g. an advisor asks to embed it) rather than building it speculatively before the consumer product has proven itself.

---

## 7. What to avoid (explicitly off the table)

These conflict fatally with the brand and are non-starters:

- **Selling or sharing user financial data.** Off the table, permanently. The entire pitch is "your numbers stay yours, in your browser." Selling data would be a total betrayal — and legally/reputationally radioactive for finance data. **Never.**
- **Forcing login or account creation to use core features.** The no-login promise is a differentiator (per the marketing plan, a top-4 reason the product is different). Don't gate the free workspace behind sign-up to harvest emails.
- **Programmatic ad networks with third-party tracking** (see §4) — privacy and clean-UX violation.
- **Commission-driven "recommendations" disguised as neutral advice.** Biased rankings dressed as guidance are the exact thing the audience distrusts; it also risks looking like regulated financial advice.
- **Dark patterns:** fake urgency, deliberately crippling the free tier to force upgrades, nag-walls, hard-to-cancel subscriptions, pre-checked opt-ins. All erode the trust everything else depends on.
- **Lead-gen to commissioned/AUM advisors or low-quality finance products** (payday loans, high-fee annuities, "get rich" pitches). Wrong audience, wrong values.

---

## Recommended phased path

Sequenced **lowest-trust-risk first**, matched to traffic. Revenue is a *lagging* outcome of trust + audience — build those first.

### Phase 1 — Now (low traffic: launch → ~5k visitors/mo)
**Goal: audience + trust, not revenue.** Expect near-zero income; that's correct.
- ✅ Add a quiet, no-pressure **donation / "keep it free and ad-free" link** (§3). Cheap, on-brand.
- ✅ Start an **opt-in email list** (§5) purely as an audience asset — no monetization yet. Privacy-respecting, clearly optional.
- ✅ Put the **disclosure/values infrastructure** in place early: a `/affiliate-disclosure` page and footer line, even before any affiliate links exist, so it's ready and signals transparency.
- ⛔ No ads. No paywall. No forced login.
- Focus engineering on the product and the SEO/content engine from the marketing plan.

### Phase 2 — Moderate traffic (~20–50k visitors/mo, a growing list)
**Goal: monetize gently where the user already has a real need.**
- ✅ Introduce **contextual, disclosed affiliate links** (§1) at genuine decision moments — sparse, labeled, never biased. This becomes the primary revenue engine.
- ✅ Begin a **periodic newsletter**; once the list is engaged, take **one well-vetted sponsor** per send (§5).
- ✅ Start scoping the **Pro tier** (§2) — build saved scenarios, PDF export, and advanced projections as genuinely additive power-user features.
- ⛔ Still no programmatic ads.

### Phase 3 — Scale (100k+ visitors/mo, real audience)
**Goal: diversify on top of a trusted base.**
- ✅ Launch the **Pro / supporter subscription** (§2) — keep the free core fully intact; Pro = depth + convenience.
- ✅ Mature **affiliate** placements (more categories, better instrumentation) and **newsletter sponsorship** (higher rates as the list grows).
- ✅ Pursue **B2B / white-label / embeds** (§6) opportunistically — especially if advisors or employers come asking.
- ⛔ Revisit display ads **only** if everything else is maxed and even then only a single tasteful, tracking-free sponsor slot — i.e. sponsorship, not a network.

---

## Principles — monetize without betraying the promise

1. **Trust is the asset. Money is the lagging indicator.** Never spend trust faster than you earn it; a single sleazy placement can undo months of community goodwill (the FIRE crowd has a long memory and a low tolerance for sales).
2. **The free core stays genuinely free — forever.** All current calculators, all three strategy modes, the household view, the no-login workspace. Monetization is *additive* (Pro extras, optional links), never *subtractive* (paywalling what's free today).
3. **Privacy is not for sale.** No selling data, no forced accounts, no third-party tracking smuggled in via ads. The no-login path always works.
4. **Disclose everything.** Affiliate relationships, sponsorships, and any paid placement get clear, conspicuous labels. Transparency is on-brand *and* legally required for finance content.
5. **Never look like biased financial advice.** Surface options, disclose relationships, show neutral alternatives, and keep the language "here's what people in your situation consider" — never "you should buy this."
6. **Calm over clutter.** Whatever ships must respect the clean, focused workspace. Sparse and relevant beats dense and lucrative — sparse placements convert better *and* protect the brand.
7. **Align incentives with the user.** The best monetization (a relevant brokerage when they decide to open a Roth; a Pro export they genuinely want) helps the user *and* pays — those compound. Anything that pays only by costing the user is off the table.

---

## A realistic expectations note

Be honest with yourself about the numbers: **a brand-new free finance tool earns very little at first.** At launch and through early growth, monetization will be effectively a rounding error — and trying to force revenue early (ads, aggressive paywalls, login walls) is the fastest way to kill the trust and word-of-mouth that everything depends on.

The near-term win is **audience and credibility**: indexed pages, rising impressions, identifiable referrers, a growing opt-in list, and a reputation in the FIRE communities as a genuinely useful, no-strings tool (exactly what the marketing plan is built to produce). Revenue follows *that*, on a lag, mostly through affiliate + (eventually) a modest Pro tier and a sponsored newsletter.

Realistic shape: **months of near-zero**, then **small but real** (tens → low hundreds/mo) as traffic and the list grow, then **meaningfully more** (low-to-mid four figures/mo is a credible aspiration, not a guarantee) only at genuine scale with multiple gentle, on-brand streams stacked on a foundation of trust. Build the trust first; the rest is downstream of it.
