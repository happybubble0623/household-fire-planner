# Pre-65 Health-Insurance Scenario View — Design Spec

*Created: 2026-06-12 · Last updated: 2026-06-12*

> **Status: PLAN ONLY.** This document specifies a redesigned, navigable, transparent
> pre-65 health-insurance scenario view for the healthcare calculator. **No calculator
> code is changed by this document.** It must be reviewed and approved by the founder
> **before any build.** Its explicit purpose is to prevent the mistakes we made before:
> duplicate controls, hidden assumptions, headline numbers that don't reconcile with the
> table, and jargon.
>
> **Sources.** All 2026 figures are taken verbatim from
> [`HEALTHCARE_2026_DATA.md`](./HEALTHCARE_2026_DATA.md) (the verified reference) and are
> cited inline as **[DATA §n]**. Code references point to the three existing files:
> `src/lib/calculations/healthcare-cost.ts` (engine),
> `src/lib/calculations/healthcare-data.ts` (constants), and
> `src/components/planning/healthcare-cost-panel.tsx` (UI).

---

## A. What exists today vs. what changes (file / function level)

### A.1 What already exists (reuse — do not rebuild)

| Concern | Where it lives | Status for this spec |
|---|---|---|
| FPL by household size | `healthcare-data.ts` → `FPL_2025_48_STATES` (`base 15_650`, `perAdditionalPerson 5_500`), `federalPovertyLevel(size)` | **Reuse as-is.** Matches **[DATA §2]** exactly. |
| 2026 contribution-% schedule (reverted) | `healthcare-data.ts` → `ACA_APPLICABLE_PERCENT_NODES_2026`, `ACA_APPLICABLE_PERCENT_FLOOR_2026 = 0.021`, `ACA_SUBSIDY_CLIFF_FPL = 4.0` | **Reuse as-is.** Matches **[DATA §3a]**. |
| Applicable-% interpolation + cliff | `healthcare-cost.ts` → `acaApplicablePercent(incomePctFpl)` (returns `null` at/above cliff) | **Reuse as-is.** |
| PTC / subsidy math | `healthcare-cost.ts` → `estimatePremiumTaxCredit(...)` → `{ incomePctFpl, applicablePercent, requiredContribution, premiumTaxCredit, aboveSubsidyCliff }` | **Reuse as-is.** Matches **[DATA §3b]**. |
| Benchmark (SLCSP) estimate from age + area | `healthcare-data.ts` → `NATIONAL_BENCHMARK_SILVER_BASE_21 = 390`, `ACA_AGE_CURVE`, `acaAgeCurveFactor`, `REGION_MULTIPLIERS`; `healthcare-cost.ts` → `estimateBenchmarkPremium(...)` | **Reuse**, with the override decision in §B / §I. |
| Metal-tier plan economics | `healthcare-data.ts` → `METAL_TIER_PRESETS`; `healthcare-cost.ts` → `applyMetalTierPreset(...)` | **Reuse as-is.** |
| Standard self-only OOP max | `healthcare-data.ts` → `ACA_OOP_MAX_2026_SELF_ONLY = 10_600` | **Reuse**, extend (see A.2). |
| Medicaid pre-65 (~free) | `healthcare-cost.ts` → `medicaidEligiblePre65 = incomePctFpl < MEDICAID_FPL_THRESHOLD (1.38)`; premium/oop forced to 0 in the ACA branch | **Reuse logic.** Matches **[DATA §5]**. |
| Medicare era (Part B, IRMAA, Medigap/Advantage, Part D) | `healthcare-data.ts` → `PART_B_BASE_PREMIUM_2026 = 202.9`, `IRMAA_TIERS_2026`; `healthcare-cost.ts` → `selectIrmaaTier`, Medicare branch of `estimateHealthcareCosts` | **Reuse as-is.** This is Scenario 4. |
| Couple scaling (×people) | `estimateHealthcareCosts`: `people = household === "couple" ? 2 : 1`; FPL uses `householdSize`; Medicare premiums × `people` | **Reuse as-is.** |
| Present-value + reconciling deflators | `estimateHealthcareCosts`: each row carries `realDeflator` + `presentValueDeflator`; engine returns `presentValueTotal`, `nominalLifetimeTotal`, `todayDollarsLifetimeTotal` | **Reuse as-is** — this is the backbone of the reconciliation guarantees (§E). |
| Today's/future toggle, year-by-year table, reconciliation footer | `healthcare-cost-panel.tsx` (`displayMode`, `displayRows`, `displayGrossTotal/NetTotal/HsaUsedTotal`) | **Reuse + restructure** (single toggle, see §F). |

