# Calculation-Correctness Audit — Every Calculator vs. the Governing Rules

*Created: 2026-06-13 · Last updated: 2026-06-13*

> **Purpose.** A rigorous, read-only audit of every calculator/engine in the app against the
> actual governing rules (SSA, IRS, CMS/Medicare, ACA/healthcare.gov, and standard finance
> formulas). Triggered after two real rule errors slipped through (an out-of-pocket max wrongly
> applied to Original Medicare; and a worry that Social Security wasn't applying the 35-highest-years
> averaging). The job was to find **all** such violations, not just those two, and to propose
> rule-pinned tests so the math can never silently drift again.
>
> **No code was changed in this task.** Every fix below is a recommendation. Every rule is cited to
> an authoritative source (SSA / IRS / CMS / healthcare.gov / KFF), verified June 2026.
>
> **Two headline verdicts up front:**
> 1. **Social Security 35-year averaging — NOT a violation. The founder's worry is REFUTED.** The
>    code correctly takes the highest 35 indexed years, zero-fills to 35, and divides by 420 months.
>    Evidence and a worked example are in §1.1.
> 2. **Medicare out-of-pocket max on Original Medicare — CONFIRMED as a residual violation.** The
>    field was relabeled (good), but the engine still applies a Medicare-Advantage-style OOP ceiling
>    (default $6,000) to the **Original Medicare + Medigap** path, where there is no OOP max and real
>    exposure is ≈ the $283 Part B deductible. Evidence and a worked example are in §2.1.

---

## 0. Summary table

| # | Calculator | Rule under test | Status | Severity |
|---|---|---|---|---|
| 1.1 | Social Security | AIME = highest **35** indexed years ÷ **420** months, zero-filled | **OK** | — |
| 1.2 | Social Security | PIA bend-point formula 90/32/15 + 2026 bend points ($1,286 / $7,749) | **OK** | — |
| 1.3 | Social Security | Wage indexing to NAWI at age 60; face value at 60+ | **OK** | — |
| 1.4 | Social Security | Taxable maximum ($184,500 for 2026) + historical table | **OK** | — |
| 1.5 | Social Security | FRA by birth year; DRC 8%/yr; early 5/9 then 5/12 of 1%/mo | **OK** | — |
| 1.6 | Social Security | WEP/GPO | **OK** (correctly omitted — repealed) | — |
| 1.7 | Social Security | Final monthly benefit rounding (down to whole dollar) | **VIOLATION** | Minor |
| 1.8 | Social Security | "Today's-dollar" deflator uses wage growth, not CPI | **VIOLATION** | Minor |
| 2.1 | Healthcare / Medicare | Original Medicare has **no** OOP max; Medigap ≈ Part B deductible | **VIOLATION** | **Critical** |
| 2.2 | Healthcare / Medicare | IRMAA 2026 brackets/surcharges (Part B & D) | **OK** | — |
| 2.3 | Healthcare / Medicare | Part B premium $202.90 / deductible $283 (2026) | **OK** | — |
| 2.4 | Healthcare / ACA | Applicable-% schedule ≥150% FPL + 400% cliff (lapsed enhancements) | **OK** | — |
| 2.5 | Healthcare / ACA | Applicable-% **below 150% FPL** (flat 2.10% floor) | **VIOLATION** | Moderate |
| 2.6 | Healthcare / ACA | Cost-Sharing Reductions (CSR) OOP-max reduction (100–250% FPL silver) | **VIOLATION** (not modeled) | Moderate |
| 2.7 | Healthcare / ACA | 2026 OOP max $10,600 / $21,200 | **OK** | — |
| 2.8 | Healthcare / Medicare | Part D $2,000→**$2,100** (2026) drug OOP cap | **VIOLATION** (not enforced) | Minor |
| 2.9 | Healthcare / Medicaid | <138% FPL ~$0 premium + 5%-income cost-sharing cap | **OK** (5% cap not modeled) | Minor |
| 2.10 | Healthcare | Medical-trend inflation + present-value discounting | **OK** (sane, internally consistent) | — |
| 3.1 | Mortgage | Amortization formula | **OK** | — |
| 3.2 | Mortgage | PMI cancels at 80% / auto-terminates at 78% of **original home value** | **VIOLATION** | Moderate |
| 3.3 | Mortgage | Escrow / PITI composition | **OK** | — |
| 3.4 | Mortgage | Refinance break-even / extra payments | N/A (not implemented) | — |
| 4.1 | Investment | Monthly compounding + contribution timing | **OK** | — |
| 4.2 | Investment | Real vs nominal (no inflation adjustment shown) | **VIOLATION** | Minor |
| 4.3 | Investment | Expense-ratio treatment | **VIOLATION** (no input; gross returns) | Minor |
| 5.1 | FIRE (phase1/fire.ts) | Inflation/return consistency, SS integration, drawdown | **OK** | — |
| 5.2 | FIRE (calculations/fire.ts) | Saved-path deterministic evaluator inflation consistency | **VIOLATION** | **Critical** |
| 5.3 | FIRE | Simple FIRE number default withdrawal rate (5% vs 4% rule) | **VIOLATION** (fallback only) | Minor |
| 5.4 | FIRE (monte-carlo) | Inflation + historical returns | **OK** (`failureAge` hardcoded 70) | Minor |
| 6.1 | Cross-cutting tax | Withdrawals/SS taxed via blunt gross-up | **VIOLATION** (oversimplified) | Moderate |

