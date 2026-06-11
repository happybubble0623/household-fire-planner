# Calc + UX Fix Plan

Status: **DRAFT FOR APPROVAL — no code changed.** Consolidates all ten review items into one prioritized, batched plan.

Guardrail for every batch: **all current tests must stay green** (228 in the last full run; 205 `it/test` blocks across `src/tests/calculations/*` and `src/tests/components/*`). New behavior gets new tests. No batch lands without `npm test`, `npm run lint`, and `npm run build` passing.

Legend — Risk: **none** = copy/labels only · **low** = isolated UI/state, no shared math · **med** = touches calc inputs/defaults or data the projections consume.

---

## The ten items

### 1. Portfolio Drawdown: exclude the primary home from FIRE assets
- **What:** Stop the home being silently counted as a liquid, drawable FIRE asset; surface the exclusion where the user reads the total; fix contradictory docs.
- **Change:**
  - `getDefaultIncludedInFire("home")` → default `false` (real estate not auto-included). Keep `true` for other types.
  - Make the FIRE-asset total ignore real estate even if a stray `includedInFire` flag is set: in `summarizePhase1Portfolio` add a `realEstateValue`/excluded handling, or have `usePortfolioFireAssets()` copy `includedInFire` **minus** `type === "home"` balances. (Pick one; recommend excluding in the summary so every consumer is consistent.)
  - Add a one-line note under the **Current FIRE assets** input: *"Liquid investments only — your primary home isn't counted. Add a planned home sale below to include proceeds."* and update `termHelp["Current FIRE assets"]`.
  - Reconcile docs: `ARCHITECTURE.md:459` ("Include in FIRE defaults to yes") vs `ARCHITECTURE.md:196` / `PRD.md:174` ("real estate excluded") — make home default **no** and state once.
- **Files/symbols:** `src/lib/phase1/portfolio.ts` (`getDefaultIncludedInFire`, `summarizePhase1Portfolio`), `src/components/planning/fire-strategy-panel.tsx` (`usePortfolioFireAssets`, `termHelp["Current FIRE assets"]`, Current-FIRE-assets field), `ARCHITECTURE.md`, `PRD.md`.
- **Risk:** **med** (changes the default asset total a user copies; affects projection inputs).
- **Effort:** ~0.5 day.

### 2. Income/return labeling consistency across strategies
- **What:** Same column headers mean different things per strategy ("Investment return" = total in Drawdown vs appreciation-only in PP; "Income" = passive-only vs passive+yield). Make labels mode-specific; split the shared tooltip.
- **Change:** Per-mode projection-table headers (e.g. Drawdown "Investment return (total)" + "Guaranteed income"; PP "Appreciation (unspent)" + "Spendable income (incl. yield)"). Split `termHelp["Investment return"]` into mode-specific strings. Add a one-line "how returns are treated here" note atop each projection table. **No math change.**
- **Files/symbols:** `src/components/planning/fire-strategy-panel.tsx` (`termHelp`, `ProjectionTable` header props / `incomeLabel`, the three `*Results` components).
- **Risk:** **none** (labels/copy).
- **Effort:** ~0.25 day.

### 3. Principal-Preserving "Progress to FIRE" meter
- **What:** PP's "Principal-preserving coverage" bar is ~always 100% on success (the FIRE age is chosen so income covers expenses), so it's uninformative. Replace/supplement with an asset-progress meter like Drawdown's "Drawdown readiness."
- **Change:** New bar **"Progress to FIRE"** = `currentFireAssets / principalFloor` (clamped 0–100%), mirroring `WithdrawalResults`' `progress`. Demote/keep coverage as a secondary card. Data already exists (`inputs.currentFireAssets`, `result.principalFloor`).
- **Files/symbols:** `src/components/planning/fire-strategy-panel.tsx` (`PrincipalPreservingResults`, `ProgressBar`). No calc change.
- **Risk:** **low** (UI-only computation from existing fields).
- **Effort:** ~0.25 day.

### 4. Surface pre-FIRE cash-generating yield
- **What:** Pre-FIRE, cash yield IS reinvested (folded into `preFireReturn = appreciation + cashGenerating`) but the "Cash-generating return" column shows `0`, so users think it's omitted.
- **Change (presentation, not math):** Relabel the pre-FIRE "Investment return" column to convey it includes yield (e.g. "Investment return (appreciation + yield)") for pre-FIRE rows, OR show the yield split in the pre-FIRE rows. Add a note: "Before FIRE, your cash yield is reinvested and grows your assets." Confirm with a value-conservation test that totals are unchanged.
- **Files/symbols:** `src/components/planning/fire-strategy-panel.tsx` (PP projection rows render), optional `src/lib/phase1/fire.ts` only if we choose to populate a pre-FIRE `cashGeneratingReturn` column (display split — keep `endingAssets` math identical).
- **Risk:** **low** (none if pure relabel; low if we split the column for display).
- **Effort:** ~0.25 day.

