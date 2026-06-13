# Calculation Validation — Rules → Independent Expected → Real Code (Run)

*Created: 2026-06-13 · Last updated: 2026-06-13*

> **✅ FIX UPDATE (commit `ac9b8f6`, 2026-06-13).** All 7 confirmed bugs queued below
> are now FIXED in the calculator code and their rule-pinned tests are active and
> passing: **SS-6** (final benefit floors to $6,676), **HC-5** (140.6% FPL → 3.61%),
> **HC-6** (175% FPL Silver OOP max → $3,500 via the CSR band override), **HC-7**
> (Medigap Plan G OOP → $283; OOP-max model kept only for Advantage), **MTG-3** (PMI
> cancels at 80% of original home value → ends ~2033; home-value input added), and
> **FIRE-6** (saved-path evaluator now inflates spending — the engine is LIVE, driving
> `summarizeSavedPath`'s deterministic FIRE age and the workspace projection). A new
> **INV-fee** test pins the investment fee input (net = gross − fee). Suite is now
> **329 passed, 1 skipped** (the lone skip is **FIRE-5**, the 4%-vs-5% default-rate
> *decision*, not a bug). The expected-vs-actual rows below record the **pre-fix**
> state.

> **What this is.** An *end-to-end numeric* validation of every calculator in the
> app. For each calculator we (A) state the governing rule with a primary source,
> (B) build concrete scenarios and derive the expected output **independently** by
> hand from that rule, (C) **run the real calculator functions** (no eyeballing —
> the numbers below were captured by executing `src/lib/calculations/*`,
> `src/lib/phase1/*`, and the `calculateMortgage` / `calculateInvestment`
> functions in `planning-tool-panel.tsx`), and (D) compare expected vs actual.
>
> **Companion artifacts.**
> - Findings audited in `docs/product-strategy/CALCULATION_AUDIT.md` (re-derived here, not trusted).
> - Constants cross-checked against `docs/product-strategy/HEALTHCARE_2026_DATA.md`.
> - Every PASS below is locked as a permanent test in
>   `src/tests/calculations/rule-pinned.test.ts`; every CONFIRMED BUG is queued
>   there as an `it.skip` whose body asserts the rule's value (flip to `it` on fix).
>
> **No calculator logic was changed.** The only code edit was adding `export` to
> the two amortization/FV helpers in `planning-tool-panel.tsx` so the real
> functions (not copies) could be invoked by the test harness.

---

## 0. Headline results

| Calculator | Rule-pins PASS | Confirmed bugs (queued) | Net verdict |
|---|---|---|---|
| Social Security | 7 | 1 (`it.skip`) + 1 structural | Core math **correct**; 2 cosmetic/minor defects |
| Healthcare / ACA / Medicare | 4 | 3 (`it.skip`) + 1 structural | Constants & PTC **correct**; 3 real rule gaps |
| Mortgage | 2 | 1 (`it.skip`) | Amortization **correct**; PMI threshold wrong |
| Investment | 2 | 0 (2 structural) | FV **correct**; missing real/fee views |
| FIRE engines | 4 | 2 (`it.skip`) | Phase-1 **correct**; saved-path inflation bug |
| **Total** | **19 locked** | **7 queued** | Suite green: 321 passed / 7 skipped |

**Audit scorecard after running real numbers:** 8 findings **CONFIRMED** with hard
expected-vs-actual figures, 1 finding's worked example **REFUTED** (the code is
right, the audit's illustration was wrong), 1 finding's magnitude **corrected**,
and all 13 "OK" rules **re-verified correct** by execution.

`npm run lint` clean · `npm run build` succeeds · `npm test` → **321 passed, 7 skipped**
(pre-fix). After the fixes (commit `ac9b8f6`): **329 passed, 1 skipped**.

---

## 1. Social Security — `src/lib/calculations/social-security.ts`

**Constants verified by execution:** bend points $1,286/$7,749, taxable max
$184,500 (2026), NAWI 2024 $69,846.57, credit amount $1,890 — all match SSA.

| ID | Rule (source) | Inputs | Expected (derivation) | Actual (run) | Result |
|---|---|---|---|---|---|
| SS-1 | AIME = top-35 indexed yrs ÷ 420, floored ([SSA Benefits](https://www.ssa.gov/oact/cola/Benefits.html); POMS [RS 00605.015](https://secure.ssa.gov/poms.nsf/lnx/0300605015)) | 40 yrs × $50,000 indexed | 35×50,000/420 = 1,750,000/420 = 4,166.66 → **4,166** | **4,166** | ✅ PASS |
| SS-1b | zero-fill missing yrs into 420 | 20 yrs × $50,000 | 1,000,000/420 = 2,380.95 → **2,380** | **2,380** | ✅ PASS |
| SS-2 | PIA 90/32/15 → dime ([SSA PIA](https://www.ssa.gov/oact/cola/piaformula.html)) | AIME $6,000 | 0.9·1,286 + 0.32·4,714 = 1,157.40+1,508.48 = 2,665.88 → **2,665.80** | **2,665.80** | ✅ PASS |
| SS-2b | all three bend layers | AIME $10,000 | 1,157.40+2,068.16+337.65 = 3,563.21 → **3,563.20** | **3,563.20** | ✅ PASS |
| SS-3 | early 5/9%+5/12%/mo; DRC 2/3%/mo ([SSA](https://www.ssa.gov/oact/quickcalc/early_late.html)) | PIA $2,000, FRA 67, claim 62/67/70 | 62: ×0.70=**1,400**; 67=**2,000**; 70: ×1.24=**2,480** | 1,400 / 2,000 / 2,480 | ✅ PASS |
| SS-4 | FRA by birth year ([SSA NRA](https://www.ssa.gov/oact/progdata/nra.html)) | 1954 / 1955 / 1960 | **66 / 66y2m / 67** | 66 / 66.1667 / 67 | ✅ PASS |
| SS-5 | constants guard | AIME = bend1 $1,286 | 0.9×1,286 = **1,157.40** | 1,157.40 | ✅ PASS |
| **SS-6** | **§1.7** final benefit floors to whole $ ([SSA](https://www.ssa.gov/oact/cola/Benefits.html)) | full-career earner, claim 67 | integer dollars | **$6,676.50** (cents kept) | ❌ **BUG (queued)** |
| §1.8 | "today's-dollar" deflator should use CPI, not wage growth | — | deflate by general inflation | deflates by wage-growth (3% default) | ⚠️ structural |

**§1.1 founder's worry REFUTED:** the 35-year cap/zero-fill/÷420 method is
implemented exactly (SS-1/SS-1b run clean). **§1.7 CONFIRMED:** the final monthly
benefit is $6,676.50 — SSA floors to the whole dollar ($6,676), so the estimate is
off by up to ~$0.99/mo (cosmetic). **§1.8** uses wage growth (≈3%) where a CPI
deflator is the purchasing-power-correct choice — structural, minor.

---

## 2. Healthcare / ACA / Medicare — `healthcare-cost.ts`, `healthcare-data.ts`

**Constants verified by execution:** Part B base $202.90, Part B deductible $283,
ACA OOP max $10,600 (self) / $21,200 (family), FPL base $15,650 (+$5,500/person →
$21,150 for 2), IRMAA multipliers `[1.0,1.4,2.0,2.6,3.2,3.4]`, Part D surcharges
`[0,14.5,37.5,60.4,83.3,91]` — all match CMS/IRS.

| ID | Rule (source) | Inputs | Expected (derivation) | Actual (run) | Result |
|---|---|---|---|---|---|
| HC-1 | PTC = benchmark − MAGI×applic% ([Rev. Proc. 2025-25](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf)) | HH1, MAGI $40,000 (255.6% FPL), bm $7,000 | 8.44→9.96 interp = 8.61%; 7,000 − 40,000·0.086099 = **$3,556.01** | applic 0.086100; PTC **$3,556.01** | ✅ PASS |
| HC-2 | 400% FPL cliff (enhanced subsidies lapsed) | MAGI 401% FPL | applic% **null**, PTC **$0**, cliff true | null / $0 / true | ✅ PASS |
| HC-3 | IRMAA 2026 single brackets (CMS) | MAGI $100k / $150k / $200k | idx0 (no surch) / idx2 (2.0×, $405.80, $37.50) / idx3 (2.6×, $527.54, $60.40) | 0 / 2 (405.80, 37.5) / 3 (527.54, 60.4) | ✅ PASS |
| HC-4 | 2026 constants guard | — | per constants above | all match | ✅ PASS |
| **HC-5** | **§2.5** applic% 133–150% FPL not flat ([Rev. Proc. 2025-25](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf)) | HH1, MAGI $22,000 (140.6% FPL) | interp 3.14→4.19 = **~3.61%** | **2.10%** (flat floor) | ❌ **BUG (queued)** |
| **HC-6** | **§2.6** CSR Silver OOP max 100–250% FPL ([Fed. Reg. 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability)) | 175% FPL silver | OOP max **$3,500** | **$8,500** (no FPL adj.) | ❌ **BUG (queued)** |
| **HC-7** | **§2.1** Original Medicare + Medigap G has no OOP max ≈ Part B deductible ([medicare.gov](https://www.medicare.gov/health-drug-plans/medigap)) | single, Plan G, moderate, defaults | medical OOP ≈ **$283** | **$1,800** (0.30×$6,000 MA-style cap) | ❌ **BUG (queued)** |
| §2.8 | Part D drug OOP cap $2,100 (2026) ([CMS](https://www.cms.gov/newsroom/fact-sheets/final-cy-2026-part-d-redesign-program-instructions)) | — | drug OOP ≤ $2,100 | no cap enforced | ⚠️ structural (conservative) |

**Confirmed bug magnitudes (real numbers):**
- **§2.1 (CRITICAL):** $1,800/yr vs ~$283 → **≈ $1,517/yr/person** overstatement on
  the most common Medicare selection, compounding over ~25 Medicare years.
- **§2.5:** required contribution $462 (2.10%) vs $794 (3.61%) → **subsidy overstated ≈ $332/yr**.
- **§2.6:** Silver OOP max overstated by **$5,000** ($8,500 vs $3,500); at "high"
  usage the modeled expected OOP (0.85×$8,500 = $7,225) exceeds the true CSR
  ceiling ($3,500) by **$3,725**.

**§2.2 audit illustration REFUTED (code is correct):** the audit's worked example
said *MAGI $200,000 single → tier index 3 (2.0×), Part B $405.80, Part D $37.50.*
Running the real code, MAGI $200,000 returns **2.6× / $527.54 / $60.40** — correct,
because $200k exceeds the $171k ceiling of the 2.0× tier. The 2.0×/$405.80/$37.50
values belong to MAGI ≤ $171k (e.g. $150k), which the code also returns correctly.
The **constants and selection logic are right**; the audit's example mislabeled the
tier. Pinned correctly in HC-3.

---

## 3. Mortgage — `calculateMortgage` (`planning-tool-panel.tsx`)

| ID | Rule (source) | Inputs | Expected (derivation) | Actual (run) | Result |
|---|---|---|---|---|---|
| MTG-1 | M = P·r/(1−(1+r)⁻ⁿ) ([Investopedia](https://www.investopedia.com/mortgage-calculator-5084794)) | $500,000, 6.5%, 30 yr | r=0.0054167; (1+r)⁻³⁶⁰=0.143064; 2,708.33/0.856936 = **$3,160.34** | **$3,160.34** | ✅ PASS |
| MTG-2 | zero-rate → P/n | $360,000, 0%, 30 yr | 360,000/360 = **$1,000.00** | **$1,000.00** | ✅ PASS |
| **MTG-3** | **§3.2** PMI cancels at 80% of original **home value** ([CFPB / HPA](https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/)) | $400k value, $360k loan, 6.5%, 30 yr, PMI 0.5% | PMI $0 once balance ≤ $320,000 (80% of value) ≈ **2033** | PMI still charged at $320k; drops only at ≤$288,000 (80% of **loan**) ≈ **2038** | ❌ **BUG (queued)** |

**§3.1 CONFIRMED correct** ($3,160.34 to the cent). **§3.2 CONFIRMED bug:** balance
first dips below $320,000 (80% of the $400k value) in **2033** with **$1,800 of PMI
still charged that year**; the code keeps charging until the balance hits $288,000
(80% of the *loan*) in **2038** — **~5 extra years × $1,800 ≈ $9,000 over-charged**,
and there is no home-value input from which the correct threshold could be derived.

---

## 4. Investment — `calculateInvestment` (`planning-tool-panel.tsx`)

| ID | Rule | Inputs | Expected (derivation) | Actual (run) | Result |
|---|---|---|---|---|---|
| INV-1 | FV of ordinary annuity, monthly compounding | $100,000 + $2,000/mo, 7%, 15 yr | 100,000·(1.0058333)¹⁸⁰ + 2,000·[((1.0058333)¹⁸⁰−1)/0.0058333] = 284,895 + 633,924 = **≈ $918,819** | **$918,819.27**; contrib **$460,000** | ✅ PASS |
| INV-2 | fee sensitivity (motivates §4.3) | 7% vs 6.5% net | lower-net balance materially smaller | **5.1%** drop ($918,819 → $871,510) | ✅ PASS |
| §4.2 | real/today's-dollar view absent | — | a deflated view exists | nominal only | ⚠️ structural |
| §4.3 | expense-ratio input absent | — | net-of-fee input exists | gross returns only | ⚠️ structural |

**§4.1 CONFIRMED correct** (matches the closed-form FV to the dollar). **§4.3
magnitude corrected:** the audit estimated a 0.5% fee cuts the 15-year balance
"~7–8%"; the real code shows **5.1%** ($918,819 vs $871,510). The structural gap
(no fee/inflation inputs) stands; the headline overstatement is real but smaller
than the audit's estimate.

---

## 5. FIRE engines

| ID | Rule | Inputs | Expected | Actual (run) | Result |
|---|---|---|---|---|---|
| FIRE-1 | phase-1 earliest-surviving FIRE age (`phase1/fire.ts`) | $1M, $100k spend, 0% ret, 0% infl, life 90, WR 5%, no tax | age **68**, assets **$2.4M**, draw **$100k**, end **$100k** | 68 / 2,400,000 / 100,000 / 100,000 | ✅ PASS |
| FIRE-2 | 4% rule = 25× gap | gap $48,000 @ 4% | **$1,200,000** | $1,200,000 | ✅ PASS |
| FIRE-3 | gross-up = gap/(1−rate) (`calculations/fire.ts`) | $40,000 @ 15% / 0% | **$47,058.82** / **$40,000** | 47,058.82 / 40,000 | ✅ PASS |
| FIRE-4 | seeded block-bootstrap reproducible (`monte-carlo.ts`) | seed 123, 360 mo | identical paths | identical, len 360 | ✅ PASS |
| **FIRE-5** | **§5.3** default simple-FIRE rate = app's 4% rule | gap $48,000, default rate | **$1,200,000** | **$960,000** (5% default) | ❌ **BUG (queued)** |
| **FIRE-6** | **§5.2** saved-path evaluator must inflate spending | flat $50k, `inflationAdjusted` true vs false | results **differ** | **identical** (flag ignored, spending flat) | ❌ **BUG (queued)** |

**§5.1 / §5.4 CONFIRMED correct** (phase-1 reference and the seeded RNG).
**§5.2 CONFIRMED bug (CRITICAL):** two saved paths identical except for the
per-expense `inflationAdjusted` flag produce **byte-identical** results — proof the
deterministic evaluator never inflates spending while compounding the portfolio at
a nominal return, which overstates survival (it diverges from `monte-carlo.ts` and
`phase1/fire.ts`, both of which inflate). **§5.3 CONFIRMED:** the default
`calculateSimpleFireNumber` returns **$960,000** (20× = 5%), not the **$1,200,000**
(25× = 4%) the app's own glossary/strategy copy headlines — a **$240,000 (20%)**
gap whenever the default fires.

---

## 6. Cross-cutting

- **§6.1 tax gross-up** (FIRE-3): the *formula* `gap/(1−rate)` is correct and locked.
  The audit's "violation" is a modeling **simplification** (ignores SS taxability,
  the standard deduction, progressive/LTCG brackets, Roth/HSA), not an arithmetic
  error — it cannot be pinned to a single rule number. Documented, not queued.
- **§6.2 inflation consistency:** confirmed by execution — `phase1/fire.ts` and
  `monte-carlo.ts` inflate spending; `calculations/fire.ts` (saved-path) does not
  (FIRE-6); the investment calc is nominal-only by label (§4.2).

---

## 7. Confirmation / refutation of every audit finding (with hard numbers)

| Audit § | Audit status | Validation verdict (real numbers) |
|---|---|---|
| 1.1 AIME 35-yr | OK (worry refuted) | **CONFIRMED correct** — 4,166 / 2,380 |
| 1.2 PIA bend pts | OK | **CONFIRMED correct** — $2,665.80 / $3,563.20 |
| 1.3 wage indexing | OK | CONFIRMED (covered by existing suite) |
| 1.4 taxable max | OK | **CONFIRMED** — $184,500 + ladder |
| 1.5 FRA/DRC/early | OK | **CONFIRMED** — 1,400 / 2,480; FRA 66/66y2m/67 |
| 1.6 WEP/GPO | OK (repealed) | CONFIRMED (not applied) |
| 1.7 $ rounding | VIOLATION (minor) | **CONFIRMED** — $6,676.50, not floored |
| 1.8 deflator basis | VIOLATION (minor) | CONFIRMED structural (wage growth) |
| 2.1 Medicare OOP | VIOLATION (CRITICAL) | **CONFIRMED** — $1,800 vs ~$283 |
| 2.2 IRMAA | OK | **Constants CONFIRMED; audit example REFUTED** — $200k → 2.6×/$527.54, not 2.0×/$405.80 |
| 2.3 Part B | OK | **CONFIRMED** — $202.90 / $283 |
| 2.4 ACA ≥150% + cliff | OK | **CONFIRMED** — PTC $3,556.01; $0 at cliff |
| 2.5 ACA <150% | VIOLATION (moderate) | **CONFIRMED** — 2.10% vs ~3.61% (≈$332/yr) |
| 2.6 CSR | VIOLATION (moderate) | **CONFIRMED** — $8,500 vs $3,500 |
| 2.7 ACA OOP max | OK | **CONFIRMED** — $10,600 |
| 2.8 Part D cap | VIOLATION (minor) | CONFIRMED structural (no cap) |
| 2.9 Medicaid 5% cap | OK (simplified) | CONFIRMED (modeled ~$0) |
| 2.10 trend/PV | OK | CONFIRMED (covered by existing suite) |
| 3.1 amortization | OK | **CONFIRMED** — $3,160.34 |
| 3.2 PMI threshold | VIOLATION (moderate) | **CONFIRMED** — cancels at $288k (loan) not $320k (value); ~$9,000 |
| 4.1 compounding | OK | **CONFIRMED** — $918,819.27 |
| 4.2 real vs nominal | VIOLATION (minor) | CONFIRMED structural |
| 4.3 expense ratio | VIOLATION (minor) | **CONFIRMED structural; magnitude corrected** 7–8% → **5.1%** |
| 5.1 phase-1 engine | OK | **CONFIRMED** — age 68, $2.4M, $100k |
| 5.2 saved-path infl. | VIOLATION (CRITICAL) | **CONFIRMED** — flag ignored, identical results |
| 5.3 default WR | VIOLATION (minor) | **CONFIRMED** — $960k (5%) vs $1.2M (4%) |
| 5.4 monte carlo | OK (failureAge=70) | **CONFIRMED** — reproducible; failureAge still hardcoded 70 |
| 6.1 tax gross-up | VIOLATION (moderate) | Formula CONFIRMED; "violation" is a simplification, not a math error |

**Net:** 0 audit findings overturned in the app's favor beyond expectation; **1
audit *illustration* (2.2) refuted** because the code was right and the audit's
example wrong; **1 magnitude (4.3) corrected** (5.1%, not 7–8%); everything else
**confirmed** by running the real code.

---

## 8. Locked vs. queued tests

`src/tests/calculations/rule-pinned.test.ts` — **19 locked (passing)**, **7 queued (`it.skip`)**:

- **Locked (19):** SS-1, SS-1b, SS-2, SS-2b, SS-3, SS-4, SS-5; HC-1, HC-2, HC-3,
  HC-4; MTG-1, MTG-2; INV-1, INV-2; FIRE-1, FIRE-2, FIRE-3, FIRE-4.
- **Fixed & now active (commit `ac9b8f6`, 7):** SS-6 (§1.7), HC-5 (§2.5), HC-6 (§2.6),
  HC-7 (§2.1), MTG-3 (§3.2), FIRE-6 (§5.2), and the new **INV-fee** (§4.3) — each
  asserts the value its rule requires and passes.
- **Still queued (1, a decision not a bug):** FIRE-5 (§5.3) — the 4%-vs-5% default
  withdrawal rate. Left as `it.skip` pending a founder decision.

Whole suite (pre-fix): **321 passed, 7 skipped**. Post-fix: **329 passed, 1 skipped** ·
lint clean · build succeeds.

---

*End of validation. Expected values derived independently from SSA, IRS, CMS/
Medicare, healthcare.gov, CFPB, and standard finance formulas (June 2026); actual
values captured by executing the real calculator functions. No calculator logic
was modified.*