### A.2 What changes / is new

| # | Change | File / function | Type |
|---|---|---|---|
| N1 | **CSR-reduced OOP maxima** by FPL band (94/87/73% AV). Today the OOP max is a single value; there is **no CSR sub-band logic anywhere in the code.** | NEW constant `CSR_OOP_MAX_2026` + `STANDARD_OOP_MAX_2026` in `healthcare-data.ts`; NEW `acaOopMaxForBand(...)` in `healthcare-cost.ts` | **New** |
| N2 | **Standard family OOP max** as a named constant ($21,200). Today only `ACA_OOP_MAX_2026_SELF_ONLY` exists; family is implied via metal-tier per-person doubling. | Extend `healthcare-data.ts` (add `family: 21_200`) | **New constant** |
| N3 | **Scenario classifier** mapping `incomePctFpl` → one of `medicaid | csr_subsidized | subsidized | cliff` (pre-65), plus `medicare` (65+). Centralizes the band logic that is today scattered across booleans. | NEW pure `classifyPre65Scenario(incomePctFpl)` in `healthcare-cost.ts` | **New (pure, derived)** |
| N4 | **Scenario navigation view** — income input + income→annual-cost strip with "you are here," a slidable income axis crossing Medicaid → subsidized → cliff, an explicit 400% cliff jump, and a clear at-65 Medicare transition. | NEW `Pre65ScenarioView` sub-component in `healthcare-cost-panel.tsx` (or a sibling file) | **New UI** |
| N5 | **Per-scenario summary cards** (eligibility verdict, net premium, OOP max, total annual exposure, CSR badge) reusing the engine outputs. | NEW presentational components | **New UI** |
| N6 | **Instant scenario/basis switching** — remove scenario exploration from behind the `useCalculateGate` Recalculate gate (basis toggle is already instant; scenario switching must match). | `healthcare-cost-panel.tsx` wiring | **Behavior change (UI only)** |
| N7 | **On-screen assumptions ledger** — every rate/threshold/default visible with source + "2026". | NEW presentational block | **New UI** |

> **Net engine surface area added:** two constants (N1/N2), two pure functions
> (`acaOopMaxForBand`, `classifyPre65Scenario`). Everything else is presentation that
> consumes values the engine already returns (`incomePctFpl`, `applicablePercent`,
> `aboveSubsidyCliff`, `firstYearSubsidy`, `medicaidEligiblePre65`, `presentValueTotal`,
> `nominalLifetimeTotal`, the per-row deflators).

---

## B. Inputs required and where they come from