### 5. Rename/explain the two return fields (keep the split)
- **What:** `expectedAnnualPortfolioReturnPercent` is reused with two meanings (total in Drawdown, appreciation-only in PP); "Investment return" / "Spendable investment return" / "Cash-generating return" are near-synonyms. Split is load-bearing for PP — keep it, fix the framing.
- **Change:** PP labels → "Price appreciation (kept)" + "Cash yield (spendable)"; Drawdown → "Total return (appreciation + yield)". One-line explainer in PP: "Total return = appreciation you keep + yield you can spend without selling." Never present one label with two meanings.
- **Files/symbols:** `src/components/planning/fire-strategy-panel.tsx` (`portfolioReturnLabel`, the return-field labels + `termHelp`). No calc/field-key change.
- **Risk:** **none** (labels/copy).
- **Effort:** ~0.25 day.

### 6. Healthcare input redesign (non-expert friendly)
- **What:** Remove the SLCSP lookup from the default path; estimate the benchmark internally; add a metal-tier picker; offer "estimate for me" vs "use my exact plan."
- **Change:**
  - **Internal benchmark estimate:** `benchmarkMonthlyPerPerson = NATIONAL_BENCHMARK_SILVER_BASE_21 × ageFactor(age) × regionMultiplier`, summed per covered adult. The "benchmark premium" field becomes an *advanced override*.
  - **Metal-tier picker (Bronze/Silver/Gold):** auto-fills `chosenPlanMonthly` (× benchmark), `acaDeductible`, `acaOutOfPocketMax` from presets; editable after.
  - **Mode toggle:** default "Estimate from typical plans" (auto benchmark + tier) vs "Use my exact plan" (today's manual fields) with a "where to find these on healthcare.gov" helper.
  - **New data constants** in `src/lib/calculations/healthcare-data.ts`:
    - `ACA_AGE_CURVE` — CMS Default Standardized Age Curve, ages 21→1.000 … 64→3.000 *(Source: CMS Market Rating Reform — Default Standardized Age Curve)*.
    - `NATIONAL_BENCHMARK_SILVER_BASE_21` — national-avg SLCSP normalized to age 21 (derive from KFF/CMS 2025 benchmark; ~$390/mo at 21 ↔ ~$497/mo at 40) *(Source: KFF Marketplace Average Premiums; CMS Marketplace data)*.
    - `REGION_MULTIPLIERS` `{ low: 0.78, average: 1.0, high: 1.25 }` (approximate bands).
    - `METAL_TIER_PRESETS` `{ bronze|silver|gold: { premiumVsBenchmark, deductible, oopMax } }` — premium ≈ 0.80 / 1.00 / 1.20 × benchmark; deductible ≈ $7,500 / $5,000 / $1,500; OOP-max tracks the statutory cap ($9,200 single 2025) *(Sources: KFF metal-tier average premiums & deductible analysis; ACA statutory OOP-max)*.
- **Files/symbols:** `src/lib/calculations/healthcare-data.ts` (new constants + a `estimateBenchmarkPremium()` helper, ideally in `healthcare-cost.ts` so it's unit-testable), `src/components/planning/healthcare-cost-panel.tsx` (new mode toggle + tier `SelectField` + derived state). `src/lib/calculations/healthcare-cost.ts` math unchanged — it still consumes `benchmarkSlcspMonthly`/`chosenPlanMonthly`, now fed from the estimate.
- **Risk:** **med** (new inputs feeding the subsidy math; needs unit tests for the benchmark estimate + tier fills).
- **Effort:** ~1–1.5 days.

### 7. Rewrite weak healthcare tooltips
- **What:** Optional-section tooltips restate the label; rewrite concise-but-useful (what to enter + why/typical value).
- **Change:** Apply the before→after set (ACA deductible, OOP max, explicit-OOP, HSA growth, HSA strategy, general inflation, days-abroad, coverage type, etc.) from the review.
- **Files/symbols:** `src/components/planning/healthcare-cost-panel.tsx` (`help=` strings, `termHelp`/FAQ where relevant).
- **Risk:** **none.**
- **Effort:** ~0.25 day.

### 8. Subsidy explainer copy
- **What:** Explain what the ACA subsidy is and where it comes from.
- **Change:**
  - **Tooltip** on the "ACA subsidies captured" card: the premium tax credit = federal money toward your premium, sized by MAGI vs the benchmark plan.
  - **Always-on inline note** in the ACA results area: government caps your share of the benchmark at a % of income and credits the rest; **drops to $0 above 400% FPL** (the cliff). Keep the existing personalized above/below-cliff callouts.
- **Files/symbols:** `src/components/planning/healthcare-cost-panel.tsx` (result cards + a new inline `Callout`).
- **Risk:** **none.**
- **Effort:** ~0.25 day.

### 9. Mortgage "Include taxes, insurance & fees" toggle
- **What:** Let users exclude the whole optional block without zeroing each field.
- **Change:** Add one `includeFees` boolean. When off: hide/disable the four fee fields, pass `0` for them into `calculateMortgage`, and hide the "Taxes, insurance & fees / mo" result card (monthly payment = P&I). When on: today's behavior. Typed values are preserved (not wiped) so toggling restores them. Add `includeFees` to the `useMemo` deps. **`calculateMortgage` itself unchanged** (already handles zeros).
- **Files/symbols:** `src/components/planning/planning-tool-panel.tsx` (`MortgageCalculator` state, the `<details>` section, the `useMemo` call + deps, the result `ResultCard` render).
- **Risk:** **low.**
- **Effort:** ~0.25 day.

### 10. Mortgage tooltips (loan type + others)
- **What:** Fields use plain `NumberInput` with no real help; loan-type has only a vague footnote and no picker explanation.
- **Change:** Add `InfoPopover`/help for loan type (Conventional/FHA/VA — what each is, how to pick, PMI behavior per type) and concise help for loan amount, rate, term, property tax, insurance, PMI rate, HOA (from the review set).
- **Files/symbols:** `src/components/planning/planning-tool-panel.tsx` (mortgage `NumberInput` `help` props or `toolFieldHelp` map, loan-type select help).
- **Risk:** **none.**
- **Effort:** ~0.25 day.

---

## Recommended batches & sequencing

### Batch 1 — Copy / labels / tooltips (zero math risk)
Items **2, 5, 7, 8, 10** (+ doc reconciliation portion of **1**).
- All are string/label changes; no projection math touched.
- **Verification:** `npm test` (existing 228 must stay green — only fix any test that asserts an exact changed header/label string, e.g. in `path-to-fire-panel.test.tsx`); `npm run lint`; `npm run build`. Skim the changed projection-table headers and healthcare tooltips in the browser mockup/dev.

### Batch 2 — Small UX additions (isolated, no shared calc)
Items **3** (PP Progress-to-FIRE meter), **4** (pre-FIRE yield relabel/display), **9** (mortgage fees toggle), and the **healthcare tier-picker UI** scaffolding of **6** (the SelectField + mode toggle, still feeding manual values).
- UI-layer state and rendering; no change to `fire.ts` survival math.
- **Verification:** add component tests — PP shows "Progress to FIRE" with expected value; mortgage `includeFees` off hides the fee card and yields payment = P&I, and toggling preserves field values. Re-run full suite + lint + build.

### Batch 3 — Calc-touching changes (need targeted tests)
Items **1** (home-asset exclusion default + summary/usePortfolioFireAssets) and the **internal benchmark estimate** of **6** (age curve × base × region; tier auto-fill driving the subsidy math).
- **Verification:**
  - Item 1: extend `src/tests/components/portfolio-panel.test.tsx` + a `portfolio.ts` unit test — `getDefaultIncludedInFire("home") === false`; `summarizePhase1Portfolio` excludes home from the FIRE total; `usePortfolioFireAssets` no longer pulls home in. Confirm `fire.test.ts` projections unaffected by the default flip.
  - Item 6: new `healthcare-cost.test.ts` cases — `estimateBenchmarkPremium(age, region)` hits the age-curve endpoints (21→base, 64→3×), region multipliers apply, and each metal-tier preset fills premium/deductible/OOP as expected; existing subsidy-math tests still pass with estimated inputs.
- Re-run full suite + lint + build; manually verify the redesigned healthcare flow and the FIRE-asset note in the browser.

---

## Recommended order
**Batch 1 → Batch 2 → Batch 3.** Ship Batch 1 first (high value, zero risk — fixes the worst confusion immediately), then the contained UX in Batch 2, then the two math-adjacent changes in Batch 3 with their dedicated tests. **No batch merges unless the full test suite (228) is green** plus lint and build.

Rough total: ~3.5–4.5 days across the three batches.