**Counts: 2 Critical · 5 Moderate · 8 Minor.** (Plus 13 rules verified OK.)

---

## 1. Social Security — `src/lib/calculations/social-security.ts`

All 2026 statutory constants were independently confirmed against SSA sources (June 2026):
bend points $1,286 / $7,749 ([ssa.gov bendpoints](https://www.ssa.gov/oact/cola/bendpoints.html)),
taxable max $184,500 ([cbb](https://www.ssa.gov/oact/cola/cbb.html)),
credit amount $1,890 ([QC](https://www.ssa.gov/oact/cola/QC.html)),
2024 NAWI $69,846.57 ([Benefits example](https://www.ssa.gov/oact/cola/Benefits.html)).
**Every constant in the code matches.**

### 1.1 AIME — highest 35 years ÷ 420 months  ·  Status: **OK** (founder's worry REFUTED)

**Rule (SSA).** "We choose those years with the highest indexed earnings, sum such indexed earnings,
and divide the total amount by the total number of months in those years … round … down to the next
lower dollar." For a retirement PIA that span is the highest **35** years = **420 months**; missing
years are zero-filled.
Source: [SSA — Benefits computation](https://www.ssa.gov/oact/cola/Benefits.html); POMS [RS 00605.015](https://secure.ssa.gov/poms.nsf/lnx/0300605015).

**Code (`social-security.ts:163-174`).**
```ts
const highest35 = indexedEarnings.map(r => r.indexedEarnings).sort((a,b)=>b-a).slice(0, 35);
while (highest35.length < 35) highest35.push(0);          // zero-fill to 35
return Math.floor(highest35.reduce((s,a)=>s+a,0) / 420);  // ÷420, round down
```

**Verdict.** Correct on all three points: top-35 selection, zero-fill, ÷420 with floor. **This is
exactly the SSA method.** The founder's concern that the 35-year cap/averaging might be missing is
**refuted by the code**.

**Worked example.** 40 years of (already-indexed) $50,000:
top-35 sum = 35 × 50,000 = 1,750,000; ÷ 420 = **$4,166** (the 5 lowest years correctly dropped).
With only 20 such years: 20 × 50,000 = 1,000,000; ÷ 420 = **$2,380** (15 zero years correctly
included in the divisor). The code produces both.

### 1.2 PIA bend-point formula  ·  Status: **OK**

**Rule.** PIA = 90% of AIME up to the first bend point + 32% between bend points + 15% above the
second; 2026 bend points $1,286 and $7,749; PIA rounded down to the next dime.
Source: [ssa.gov PIA](https://www.ssa.gov/oact/cola/piaformula.html).

**Code (`:176-182`)** implements `min/max` layering at 0.9 / 0.32 / 0.15 and `roundDownToDime`. ✔

**Worked example.** AIME $6,000 → 0.9×1,286 + 0.32×(6,000−1,286) = 1,157.40 + 1,508.48 = 2,665.88
→ rounded down to dime = **$2,665.80**. Code returns the same. Bend points are correctly indexed to
the **year of first eligibility (age 62)** via `projectBendPoints(eligibilityYear, …)` (`:226`).

### 1.3 Wage indexing  ·  Status: **OK**

**Rule.** Earnings are indexed by NAWI(age-60 year) / NAWI(earnings year); earnings **in or after**
the age-60 year are taken at face value. Source: [SSA Benefits example](https://www.ssa.gov/oact/cola/Benefits.html).

**Code (`:219-225`).** `year < indexingYear ? earnings × NAWI(indexingYear)/NAWI(year) : earnings`,
with `indexingYear = birthYear + 60`. ✔ Exactly the SSA rule.

### 1.4 Taxable maximum  ·  Status: **OK**

Historical table 1978-2026 present and correct (`:59-109`); 2026 = $184,500. Earnings capped per
year before indexing (`:282`). Future years projected from the 2026 base at the wage-growth
assumption — a reasonable forward model.

### 1.5 FRA / DRC / early reduction  ·  Status: **OK**

- **FRA (`:327-333`)**: 66 for 1943-1954, 67 for 1960+, with the correct 2-month/yr ramps for
  1938-1942 and 1955-1959. Matches [SSA NRA table](https://www.ssa.gov/oact/progdata/nra.html).
- **DRC (`:203-206`)**: `2/3 of 1%`/month = 8%/yr, capped at age 70. ✔
- **Early (`:195-201`)**: `5/9 of 1%`/month first 36, `5/12 of 1%` beyond. ✔
- **Worked example.** FRA 67, claim at 62: 36×(5/9%) + 24×(5/12%) = 20% + 10% = **30% reduction**
  → ×0.70. Claim at 70: 36×(2/3%) = **24% increase** → ×1.24. Code reproduces both.

### 1.6 WEP / GPO  ·  Status: **OK** (correctly omitted)

**Rule (2026).** The **Social Security Fairness Act** (signed **Jan 5, 2025**) **repealed both WEP
and GPO**; they do not apply to benefits payable for **Jan 2024 and later**.
Source: [SSA — Social Security Fairness Act](https://www.ssa.gov/benefits/retirement/social-security-fairness-act.html).

**Verdict.** The code does **not** apply WEP/GPO — which is **correct** for any 2026 claim. The
founder's "check WEP/GPO" item resolves to: *they were repealed; omitting them is right.* (Optional:
a one-line note in the UI that these were repealed would pre-empt user confusion.)

### 1.7 Final monthly benefit rounding  ·  Status: **VIOLATION** · Minor

**Rule.** SSA rounds the **monthly benefit amount down to the next lower whole dollar** (the PIA is
rounded to a dime; the final payable amount to a dollar). Source: [ssa.gov COLA computation](https://www.ssa.gov/oact/cola/Benefits.html).

**Code (`:200, :206, :237-238`).** Uses `roundToCents` for the adjusted benefit, not floor-to-dollar.

**Impact.** Off by up to ~$0.99/month. Cosmetic, but it means the estimate won't tie to the penny
with SSA. **Fix:** apply `Math.floor` to whole dollars on the final monthly benefit.

### 1.8 "Today's-dollar" deflator uses wage growth, not CPI  ·  Status: **VIOLATION** · Minor

**Code (`:233-237`).** Converts the future benefit to today's dollars by dividing by
`(1 + wageGrowthAssumption)^years`. Purchasing power is a **price-inflation (CPI)** concept; benefits
are wage-indexed before eligibility but COLA'd by CPI after. Using wage growth (typically > CPI)
**understates** the today's-dollar figure slightly. **Fix:** deflate by a general/CPI inflation
assumption, kept consistent with the rest of the app's 3% default.

---

## 2. Healthcare / Medicare / ACA — `healthcare-cost.ts`, `healthcare-data.ts`

2026 constants independently confirmed: Part B $202.90, Part B deductible $283
([CMS 2026 Part B fact sheet](https://www.cms.gov/newsroom/fact-sheets/2026-medicare-parts-b-premiums-deductibles)); all six IRMAA tiers/multipliers/surcharges
exact; ACA OOP $10,600/$21,200 and the applicable-% schedule ≥150% all correct
([Rev. Proc. 2025-25](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf), [Fed. Reg. 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability)).
See `docs/product-strategy/HEALTHCARE_2026_DATA.md`.

### 2.1 Out-of-pocket max applied to Original Medicare  ·  Status: **VIOLATION** · **CRITICAL**

**Rule.**
- **Original Medicare (Part A + B) has NO annual out-of-pocket maximum.** A beneficiary faces
  unlimited 20% Part B coinsurance.
- **Medicare Advantage (Part C)** does have a mandatory in-network MOOP (2026 federal cap **$9,250**;
  average ≈ $5,400).
- **Medigap** caps exposure by design: **Plan G** leaves the enrollee responsible only for the
  **$283 Part B deductible** (no Medigap plan pays that deductible).
Sources: [Medicare Interactive — MA OOP limit](https://www.medicareinteractive.org/understanding-medicare/health-coverage-options/medicare-advantage-plan-overview/maximum-out-of-pocket-limit);
[KFF — Medicare Advantage in 2026](https://www.kff.org/medicare/medicare-advantage-in-2026-premiums-out-of-pocket-limits-supplemental-benefits-and-prior-authorization/);
[medicare.gov — Medigap](https://www.medicare.gov/health-drug-plans/medigap).

**Code.** `expectedOutOfPocket(usage, oopMax)` returns `OOP_USAGE_PRESETS[usage] × oopMax`
(`healthcare-cost.ts:270-273`); for Medicare, `medicareOop0 = expected(...) × people`
(`:340-341`). The same `medicareOutOfPocketMax` field drives **both** coverage paths, and the panel
default is **$6,000 — explicitly described as "the 2026 average Medicare Advantage in-network
out-of-pocket"** (`healthcare-cost-panel.tsx:155, 569-577`), applied even when the user selects
**"Original Medicare + Medigap"**.

**Why it's still a violation (despite the relabel).** The field was renamed to "Medicare
out-of-pocket (annual, per person)" with a note that "Medigap users usually pay far less" — good
mitigation. But the **default behavior** for the most common selection (Original Medicare + Medigap)
still computes OOP as `usage% × an MA MOOP`, an OOP-max mechanism that doesn't exist for Original
Medicare and badly overstates Medigap exposure. Defaults drive the headline lifetime number, so the
default output is materially wrong.

**Worked example.** Single, Original Medicare + Medigap Plan G, "moderate" usage, defaults:
code OOP = 0.30 × $6,000 = **$1,800/yr**. Real Plan G medical OOP ≈ **$283/yr** (Part B deductible) +
modest drug copays. Overstatement ≈ **$1,500/yr/person**, compounding over ~25 Medicare years at 5%
medical trend → **tens of thousands** added to the present-value lifetime headline.

**Fix.**
1. Make the OOP default **coverage-type-specific**: Medigap → seed from plan design (Plan G ≈ Part B
   deductible $283 + a small drug-copay allowance; Plans K/L use their statutory caps $8,000/$4,000);
   Advantage → keep the MA MOOP model.
2. Do **not** present a "$6,000 MA average" default when `medicareCoverage === "medigap"`.
3. For Original Medicare *without* Medigap, model true unlimited exposure (or require Medigap/MA) —
   never a fixed OOP max.

### 2.2 IRMAA brackets & surcharges (2026)  ·  Status: **OK**

`IRMAA_TIERS_2026` (`healthcare-data.ts:176-188`) matches CMS exactly: multipliers 1.0/1.4/2.0/2.6/
3.2/3.4, Part D surcharges $0/14.50/37.50/60.40/83.30/91.00, thresholds $109k/137k/171k/205k/500k
(single) and double (joint). `selectIrmaaTier` uses `magi <= ceiling` ascending — correct.
*Note:* the top two thresholds ($500k/$750k) are statutorily **frozen through 2028** (not indexed);
the code uses fixed values and does not project them, so this is fine. The use of entered retirement
MAGI (rather than MAGI-2-years-prior) is a documented planning simplification.

### 2.3 Part B premium / deductible  ·  Status: **OK**
`PART_B_BASE_PREMIUM_2026 = 202.9`, `PART_B_DEDUCTIBLE_2026 = 283` — both confirmed.

### 2.4 ACA applicable-% (≥150% FPL) and the 400% cliff  ·  Status: **OK**

Nodes 150→4.19%, 200→6.60%, 250→8.44%, 300→9.96%, 400→9.96% (`healthcare-data.ts:40-46`),
`acaApplicablePercent` returns `null` (PTC = 0) at ≥400% FPL (`healthcare-cost.ts:156-174`). This
correctly models the **reinstated subsidy cliff** after the enhanced ARPA/IRA subsidies **lapsed
2025-12-31**. PTC = max(0, benchmark − MAGI×applicable%) (`:245-246`) is the correct formula.

**Worked example.** HH 1, MAGI $40,000 = 255.6% FPL → interpolate 8.44%→9.96%: 8.61%; required
contribution = $3,444; benchmark $7,000 → PTC **$3,556**. ✔

### 2.5 ACA applicable-% **below 150% FPL**  ·  Status: **VIOLATION** · Moderate

**Rule (Rev. Proc. 2025-25).** Below 150% FPL the schedule is **not** flat: <133% = 2.10%, **133% =
3.14%, 138% = 3.45%, 150% = 4.19%**, interpolated within the 133–150% band.
Source: [IRS Rev. Proc. 2025-25](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf); repo `.firecrawl/cy2026ref.md`.

**Code (`healthcare-cost.ts:161`).** Everything below the first node (150%) returns the **flat 2.10%
floor**. So 133–150% FPL households get 2.10% instead of 3.14–4.19% → **expected contribution
understated → subsidy overstated**.

**Worked example.** HH 1, MAGI $22,000 = 140.6% FPL. True rate ≈ 3.61% → contribution $794. Code uses
2.10% → $462. **Subsidy overstated ≈ $332/yr.** (Pre-65 households 138–150% FPL are affected in
expansion states — below 138% the code already routes to Medicaid; in non-expansion states the whole
100–150% band is affected.)

**Fix.** Add the sub-150% nodes (133% → 3.14%, 138% → 3.45%) and interpolate; keep 2.10% only as the
floor strictly below 133% FPL.

### 2.6 Cost-Sharing Reductions (CSR) not modeled  ·  Status: **VIOLATION** · Moderate

**Rule.** Enrollees **100–250% FPL** who choose a **Silver** plan get CSR variants with **reduced OOP
maxima**: ≤150% and 151–200% → **$3,500/$7,000**; 201–250% → **$8,450/$16,900**.
Source: [Fed. Reg. 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability); `HEALTHCARE_2026_DATA.md §4`.

**Code.** `METAL_TIER_PRESETS.silver.oopMaxPerPerson = 8_500` (`healthcare-data.ts:148`) with no FPL
adjustment. A 175% FPL silver enrollee whose true OOP max is **$3,500** is modeled at **$8,500**,
overstating worst-case (and, via the usage%, expected) OOP.

**Worked example.** Single, 175% FPL, silver, "high" usage: code OOP = 0.85 × $8,500 = **$7,225**;
with CSR the OOP max is $3,500, so the true ceiling is **$3,500**. Overstated by **$3,725** in a
high-utilization year.

**Fix.** When the chosen plan is Silver and income is 100–250% FPL, override `acaOutOfPocketMax` to
the CSR-tier value (and ideally the reduced deductible) before computing expected OOP.

### 2.7 Standard ACA OOP max  ·  Status: **OK**
$10,600 self-only; family = ×2 = $21,200 (`healthcare-data.ts:133, 147`). Confirmed.

### 2.8 Part D drug out-of-pocket cap  ·  Status: **VIOLATION** (not enforced) · Minor

**Rule.** Part D caps a beneficiary's annual covered-drug out-of-pocket at **$2,000 in 2025**, indexed
to **$2,100 for 2026**. Source: [CMS — Final CY2026 Part D Redesign](https://www.cms.gov/newsroom/fact-sheets/final-cy-2026-part-d-redesign-program-instructions); [medicare.gov drug costs](https://www.medicare.gov/health-drug-plans/part-d/basics/costs).

**Code.** No cap is enforced; Medicare OOP is purely `usage% × ceiling`. Because it's user-driven and
the cap only *limits* drug OOP, the omission is **conservative** (can only overstate). Still, the
$2,100 cap is a marketed 2025+ benefit worth honoring. **Fix:** when modeling drug OOP, cap the
drug-component at the indexed annual figure ($2,100 for 2026).

### 2.9 Medicaid (<138% FPL)  ·  Status: **OK** (5% cap simplified to $0) · Minor

**Code (`healthcare-cost.ts:383-388`).** `medicaidEligiblePre65` (incomePctFpl < 1.38) → premium 0,
OOP 0. **Rule:** premium ~$0 is right; cost-sharing is capped at **5% of family income** (42 CFR
447.56), not exactly $0. Modeling it as $0 slightly understates exposure but is "near-zero" and
directionally fine. **Fix (optional):** model Medicaid OOP as `min(actual, 5% × income)`.

### 2.10 Medical trend + present-value discounting  ·  Status: **OK**

Defaults: ACA trend 5.5%, Medicare 5.0%, general inflation 3.0%, real discount 3.0%
(`healthcare-data.ts:54, 62, 190`). The engine computes one nominal series and derives three
reconciling bases (nominal / real / present value) via deflators (`healthcare-cost.ts:293-307`); the
per-year present values **sum to the headline** by construction. This is internally consistent and a
defensible "what to set aside today" framing. No statutory rule governs the discount rate; the choice
is sound. *(Minor caveat: the year-0 ACA subsidy is frozen and then grown at medical trend rather
than re-evaluated each gap year against an inflating FPL/income — a simplification, not an error.)*

---

## 3. Mortgage — `planning-tool-panel.tsx` (`calculateMortgage`, `:115-194`)

### 3.1 Amortization formula  ·  Status: **OK**

`M = P·r / (1 − (1+r)^−n)` with `r = APR/12`, zero-rate handled as `P/n` (`:136-141`). This is the
standard amortization formula ([Investopedia](https://www.investopedia.com/mortgage-calculator-5084794)).
Per-month interest/principal split and yearly aggregation are correct.

**Worked example.** $500,000, 6.5%, 30 yr → **$3,160.34/mo** P&I. Matches standard calculators. ✔

### 3.2 PMI cancellation threshold  ·  Status: **VIOLATION** · Moderate

**Rule (Homeowners Protection Act, via CFPB).** PMI is **borrower-cancellable at 80%** and
**automatically terminated at 78%** of the **original VALUE of the home** — defined as the **lesser of
purchase price or origination appraisal** — **not** the original loan amount. There is also a
midpoint-of-amortization termination.
Source: [CFPB — removing PMI](https://www.consumerfinance.gov/ask-cfpb/when-can-i-remove-private-mortgage-insurance-pmi-from-my-loan-en-202/).

**Code (`:160`).** `pmi = ... balance > 0.8 * loanAmount ? pmiMonthly : 0` — compares the balance to
**80% of the original loan**, and there is **no home-value / down-payment input** at all, so the
correct threshold can't even be computed. Since `loanAmount < homeValue`, 80% of the loan is a much
lower balance than 80% of value, so **PMI runs far too long**. The 78% automatic-termination and
midpoint rules are absent. (FHA is also mishandled: the help text says FHA MIP "often lasts the life
of the loan," but the code still cancels it at the 80%-of-loan threshold.)

**Worked example.** $400,000 home, 10% down → $360,000 loan, 6.5%, 30 yr, PMI 0.5% ($150/mo).
- **Correct:** cancellable when balance ≤ $320,000 (80% of $400k value) ≈ year ~5; auto-terminate at
  $312,000.
- **Code:** drops only when balance < $288,000 (80% of $360k loan) ≈ year ~10.
- **≈ 5 extra years of PMI ≈ $9,000 overcharged.**

**Fix.** Add **home value** (or purchase price + down payment) as an input; cancel PMI at 80% and
auto-terminate at 78% of that original value; suppress PMI cancellation for FHA loans with <10% down
(MIP for the life of the loan).

### 3.3 Escrow / PITI  ·  Status: **OK**
`monthlyPayment = P&I + tax + insurance + HOA + PMI` (`:182-188`). Correct PITI + HOA. `totalPaid`
intentionally counts P&I only — acceptable labeling.

### 3.4 Refinance break-even / extra payments  ·  N/A
Not implemented; the tool doesn't claim them. No finding.

---

## 4. Investment — `planning-tool-panel.tsx` (`calculateInvestment`, `:203-243`)

### 4.1 Compounding + contribution timing  ·  Status: **OK**

`balance = balance·(1 + APR/12) + contribution` each month (`:223-224`) — monthly compounding at the
nominal APR/12 convention (standard), with contributions at **end of period** (ordinary annuity, the
conventional default).

**Worked example.** $100,000 + $2,000/mo, 7%, 15 yr → ≈ **$918,800** nominal. Matches standard FV. ✔

### 4.2 Real vs nominal  ·  Status: **VIOLATION** · Minor

The result is **nominal future dollars** with **no inflation adjustment and no real/today's-dollar
view** — unlike the healthcare and Phase-1 engines, which both expose today's-dollar figures. The
~$918,800 above is ≈ **$589,000 in today's dollars** at 3% over 15 years. Showing only the nominal
figure overstates perceived purchasing power. **Fix:** add an inflation input and a today's-dollar
toggle (consistent with the rest of the app).

### 4.3 Expense-ratio treatment  ·  Status: **VIOLATION** (absent) · Minor

There is **no expense-ratio / fee input**; the return is applied gross. A user who enters a gross
index return (e.g. 7%) sees fee-free growth; even a 0.5% fee cuts the 15-year ending balance by
~7-8%. **Fix:** add an expense-ratio input and apply `(return − expenseRatio)`, or document that the
return field should be entered **net of fees**.

---

## 5. FIRE strategies

### 5.1 Phase-1 engine — `src/lib/phase1/fire.ts`  ·  Status: **OK**

This is the well-built engine. It does **not** apply a naive 4%-rule constant; it runs a year-by-year
drawdown search for the **earliest age** at which the portfolio survives to life expectancy
(`estimatePortfolioDrawdownProjection`, `projectWithdrawalRateSurvival`).

- **Inflation/return consistency — correct.** Spending is inflated with `applyInflationForYears`
  (`:732-735`) and the portfolio grows at the **nominal** `expectedAnnualPortfolioReturnPercent`
  (`:552`). Nominal returns vs nominal (inflating) spending is internally consistent — the
  nominal-equivalent of the real 4% framing.
- **Withdrawal timing — conservative/correct.** Withdrawal taken at the start of the year, remainder
  grows (`:557-568`).
- **Social Security integration — correct, no double-count.** SS enters as a generic income source
  with a `startAge` and an `inflationAdjusted` flag (COLA ≈ CPI), reducing the portfolio-funded gap
  (`calculateWithdrawalForYear`, `:540-545`). The SS engine's output is fed in as that income stream.
- **Principal-preserving / income-stream modes** are internally consistent (appreciation grows the
  floor; income + cash yield fund spending).

No violations. This is the reference for how the other FIRE surface *should* treat inflation.

### 5.2 Saved-path deterministic evaluator — `src/lib/calculations/fire.ts`  ·  Status: **VIOLATION** · **CRITICAL**

**Issue — inflation inconsistency that makes "can I retire?" optimistic.** In
`evaluateWithdrawalRateCandidate` (`:123-183`):
- Returns are **nominal**: `estimateAnnualReturn` = 7% stocks / 3.5% bonds / 2% cash (`:289-295`),
  compounded monthly (`:130`).
- Expenses come from `getAnnualExpensesForDate` (`:218-230`), which **sums raw expense amounts with
  no inflation growth over the horizon** (it ignores even the per-expense `inflationAdjusted` flag).

So over a 30-year horizon the portfolio compounds at ~7% nominal while spending is held **flat in
nominal terms** — real spending erodes every year. This **overstates portfolio survival** and can
return a `passes: true` retirement verdict that is too optimistic. It is inconsistent both with
`monte-carlo.ts` (which *does* inflate spending via `inflationMultiplier`, `:58-59`) and with
`phase1/fire.ts` (which inflates correctly). Because this drives a user-facing pass/fail
("you can retire on this date"), an over-optimistic result is **misleading** → Critical.

**Worked illustration.** $1,000,000, flat $50,000/yr spend, 7% nominal, 30 yr: with **flat** spending
the portfolio balloons (~$3M+) and trivially "passes." With spending inflated at 3% (true $50k real),
year-30 spending is ~$118k nominal and the same portfolio is far closer to failure. The two give
opposite verdicts near the margin.

**Fix.** Inflate expenses each projection month (mirror `monte-carlo.ts` / `phase1`), **or** switch to
real returns with real (flat) spending — but be consistent. Don't pair nominal returns with flat
nominal spending.

### 5.3 Simple FIRE number default withdrawal rate  ·  Status: **VIOLATION** (fallback only) · Minor

`calculateSimpleFireNumber(..., withdrawalRate = 0.05)` (`calculations/fire.ts:22-29`) defaults to
**5%** (= 20× expenses), more aggressive than the canonical **4% rule** (25×). In the main saved-path
flow the **user's** `assumptions.withdrawalRate` is passed (`projection-summary.ts:38-42`), so the 5%
is only a bare-call fallback. Still, the glossary and strategy copy lean on the **4% rule**
(`fire-glossary.ts:30,98`, `fire-strategies.ts:60`), so a 5% default fallback is inconsistent with the
app's own framing. **Fix:** default the fallback to 0.04, or require the rate explicitly.

### 5.4 Monte Carlo — `src/lib/calculations/monte-carlo.ts`  ·  Status: **OK** · Minor note

Block-bootstrap of historical monthly returns with **inflation correctly applied** to spending
(`:58-59`) and a deterministic seeded RNG (reproducible). Sound. **Minor:** `failureAge` is hardcoded
to `70` (`:77`) regardless of the actual first-failure age — cosmetic, but it can mislabel the
reported failure age. **Fix:** carry the real failure age out of the simulation.

---

## 6. Cross-cutting

### 6.1 Tax treatment  ·  Status: **VIOLATION** (oversimplified) · Moderate

**Code.** Both engines gross up the spending gap with a single flat effective rate:
`grossWithdrawal = afterTaxGap / (1 − rate)` (`calculations/fire.ts:31-47`; `phase1/fire.ts:23-28`).

**Reality.** This ignores: the **taxation of Social Security benefits** (0/50/85% includable by the
provisional-income thresholds), the **standard deduction**, **progressive brackets**, the **0%/15%
long-term capital-gains brackets** (central to most FIRE tax planning), and **Roth/HSA tax-free**
withdrawals. A blunt gross-up can mis-state required withdrawals in **either** direction and
specifically over-taxes a low-income FIRE household that would owe little or nothing.
Sources: [IRS Pub 915 (SS benefits)](https://www.irs.gov/forms-pubs/about-publication-915); [IRS Topic 409 (cap gains)](https://www.irs.gov/taxtopics/tc409).

**Severity.** Moderate — it's explicitly a "simple" mode and the rate is user-set, so it's
configurable and directionally usable, but it is not the governing tax rule. **Fix (longer-term):**
offer an account-aware tax mode (the codebase already has `account_level` scaffolding) and at minimum
document that the simple rate should be the household's blended **effective** rate, not a marginal
bracket.

### 6.2 Inflation consistency (summary)

| Engine | Spending inflated? | Returns | Consistent? |
|---|---|---|---|
| `phase1/fire.ts` | Yes | Nominal | ✔ |
| `monte-carlo.ts` | Yes | Real (historical) | ✔ |
| `calculations/fire.ts` (saved-path deterministic) | **No** | Nominal | **✗ — see 5.2** |
| `healthcare-cost.ts` | Yes (medical trend) | n/a (cost model) | ✔ |
| `investment` calc | No (nominal only) | Nominal | label-only — see 4.2 |

---

## 7. Prioritized fix list (Critical first)

**Critical**
1. **§2.1 Medicare OOP for Original Medicare + Medigap** — make the OOP default coverage-type-specific;
   stop applying an MA-style OOP-max (default $6,000) to the Medigap path (true ≈ $283 Part B
   deductible). Highest user-trust impact; directly the founder's flagged class of error.
2. **§5.2 Saved-path deterministic FIRE evaluator** — inflate expenses over the horizon (or use real
   returns consistently); the current nominal-returns-vs-flat-spending pairing makes the retirement
   pass/fail over-optimistic.

**Moderate**
3. **§2.5 ACA applicable-% below 150% FPL** — add the 133%/138% nodes; stop flat-flooring at 2.10%
   above 133%.
4. **§2.6 CSR OOP-max reductions** — apply $3,500/$8,450-tier OOP maxima for 100–250% FPL silver.
5. **§3.2 Mortgage PMI** — add home value; cancel at 80% / auto-terminate at 78% of original value;
   suppress for FHA <10% down.
6. **§6.1 Tax gross-up** — document/upgrade beyond a blunt flat-rate gross-up (SS taxability, LTCG
   brackets, standard deduction).

**Minor**
7. §2.8 enforce the Part D $2,100 (2026) drug OOP cap.
8. §4.2 add an inflation/today's-dollar view to the investment calculator.
9. §4.3 add an expense-ratio input (or label returns "net of fees").
10. §1.7 floor the final SS monthly benefit to whole dollars.
11. §1.8 deflate the SS today's-dollar figure by CPI, not wage growth.
12. §2.9 model Medicaid OOP as `min(actual, 5% × income)`.
13. §5.3 default the simple-FIRE fallback withdrawal rate to 4%.
14. §5.4 report the real Monte Carlo failure age (not a hardcoded 70).

---

## 8. GUARDRAIL RECOMMENDATION — rule-pinned unit tests

The systemic fix the founder is asking for: **encode an authoritative worked example as a test for
each calculator**, so the math can never silently drift from the published rule again. Each test below
pins a *known input → known output* taken from a primary source. Add them under `src/tests/` and run in
CI. (Tolerances: exact for integer/dollar rules; ±$1 where rounding conventions differ.)

### Social Security (`social-security.ts`)
- **AIME 35-year cap (locks §1.1):** 40 indexed years of $50,000 → AIME `$4,166`; 20 years of
  $50,000 → AIME `$2,380` (proves zero-fill ÷420 and top-35 truncation).
- **PIA bend points (locks §1.2 + 2026 constants):** AIME $6,000 with 2026 bend points → PIA
  `$2,665.80`. Add a guard test asserting `BASE_BEND_POINTS = {1286, 7749}`, `taxableMax[2026] =
  184500`, `QC[2026] = 1890`, `NAWI 2024 = 69846.57` so a constants edit fails loudly.
- **Claiming adjustments (locks §1.5):** FRA 67, PIA $2,000 → claim 62 = `$1,400` (−30%); claim 70 =
  `$2,480` (+24%); claim 67 = `$2,000`.
- **FRA table:** birth 1955 → 66y2m; 1960 → 67; 1954 → 66.
- **Regression guard for §1.6:** assert WEP/GPO are not applied (benefit for a short-career public
  worker equals the un-WEP'd formula result).

### Healthcare / Medicare / ACA (`healthcare-cost.ts`, `healthcare-data.ts`)
- **Medigap OOP (locks §2.1 once fixed):** Original Medicare + Medigap Plan G, moderate usage → annual
  medical OOP ≤ ~$300/person (Part B deductible band), **not** $1,800. This test fails on today's
  code — exactly the drift detector wanted.
- **IRMAA tiers (locks §2.2):** MAGI $200,000 single → tier index 3 (2.0×), Part B `$405.80`, Part D
  surcharge `$37.50`; MAGI $100,000 single → tier 0, no surcharge.
- **ACA PTC ≥150% (locks §2.4):** HH 1, MAGI $40,000, benchmark $7,000/yr → PTC `$3,556`
  (applicable% 8.61%); MAGI at 401% FPL → PTC `$0` (cliff).
- **ACA PTC <150% (locks §2.5 once fixed):** HH 1, MAGI $22,000 (140.6% FPL) → applicable% ≈ 3.61%,
  not 2.10%.
- **CSR (locks §2.6 once fixed):** 175% FPL silver → OOP max `$3,500`, not $8,500.
- **Constants guard:** assert Part B `202.9`, deductible `283`, ACA OOP `10600/21200`, applicable-%
  nodes, FPL base `15650`/`+5500`.

### Mortgage (`calculateMortgage`)
- **Payment (locks §3.1):** $500,000 / 6.5% / 30 yr → P&I `$3,160.34` (±$0.50); zero-rate $360,000 /
  0% / 30 yr → `$1,000.00`.
- **PMI cancellation (locks §3.2 once fixed):** $400,000 value, $360,000 loan, PMI 0.5% → PMI line is
  $0 once the balance reaches $320,000 (80% of value), and provably nonzero at a $330,000 balance.

### Investment (`calculateInvestment`)
- **FV (locks §4.1):** $100,000 + $2,000/mo, 7%, 15 yr → ending `$918,8xx` (pin to the computed value
  ±$5); assert `totalContributions = 100000 + 2000×180`.
- **Fee sensitivity (locks §4.3 once added):** same inputs at 6.5% net → ending balance ≈ 7-8% lower
  than at 7%.

### FIRE engines
- **Inflation consistency (locks §5.2):** in `evaluateWithdrawalRateCandidate`, a plan with flat real
  spending must show year-30 **nominal** spending ≈ 2.4× year-0 at 3% inflation; assert the projected
  withdrawal grows, not stays flat. (Fails on current code.)
- **Phase-1 reference (locks §5.1):** known inputs → known earliest-FIRE-age; SS income stream
  starting at 67 reduces the portfolio draw by exactly the benefit amount that year.
- **Simple FIRE number (locks §5.3):** `calculateSimpleFireNumber(60000, 12000, 0.04)` → `$1,200,000`;
  assert the **default** rate equals the app's headline rule (4%).

### Cross-cutting
- **Tax gross-up (locks §6.1):** gap $40,000 at 15% effective → gross `$47,058.82`; and a 0%-rate case
  returns the gap unchanged. Add a documentation test asserting the mode is labeled "simple/effective,"
  not "marginal."

> **Why this works.** Each test cites a number a regulator published (an SSA PIA example, a CMS
> premium, an IRS applicable %, a CFPB cancellation threshold). If a future edit changes a constant or
> a formula, the test breaks with a message pointing at the rule and the source — turning a silent
> drift into a loud, sourced CI failure. That is the durable guardrail.

---

*End of audit. No application code was modified. Constants and rules verified against SSA, IRS, CMS/
Medicare, healthcare.gov, CFPB, and KFF, June 2026; ACA/Medicaid figures cross-checked against
`docs/product-strategy/HEALTHCARE_2026_DATA.md`.*