| Input | Source today | Default | Notes |
|---|---|---|---|
| **Household** (single / couple) | `healthcare-cost-panel.tsx` `household` state → engine `people` | single | Drives FPL size **and** ×people scaling. |
| **Annual MAGI** (today's $) | `annualMagi` state → `estimatePremiumTaxCredit` | $60,000 (example) | The income that the scenario navigation slides over. |
| **Age(s)** | `currentAge` / `fireAge` → `acaPhaseStartAge = max(currentAge, min(fireAge, 64))` | 50 / 55 | Age-rates the benchmark via `acaAgeCurveFactor`. Single age track for couples (documented limitation, panel `help`). |
| **Medicare age** | `medicareAge` (default 65) | 65 | The at-65 transition point (Scenario 4). |
| **Plan-to age** | `planToAge` | 90 | Projection horizon. |
| **Household size for FPL** | derived = `people` | — | 1 or 2 (matches **[DATA §2]** rows 1 & 2). |

### B.1 The benchmark-premium problem (no ZIP-level data)

We have **no ZIP / rating-area data**, and **[DATA §6.4]** is explicit that premiums vary
"enormously by state, rating area, age and tobacco use." The current code already solves
this with a two-mode design that this spec **keeps and surfaces, not replaces**:

- **Default = internal estimate.** `estimateBenchmarkPremium` computes
  `NATIONAL_BENCHMARK_SILVER_BASE_21 (390) × acaAgeCurveFactor(age) × REGION_MULTIPLIERS[region]`,
  per covered adult, summed. The base-at-21 of **$390/mo** is back-derived from the
  KFF/CMS 2025 national average benchmark of ~$497/mo for a 40-year-old
  (`497 / 1.278 ≈ 390`) — documented in `healthcare-data.ts` comments. A 55-year-old at
  "average" area → `390 × 2.230 ≈ $869/mo`; a KFF-style national-average lens gives the
  same order of magnitude.
- **Override = exact mode.** The panel already exposes a manual
  `benchmarkSlcspMonthly` field ("Use my exact plan from healthcare.gov"). This is the
  user override.

**Proposed approach for this view (for founder sign-off — see §I):**

1. **Keep the national-average estimate as the default**, with the **area cost band**
   (low −22% / average / high +25%, from `REGION_MULTIPLIERS`) as the only geographic
   knob, **and keep the exact-premium override field.**
2. **Show the estimated benchmark on-screen with its provenance** ("Benchmark Silver
   ≈ $869/mo — national average at age 55, average area, CMS age curve · 2026") so the
   assumption is never hidden (§E criterion 2).
3. **Do NOT invent a premium number.** Every premium shown is either the
   transparently-derived estimate above or the user's own override. We never hardcode a
   single national premium into the headline without showing how it was built.

> Open question for the founder (§I-1): do we add an optional **state-average benchmark
> table** (50 rows) as a middle option between "national average" and "exact"? The data
> doc does not give us a state table, so this would require a new sourced dataset and is
> **out of scope for the first build** unless approved.

---

## C. Eligibility decision tree (income → FPL% → scenario)

```
incomePctFpl = annualMagi / federalPovertyLevel(householdSize)      // FPL = 2025 guidelines, per [DATA §2]

if age >= medicareAge (65):                       → SCENARIO 4: Medicare        [DATA §1, IRMAA]
else (pre-65):
    if incomePctFpl < 1.38   (< 138% FPL):        → SCENARIO 1: Medicaid        [DATA §5]
    elif incomePctFpl < 4.00 (138%–<400% FPL):    → SCENARIO 2: Subsidized ACA  [DATA §3]
         ├─ ≤ 1.50  (≤150%)      → CSR 94% sub-band
         ├─ >1.50 ≤ 2.00 (151–200%) → CSR 87% sub-band
         ├─ >2.00 ≤ 2.50 (201–250%) → CSR 73% sub-band
         └─ >2.50 < 4.00 (251–399%) → no CSR, standard OOP max
    else (>= 4.00, ≥ 400% FPL):                   → SCENARIO 3: Full-price / cliff  [DATA §3, §0]
```

### C.1 Exact 2026 dollar thresholds (from [DATA §2], households 1 & 2)

| Band boundary | % FPL | **HH 1** | **HH 2** | Used for |
|---|---|---|---|---|
| FPL (100%) | 100% | **$15,650** | **$21,150** | Base; coverage-gap floor (non-expansion) |
| Medicaid ceiling | **138%** | **$21,597** | **$29,187** | Medicaid ↔ Subsidized boundary |
| CSR 94% ceiling | 150% | **$23,475** | **$31,725** | CSR 94% ↔ CSR 87% |
| CSR 87% ceiling | 200% | **$31,300** | **$42,300** | CSR 87% ↔ CSR 73% |
| CSR 73% ceiling | 250% | **$39,125** | **$52,875** | CSR ends → standard OOP |
| 300% node | 300% | $46,950 | $63,450 | Contribution-% top (9.96%) |
| **Subsidy cliff** | **400%** | **$62,600** | **$84,600** | Subsidized ↔ Full-price/cliff |

All figures are 2025 HHS guidelines governing **2026** coverage **[DATA §2]**. Base
$15,650 + $5,500/additional person — matches `FPL_2025_48_STATES`.

---

## D. Per-scenario calculation logic (2026 numbers + worked examples)

For all pre-65 scenarios the engine already computes the year-0 (today's-$) components,
inflates them to nominal, and the view applies the reconciling deflators. The spec below
states **what each scenario sets for premium, subsidy, and OOP max**, then shows worked
examples for a **single** and a **couple** at one income in each band. (Premiums use a
55-year-old at "average" area: `390 × 2.230 ≈ $869/mo` per adult; benchmark = Silver, so
in these examples chosen-plan = benchmark.)

### Scenario 1 — Medicaid (< 138% FPL) · **[DATA §5]**

- **Premium = $0.** (`medicaidEligiblePre65` branch already sets `premium0 = 0`.)
- **OOP modeled = $0**, justified by the **5%-of-income aggregate cap** (`min(actual, 5% × income)`, effectively ~$0). Engine already sets `oop0 = 0`.
- **No ACA OOP max applies** (Medicaid is not subject to $10,600/$21,200) — a label, not a number.
- **Caveat to render:** Medicaid expansion (138% adult ceiling) applies in **41 states + DC**; **10 non-expansion states** have a **coverage gap** below 100% FPL (neither Medicaid nor PTC) **[DATA §6.1]**.

| Worked | FPL base | Income @ 120% | Premium | OOP max basis | Modeled annual exposure |
|---|---|---|---|---|---|
| **Single** | $15,650 | $18,780 | $0 | 5% cap = $939 | **≈ $0** |
| **Couple** | $21,150 | $25,380 | $0 | 5% cap = $1,269 | **≈ $0** |

### Scenario 2 — Subsidized Obamacare (138%–<400% FPL) · **[DATA §3, §4]**

- **Benchmark premium** from estimate/override (§B.1).
- **Applicable %** = `acaApplicablePercent(incomePctFpl)` (interpolated; 2.10% floor below 150%, 9.96% at 300–400%) **[DATA §3a]**.
- **Expected contribution** = `MAGI × applicable%`.
- **PTC** = `max(0, benchmarkAnnual − expectedContribution)` **[DATA §3b]**.
- **Net premium** = `max(0, chosenPlanAnnual − PTC)`.
- **OOP max = CSR-reduced** by sub-band (NEW `acaOopMaxForBand`):

  | Sub-band | FPL | CSR AV | OOP max self / family · 2026 | [DATA §4] |
  |---|---|---|---|---|
  | ≤150% | CSR 94% | 94% | **$3,500 / $7,000** | ✓ |
  | >150–200% | CSR 87% | 87% | **$3,500 / $7,000** | ✓ |
  | >200–250% | CSR 73% | 73% | **$8,450 / $16,900** | ✓ |
  | >250–<400% | none | 70% | **$10,600 / $21,200** | ✓ §4b |

| Worked @ 200% FPL, age 55 | Benchmark/yr | Expected contrib (6.60%) | PTC | Net premium/yr | CSR OOP max | Worst-case exposure |
|---|---|---|---|---|---|---|
| **Single** (inc $31,300) | $10,436 | $2,066 | $8,370 | **$2,066** (≈$172/mo) | CSR 87% → **$3,500** | $5,566 |
| **Couple** (inc $42,300) | $20,873 | $2,792 | $18,081 | **$2,792** (≈$233/mo) | CSR 87% → **$7,000** | $9,792 |

> "Worst-case exposure" = `net premium + OOP max`. A "moderate-usage" mid estimate uses
> `OOP_USAGE_PRESETS.moderate (0.30) × OOP max` (single: $2,066 + $1,050 = **$3,116**).

### Scenario 3 — Full-price ACA / cliff (≥ 400% FPL) · **[DATA §0, §3, §4b]**

- **PTC = 0** (`acaApplicablePercent` returns `null` → `aboveSubsidyCliff = true`).
- **Net premium = full chosen-plan premium** (no subsidy).
- **OOP max = standard 2026**: **$10,600 self / $21,200 family** **[DATA §4b]**.
- **Render the cliff explicitly** as a discontinuity (§F): the marginal dollar above 400% removes the entire PTC.

| Worked @ 450% FPL, age 55 | Income | Full premium/yr | PTC | Net premium/yr | Standard OOP max | Worst-case exposure |
|---|---|---|---|---|---|---|
| **Single** | $70,425 | $10,436 | $0 | **$10,436** | **$10,600** | $21,036 |
| **Couple** | $95,175 | $20,873 | $0 | **$20,873** | **$21,200** | $42,073 |

> Cliff contrast (single, 55): at **399% FPL** PTC ≈ $10,436 − ($62,443 × 9.96%) ≈ **$4,217**
> → net ≈ $6,219/yr; at **400%+** net jumps to **$10,436/yr**. The view must make this
> ~$4.2k/yr jump visible, not buried.

### Scenario 4 — Medicare (65+) · existing modeling, unchanged

At `age >= medicareAge`, the engine switches `phase` to `medicare`:
`premium = Part B ($202.90/mo × IRMAA multiplier) + coverage (Medigap+Part D | Advantage) + Part D IRMAA surcharge`, all **× people**; OOP via usage preset; IRMAA tier from
`selectIrmaaTier(medicareMagi ?? annualMagi, household)` **[DATA §1]**. Low-income 65+
(`< 135% FPL`) → MSP + Extra Help → ~free. **No change**; the view simply labels the at-65
boundary as the Medicare transition.

### D.1 How scenarios feed the projection and the PV headline

Unchanged data flow — the scenario only sets `premium0 / subsidy0 / oop0` per year inside
the existing loop:

```
grossCost(year)        = premium + outOfPocket + travelPremium          (nominal)
presentValueGross      = grossCost × presentValueDeflator(age)
presentValueTotal      = Σ presentValueGross           ← today's-$ headline
nominalLifetimeTotal   = Σ grossCost                   ← future-$ headline
```

The CSR change (N1) only changes which `acaOutOfPocketMax` feeds `expectedOutOfPocket`;
the Medicaid/cliff branches already exist. Nothing about the deflator/headline math
changes — so the reconciliation guarantees in §E continue to hold by construction.

---

## E. Anti-mistake guarantees (acceptance criteria the build MUST meet)

These are **testable** acceptance criteria. The build is not done until each passes.

**AC-1 — One control per setting; no duplicate toggles.**
Each of {household, MAGI, age, area band, plan tier, OOP usage, dollar basis, scenario
focus} has **exactly one** input in the DOM. Specifically: the dollar-basis toggle exists
**once** (not repeated per card); the scenario the user "is in" is **derived from MAGI**,
not set by a second redundant control. Exploring other scenarios is a **view focus**, not
a duplicate income control. *(Test: query the rendered tree; assert single instance of
each labelled control.)*

**AC-2 — Every rate / threshold / default visible on-screen with its source + "2026".**
The assumptions ledger (N7) shows, each with a one-line source and the year "2026": FPL
base/per-person; 138% & 400% dollar thresholds for the active household size; the
applicable-% used; the benchmark premium **and how it was derived**; the CSR OOP max for
the active band; the standard OOP max; the discount rate; inflation rates. Nothing that
drives a number is off-screen.

**AC-3 — Every headline reconciles with the rows and the average line, in BOTH bases.**
The following equalities must hold (to rounding, ≤ $1 per row / ≤ $5 aggregate):

| Basis | Equality that MUST hold |
|---|---|
| Today's $ | `heroValue == Σ(row.grossCost × row.presentValueDeflator) == presentValueTotal` |
| Future $ | `heroValue == Σ(row.grossCost) == nominalLifetimeTotal` |
| Either | `Σ displayRow.netPortfolioCost + Σ displayRow.hsaDraw == Σ displayRow.grossCost == heroValue` |
| Either | `acaPhaseValue + medicarePhaseValue == heroValue` (both cards on the hero's basis) |
| Either | `avgPerYear == heroValue / totalYears` (the "≈ $X/yr" line is derived from the *displayed* headline, never from a different basis) |
| Per row | `grossCost == premium + outOfPocket + travelPremium`; `netPortfolioCost == grossCost − hsaDraw` |

> **Watch-out (regression we must not reintroduce):** the panel's "≈ $X/yr" line must use
> `heroValue / totalYears` (same basis as the headline), **not**
> `result.averageAnnualTodayDollars` (which is undiscounted real and will *not* reconcile
> with a present-value headline). Lock this in a test (§H T-7).

**AC-4 — Plain language; no "nominal."** User-facing copy never contains the words
"nominal," "MAGI" without expansion on first use, "SLCSP" without "benchmark Silver," or
"actuarial value" without "plan richness." "Future (inflated) dollars" replaces "nominal."
*(Test: snapshot the rendered text; assert the banned-words list is absent — §H T-8.)*

**AC-5 — Scenario / basis switches are instant (no Recalculate gate).** Changing the
dollar basis **or** the focused scenario re-renders synchronously from already-committed
state — it does **not** set `gate.stale` and does **not** require pressing Recalculate.
(The basis toggle is already a pure view change; the scenario focus must match.) Only the
heavy numeric inputs (MAGI, ages, premiums) may sit behind the existing gate. *(Test: flip
basis and scenario; assert no stale flag and DOM updates in the same tick — §H T-9.)*

**AC-6 — Couples scale correctly; low income reduces cost.**
- Couple total ≥ single total at the same MAGI for the premium/OOP components that scale ×2 (benchmark summed over 2 adults; OOP max family ≈ 2× self). *(Test T-5.)*
- Cost is **monotonic-by-band in the right direction**: Medicaid (≈$0) < a typical subsidized band < the cliff, at fixed age/household. Specifically a household at 120% FPL must not be shown costing **more** than the same household at 300% FPL. *(Test T-6 — guards the "low-income shown as expensive" bug.)*

---

## F. UI / navigation design

Layout keeps the existing two-column shell (inputs left, results right) and **adds a
scenario navigation strip** at the top of the results column. One basis toggle, one table.

### F.1 Components (top → bottom of results column)

1. **`IncomeScenarioStrip`** (NEW, the centerpiece).
   - A horizontal **income axis** (slider + numeric MAGI echo) spanning roughly
     `0 → 500% FPL` for the active household size, with **fixed markers** at **138%**,
     **250%** (CSR end), and **400%** (cliff), each labeled with its **dollar value for the
     current household** (e.g. single: $21,597 / $39,125 / $62,600).
   - Four **zones** colored by scenario: Medicaid · Subsidized (CSR shaded sub-zones ≤250%)
     · Full-price/cliff. A **"You are here ▲"** pin sits at the entered MAGI.
   - The **400% boundary is drawn as a step/jump** in the annual-cost curve overlaid on the
     axis (not a smooth ramp) — the cliff is visually a discontinuity, with a callout
     "+$X,XXX/yr at 400% FPL."
   - Dragging the pin updates MAGI **instantly** (AC-5) and re-points the active scenario.
     Dragging is the same single income control as the left-column MAGI field — they are
     **bound to one state**, not two inputs (AC-1).

2. **`ScenarioCard` ×(focused scenario)** (NEW). Shows for the focused scenario:
   eligibility verdict ("At 200% FPL, expansion state → **Subsidized Silver, CSR 87%**"),
   **net premium/mo & /yr**, **OOP max** (with CSR badge 94/87/73 when applicable),
   **worst-case annual exposure** and a **moderate-usage** mid estimate. The user can
   **focus** any of the four scenarios via a segmented control to see "what if my income
   were lower/higher" — this is a **view focus** that does not alter the entered MAGI
   (so the headline below still reflects the real plan).

3. **`AtMedicareTransition`** (NEW, small). A labeled divider on the strip and in the table
   marking **age 65 → Medicare** ("Marketplace coverage ends; Medicare begins at 65").

4. **Hero headline** (reuse existing). Present value in today's $ by default;
   one **basis toggle** (Today's / Future) — the *only* one on the page (AC-1). The
   "≈ $X/yr over ~N years" line derives from the displayed headline (AC-3).

5. **Phase KPI cards** (reuse): "Before 65 · ACA gap" and "Medicare years · 65+", both on
   the hero's basis so they sum to it (AC-3).

6. **Assumptions ledger** (NEW, N7): the on-screen source-of-truth table (AC-2).

7. **Year-by-year breakdown** (reuse existing `<details>` table) with its reconciliation
   footer. Bars/rows follow the single basis toggle.

### F.2 How the existing toggle + table fit

- **One toggle** drives the hero, the phase cards, the chart, **and** the table
  simultaneously via `displayRows` (already implemented). No per-section bases.
- The table's existing footer (`net + HSA used = gross = headline`) is the visible proof of
  AC-3 and stays.

### F.3 Navigation summary (one sentence)

*Enter income once → the strip shows where you land among Medicaid / subsidized / cliff →
slide income to explore bands and see the 400% jump → scroll to the reconciling headline,
phase split, assumptions ledger, and year-by-year table, all on one basis toggle, with the
at-65 Medicare transition marked throughout.*

---

## G. Edge cases & handling

| # | Edge case | Handling |
|---|---|---|
| G1 | **Single vs couple** | `householdSize = people` drives FPL; benchmark summed over `people` adults; OOP max uses self vs family column; Medicare ×people. (AC-6.) |
| G2 | **Exactly 138% FPL** | `incomePctFpl < 1.38` is **strict** → at exactly 138% the household is **Subsidized**, not Medicaid (applicable % ≈ 3.45% per [DATA §3a]). Document on the boundary marker. |
| G3 | **Exactly 150% / 200% / 250%** | CSR sub-bands use `≤` at the upper edge: 150%→CSR 94%, 200%→CSR 87%, 250%→CSR 73% (matches [DATA §4] "100–150", ">150–200", ">200–250"). `acaOopMaxForBand` must use `<=` boundaries to match. |
| G4 | **Exactly 400% FPL** | **Flag for founder (§I-3).** Current `acaApplicablePercent` returns `null` for `>= 4.0`, so **exactly 400.0% gets $0 PTC** today. Statute treats the cliff as *above* 400%. Decision: keep `>=` (conservative, matches code) or switch to `>` at exactly 400%. The view must label whichever we choose; do **not** leave it ambiguous. |
| G5 | **Expansion vs non-expansion state** | Default assumes **expansion**. If the user indicates a non-expansion state (§I-2), render the **coverage-gap** warning below 100% FPL (neither Medicaid nor PTC) per [DATA §6.1]. Until a state input exists, show the caveat text on the Medicaid zone. |
| G6 | **Very high income** | Above the top IRMAA/FPL bands the engine clamps to the last IRMAA tier and `aboveSubsidyCliff = true`; pre-65 net premium = full price. No crash; cliff messaging applies. |
| G7 | **At-65 transition mid-projection** | Already handled row-by-row (`phase = age < medicareAge ? "aca" : "medicare"`). The view marks the boundary (F.3); ACA scenario logic applies only to pre-65 rows. |
| G8 | **Medicaid no-OOP-max rule** | Medicaid rows show **"no ACA OOP max — 5%-of-income cap applies (~$0)"**, never the $10,600/$21,200 figure. Modeled `oop0 = 0`. [DATA §5.] |
| G9 | **FIRE age ≥ Medicare age** | ACA phase is skipped (engine `startAge`/loop); scenario strip shows "no pre-65 gap — Medicare from retirement." |
| G10 | **Alaska/Hawaii** | Known limitation (higher FPL not modeled) — surfaced as a one-line disclaimer in the ledger, per `healthcare-data.ts` comment. |

---

## H. Test plan (unit tests to add)

All in the existing calc test suite (e.g. `healthcare-cost.test.ts`), plus 2 render
assertions for the UI guarantees.

| ID | Test | Asserts |
|---|---|---|
| T-1 | **Medicaid band** — single & couple at 120% FPL | `classifyPre65Scenario` = `medicaid`; premium 0; oop 0; `medicaidEligiblePre65 = true`. |
| T-2 | **Subsidized + CSR 94%** — 140% & 150% FPL | scenario `csr_subsidized`; `acaOopMaxForBand` = $3,500 self / $7,000 family; PTC > 0. |
| T-3 | **Subsidized + CSR 87% / 73%** — 200% & 250% FPL | OOP max $3,500/$7,000 (87%) then $8,450/$16,900 (73%); applicable % = 6.60% then 8.44%. |
| T-4 | **Cliff** — 401% & 450% FPL | scenario `cliff`; `aboveSubsidyCliff = true`; PTC 0; OOP max $10,600/$21,200. |
| T-5 | **Couples scale** — same MAGI, single vs couple | couple benchmark ≈ 2× single; couple family OOP max ≈ 2× self; FPL uses 2-person base. |
| T-6 | **Low-income-is-cheaper (monotonic)** | gross at 120% FPL < gross at 300% FPL < gross at 450% FPL (fixed age/household). Guards the inversion bug. |
| T-7 | **Reconciliation equalities (AC-3)** | today's: `Σ grossCost×pvDeflator == presentValueTotal`; future: `Σ grossCost == nominalLifetimeTotal`; `net + hsaUsed == gross == hero`; `acaPhaseValue + medicarePhaseValue == hero`; `avgPerYear == hero/years`. |
| T-8 | **No banned words (AC-4)** | rendered panel text excludes "nominal"; "MAGI"/"SLCSP"/"actuarial value" only appear expanded. |
| T-9 | **Instant switch (AC-5)** | flipping basis and scenario focus does not set `gate.stale`; DOM updates without Recalculate. |
| T-10 | **Boundary values (AC, G2–G4)** | exactly 138% → subsidized; exactly 150/200/250% → correct CSR tier; exactly 400% → matches the §I-3 decision (lock once decided). |

---

## I. Open decisions for the founder (resolve BEFORE build)

1. **Benchmark-premium source / override (§B.1).** Ship with **national-average estimate +
   area band + exact override** only? Or invest in a **state-average benchmark table**
   (50 rows, new sourced dataset — the data doc gives us no state table)? *Recommendation:
   national-average + override for v1; state table is a fast-follow if sign-up data shows
   geographic confusion.*
2. **Do we ask the user's state (expansion status)?** Options: (a) assume expansion +
   always show the coverage-gap caveat (no new input); (b) add an **"Is your state a
   Medicaid-expansion state?"** yes/no toggle; (c) full state dropdown (unlocks state
   subsidies & non-expansion list later). *Recommendation: (b) — one boolean, matches
   [DATA §6] without a 50-state dataset.*
3. **Exactly-400% behavior (§G4).** Keep the current `>= 400% → $0 PTC` (conservative,
   matches code) or treat the cliff as strictly **above** 400%? *Recommendation: keep `>=`
   for v1 and label it clearly; revisit if it confuses users at the boundary.*
4. **Non-expansion coverage-gap presentation.** A warning banner on the Medicaid zone, or a
   dedicated 5th "no affordable option" state in the strip? *Recommendation: warning banner
   on the Medicaid zone — it's a caveat, not a coverage scenario we model.*
5. **State supplemental subsidies (NM/MD/CA/CO/WA, [DATA §6.3]).** Out of scope for v1, or
   note "your state may add its own subsidy" where applicable? *Recommendation: one-line
   note only; do not model.*
6. **Enhanced-subsidy revival as an upside toggle?** [DATA §0/§7] flags a retroactive 2026
   extension as politically possible but not enacted. Add a "what if enhancements return"
   toggle, or model "lapsed" only? *Recommendation: lapsed-only for v1; revisit if Congress
   acts.*

---

## Appendix — 2026 figures used (all from `HEALTHCARE_2026_DATA.md`)

| Figure | Value | [DATA §] |
|---|---|---|
| FPL HH1 / HH2 (100%) | $15,650 / $21,150 | §2 |
| 138% FPL HH1 / HH2 | $21,597 / $29,187 | §2 |
| 400% FPL HH1 / HH2 | $62,600 / $84,600 | §2 |
| Applicable % floor (<150%) / top (300–400%) | 2.10% / 9.96% | §3a |
| CSR 94% & 87% OOP max (self/family) | $3,500 / $7,000 | §4 |
| CSR 73% OOP max (self/family) | $8,450 / $16,900 | §4 |
| Standard OOP max (self/family) | $10,600 / $21,200 | §4b |
| Medicaid premium / cost-share cap | ~$0 / ≤5% of income | §5 |
| Part B base premium (2026) | $202.90/mo | §1 |
| Subsidy cliff | $0 PTC above 400% FPL | §0, §3 |

*End of spec. No code changed by this document.*
