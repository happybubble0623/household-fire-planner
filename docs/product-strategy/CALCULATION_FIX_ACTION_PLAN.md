# Calculation Fix Action Plan — Reconciled, Prioritized, Test-Pinned

*Created: 2026-06-13 · Last updated: 2026-06-13*

> **What this is.** A single, decisive fix plan that reconciles the read-only
> [`CALCULATION_AUDIT.md`](./CALCULATION_AUDIT.md) with the end-to-end
> [`CALCULATION_VALIDATION.md`](./CALCULATION_VALIDATION.md). **The validation is
> authoritative wherever the two disagree** — it ran the real calculator code and
> captured hard expected-vs-actual numbers. Findings the validation *refuted* or
> reclassified are **excluded** from the fix list and recorded under
> §4 "Verified correct — no action." Every fix maps to a queued `it.skip` test in
> [`src/tests/calculations/rule-pinned.test.ts`](../../src/tests/calculations/rule-pinned.test.ts)
> that flips green when the fix lands. **No calculator code is changed by this doc.**

---

## 1. Status

**7 confirmed bugs remain — 2 Critical · 3 Moderate · 2 Minor — plus 1 default-value
decision (not a bug).** All seven are reproduced by running the real code with hard
expected-vs-actual figures, and each has a queued `it.skip` regression test waiting
to be flipped to `it`. Two audit items were checked and are **correct, no action
needed**: the **Social Security 35-year AIME averaging** (top-35 indexed years,
zero-filled to 420 months, floored — founder's worry *refuted*, locked by SS-1/SS-1b)
and the **IRMAA brackets/surcharges** (constants and tier-selection logic correct;
the audit's $200k worked example was the error, not the code — locked by HC-3). The
audit's §6.1 "tax gross-up violation" is also **excluded** — validation confirmed the
`gap/(1−rate)` formula is arithmetically correct (FIRE-3); the concern is a modeling
*simplification*, not a math bug. Net: the core engines are sound; the confirmed bugs
are bounded, mostly in healthcare-eligibility defaults and two inflation/threshold
gaps.

---

## 2. Prioritized fix list (Critical → Moderate → Minor)

| # | Calculator | Issue (plain language) | Severity | Rule + source | Expected vs Actual (validated) | Fix approach (concrete) | Test to flip green | Effort |
|---|---|---|---|---|---|---|---|---|
| 1 | Healthcare / Medicare (`healthcare-cost.ts`, `healthcare-cost-panel.tsx`) | Original Medicare + Medigap path is charged a Medicare-Advantage-style OOP-max ($6,000 default). Original Medicare has **no** OOP max; Plan G exposure ≈ the Part B deductible. | **Critical** | Original Medicare has no MOOP; Medigap Plan G ≈ $283 Part B deductible — [medicare.gov Medigap](https://www.medicare.gov/health-drug-plans/medigap); CMS 2026 Part B deductible | **~$283/yr** expected vs **$1,800/yr** actual (0.30 × $6,000) → **≈ $1,517/yr/person** overstated, compounding ~25 Medicare yrs | Make the OOP default **coverage-type-specific**: Medigap → seed from plan design (Plan G ≈ $283 + small drug-copay allowance; K/L → statutory caps); Advantage → keep MA-MOOP model. Never show the "$6,000 MA average" default when `medicareCoverage === "medigap"`. | `HC-7` | **M** |
| 2 | FIRE — saved-path deterministic evaluator (`calculations/fire.ts`) | Evaluator sums raw expense amounts with **no inflation** and ignores each expense's `inflationAdjusted` flag while compounding the portfolio at a **nominal** return → overstates survival → over-optimistic "can I retire?" verdict. **⚠️ Verify live:** confirm this evaluator drives a user-facing page before over-prioritizing — it may be a dormant engine superseded by `phase1/fire.ts`. | **Critical** | Nominal returns must be paired with inflating spending (as `monte-carlo.ts` and `phase1/fire.ts` both do) | Two plans differing **only** in `inflationAdjusted` produce **byte-identical** results (flag ignored) vs **must differ** | Inflate expenses each projection month (mirror `monte-carlo.ts` / `phase1`), **or** switch to real returns with real spending — but be consistent. First: confirm which live surface calls `evaluateCandidateRetirementDate`. | `FIRE-6` | **M** (S if dormant) |
| 3 | Healthcare / ACA (`healthcare-cost.ts`) | Below 150% FPL the applicable-% is flat-floored at 2.10%; the real schedule is **not** flat in the 133–150% band → expected contribution understated → subsidy overstated. | **Moderate** | [IRS Rev. Proc. 2025-25](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf): <133% = 2.10%, 133% = 3.14%, 138% = 3.45%, 150% = 4.19%, interpolate | **~3.61%** expected (140.6% FPL) vs **2.10%** actual → contribution $794 vs $462 → **subsidy overstated ≈ $332/yr** | Add the 133% → 3.14% and 138% → 3.45% nodes and interpolate within 133–150%; keep 2.10% only strictly **below** 133% FPL. | `HC-5` | **S** |
| 4 | Healthcare / ACA (`healthcare-data.ts`, `healthcare-cost.ts`) | Cost-Sharing Reductions not modeled: Silver OOP max is a flat $8,500 regardless of income; 100–250% FPL Silver enrollees get statutorily reduced OOP maxima. | **Moderate** | [Fed. Reg. 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability): ≤150% & 151–200% → $3,500/$7,000; 201–250% → $8,450/$16,900 | **$3,500** expected (175% FPL Silver) vs **$8,500** actual → OOP max overstated by **$5,000**; expected OOP at "high" usage overstated by **$3,725** | When plan is Silver **and** income is 100–250% FPL, override `acaOutOfPocketMax` (and ideally deductible) to the CSR-tier value before computing expected OOP. | `HC-6` | **M** |
| 5 | Mortgage (`planning-tool-panel.tsx` `calculateMortgage`) | PMI cancels at 80% of the original **loan**, and there is **no home-value input**, so PMI runs years too long. Rule pins to 80%/78% of original **home value**. | **Moderate** | [CFPB / Homeowners Protection Act](https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/): cancel at 80%, auto-terminate at 78% of original value (lesser of price/appraisal) | PMI gone once balance ≤ **$320,000** (80% of $400k value, ~2033) vs actual drops only at ≤ **$288,000** (80% of $360k loan, ~2038) → **~5 extra yrs × $1,800 ≈ $9,000** overcharged | Add a **home-value / purchase-price** input; cancel PMI at 80% and auto-terminate at 78% of that value; suppress cancellation for FHA <10% down (MIP for life of loan). | `MTG-3` | **M** |
| 6 | Social Security (`social-security.ts`) | Final monthly benefit is rounded to cents, not floored to the whole dollar SSA actually pays. | **Minor** | [SSA — Benefits computation](https://www.ssa.gov/oact/cola/Benefits.html): "round down to the next lower dollar" | Whole-dollar (e.g. **$6,676**) expected vs **$6,676.50** actual → off by up to ~$0.99/mo (cosmetic) | Apply `Math.floor` to whole dollars on the final monthly benefit (PIA stays dime-rounded). | `SS-6` | **S** |
| 7 | Investment (`planning-tool-panel.tsx` `calculateInvestment`) | No expense-ratio / fee input; returns applied gross, overstating ending balance. | **Minor** | Net-of-fee returns are standard; a 0.5% fee materially compounds | A 0.5% lower net return cuts the 15-yr balance **5.1%** ($918,819 → $871,510) — magnitude **corrected** from the audit's "7–8%" | Add an expense-ratio input and apply `(return − expenseRatio)`, or label the return field "net of fees." *(Pair with the §4.2 today's-dollar view if bundling investment-calc work.)* | INV-2 *(passing — motivates; add a queued bug-test when the input ships)* | **S** |
| 8 | FIRE — simple FIRE number (`calculations/fire.ts`) | **DECISION, not a bug.** `calculateSimpleFireNumber` default withdrawal rate is **5%** (20×), but the app's glossary/strategy copy headlines the **4% rule** (25×). The live saved-path passes the user's own rate, so 5% only fires on a bare default call. | **Minor** (decision) | App's own framing uses the 4% rule (`fire-glossary.ts`, `fire-strategies.ts`) | Default returns **$960,000** (20×) vs **$1,200,000** (25×) the copy implies → $240k / 20% gap when the default fires | **Decide:** change the default to `0.04` for consistency, or require the rate explicitly. Either flips the test. | `FIRE-5` | **S** |

> Excluded as not-a-bug per validation: **§2.2 IRMAA** (code correct, audit example wrong — locked by HC-3) and **§6.1 tax gross-up** (formula correct; a documented simplification, not a math error — locked by FIRE-3). Other audit "minor structural" notes (§1.8 CPI-vs-wage deflator, §4.2 today's-dollar investment view, §2.8 Part D $2,100 cap, §2.9 Medicaid 5% cap) are real but have **no queued test** and are conservative/cosmetic; fold them in opportunistically when touching the same file — they are not gating.

---

## 3. Recommended sequence

**First — the two Criticals that change user-facing dollars.**
1. **#1 Medicare/Medigap OOP** (`HC-7`). Highest user-trust impact, directly the
   class of error that triggered this whole audit, and it moves the headline lifetime
   number by tens of thousands. Do it first.
2. **#2 saved-path FIRE inflation** (`FIRE-6`) — **but verify-live before sizing.**
   If `evaluateCandidateRetirementDate` drives a live "can I retire?" page it is a
   true Critical; if it's a dormant engine behind `phase1/fire.ts`, demote it to a
   cleanup. Resolve that question, then either fix-or-document.

**Second — the healthcare-eligibility cluster (#3 ACA <150%, #4 CSR), grouped.**
Both `HC-5` and `HC-6` live in the ACA path (`healthcare-cost.ts` / `healthcare-data.ts`),
both are FPL-band-driven, and both share scenario plumbing. **These two pair naturally
with the already-approved pre-65 scenario build** (`PRE65_SCENARIO_SPEC.md`): that work
is reworking the income → coverage → OOP flow anyway, so the applicable-% nodes and the
CSR OOP-max override should land **inside** that scenario rework rather than as separate
one-offs. Do them together, on that branch.

**Third — the standalone Moderates and Minors.**
3. **#5 Mortgage PMI** (`MTG-3`) — self-contained but needs a **new UI input**
   (home value), so it carries a bit more surface area than the other minors; schedule
   it as its own slice.
4. **#6 SS dollar floor** (`SS-6`), **#7 investment fee input** (`INV-2` →
   queued bug-test), **#8 simple-FIRE default decision** (`FIRE-5`) — small, isolated,
   batchable. #8 needs a founder decision (4% vs 5%) before coding; surface it, then
   one-line the change.

Rationale: dollar-moving Criticals first (user trust + headline accuracy); then ride
the approved pre-65 scenario work for the two ACA fixes (no duplicated scenario plumbing);
then mop up the cheap, isolated minors.

---

## 4. Verified correct — no action

Re-confirmed by **running the real code** in the validation pass; do not "fix" these:

- **SS AIME 35-year / 420-month averaging** (`SS-1`, `SS-1b`) — top-35 indexed years,
  zero-filled to 420 months, floored. Founder's worry **refuted**; this is exactly the
  SSA method.
- **SS PIA bend-point formula** (`SS-2`, `SS-2b`, `SS-5`) — 90/32/15 layering, 2026 bend
  points $1,286/$7,749, dime-rounded.
- **SS claiming adjustments & FRA table** (`SS-3`, `SS-4`) — early 5/9% + 5/12%/mo, DRC
  2/3%/mo; FRA 66 / 66y2m / 67. **WEP/GPO correctly omitted** (repealed by the Social
  Security Fairness Act).
- **IRMAA 2026 brackets & surcharges** (`HC-3`) — multipliers, Part D surcharges, and
  tier selection all correct; the audit's $200k → 2.0× example was the error, not the
  code ($200k correctly returns 2.6× / $527.54 / $60.40).
- **ACA PTC core & 400% cliff** (`HC-1`, `HC-2`) — PTC = benchmark − MAGI×applic%; $3,556.01
  at 255.6% FPL; $0 above the reinstated cliff.
- **2026 healthcare constants** (`HC-4`) — Part B $202.90, deductible $283, ACA OOP
  $10,600/$21,200, FPL $15,650 + $5,500/person.
- **Mortgage amortization core** (`MTG-1`, `MTG-2`) — `M = P·r/(1−(1+r)⁻ⁿ)` to the cent;
  zero-rate linear.
- **Investment FV core** (`INV-1`) — monthly-compounded ordinary-annuity FV to the dollar.
- **Phase-1 FIRE engine** (`FIRE-1`) — earliest-surviving-age drawdown; correct inflation/
  return consistency and SS integration. This is the reference engine.
- **4%-rule simple FIRE number with explicit rate** (`FIRE-2`) — 25× the gap.
- **Tax gross-up formula** (`FIRE-3`) — `gap/(1−rate)` correct; the "violation" is a
  simplification, not an arithmetic error.
- **Monte-Carlo seeded reproducibility** (`FIRE-4`) — deterministic block-bootstrap.

---

## 5. Regression-guard mapping

Every fix above flips its queued `it.skip` in `src/tests/calculations/rule-pinned.test.ts`
from **skipped → active**, turning a silent drift back into a loud, sourced CI failure:

| Fix # | Queued test | Asserts on fix |
|---|---|---|
| 1 | `HC-7 [BUG §2.1]` | Medigap Plan G year-0 medical OOP ≤ $300 (not $1,800) |
| 2 | `FIRE-6 [BUG §5.2]` | inflation-adjusted vs flat plans must **differ** (flag respected) |
| 3 | `HC-5 [BUG §2.5]` | applicable-% at 140.6% FPL ≈ 3.61% (not the 2.10% floor) |
| 4 | `HC-6 [BUG §2.6]` | Silver CSR OOP max = $3,500 at 175% FPL (not $8,500) |
| 5 | `MTG-3 [BUG §3.2]` | PMI = $0 once balance ≤ $320k (80% of home value) |
| 6 | `SS-6 [BUG §1.7]` | final monthly benefit is a whole-dollar integer |
| 8 | `FIRE-5 [BUG §5.3]` | default simple FIRE number = $1,200,000 (4% rule) |

Fix **#7** (investment fee input) has no queued `it.skip` today — `INV-2` is a *passing*
sensitivity test that motivates the input; add a queued bug-test asserting the net-of-fee
behavior when the input ships, then flip it on implementation.

Current suite baseline: **321 passed, 7 skipped** · lint clean · build succeeds. Each
fix should move one test out of the skipped column (target end state: **328 passed, 0
skipped**, once #7's test is authored and the #8 decision is made).

---

*End of action plan. Reconciled from CALCULATION_AUDIT.md and the authoritative
CALCULATION_VALIDATION.md; no calculator code modified.*
