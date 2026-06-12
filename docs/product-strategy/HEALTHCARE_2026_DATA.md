# U.S. Pre-65 Health Insurance Affordability — 2026 Reference Data

*Created: 2026-06-12 · Last updated: 2026-06-12*

> **Scope.** Reference data for modeling pre-Medicare (under-65) health insurance costs
> in the household FIRE / healthcare calculator. Covers ACA Marketplace premium tax
> credits (PTC), Cost-Sharing Reductions (CSR), out-of-pocket maximums, and Medicaid
> for plan/coverage **year 2026**. This is a research/reference document — **no
> calculator code is changed here.**
>
> **FPL year note.** ACA eligibility for **coverage year 2026** is based on the **2025**
> HHS federal poverty guidelines (the prior calendar year's guidelines always apply).
> All FPL dollar figures below are 2025 guidelines unless stated.

---

## 0. Headline answer — did the enhanced subsidies survive into 2026?

**They LAPSED.** The American Rescue Plan (2021) / Inflation Reduction Act (2022)
*enhanced* premium tax credits **expired December 31, 2025** and were **not extended**
for plan year 2026. Consequences for 2026:

- **The 400% FPL "subsidy cliff" is BACK.** Households with MAGI **above 400% FPL get
  $0 premium tax credit** in 2026 and pay full sticker price. From 2021–2025 there was
  no upper income limit and the benchmark premium was capped at 8.5% of income for
  everyone; that cap is gone.
- **Required contribution percentages reverted upward** to the pre-ARPA (indexed)
  schedule — e.g. the lowest band is **2.10%** (was **0%** under the enhancements) and
  the 300–400% band is **9.96%** (was **8.5%**). See §2.
- Average marketplace premium *payments* are estimated to rise ~**114%** (~$1,016/yr)
  for subsidized enrollees, and ~4 million people are projected to become uninsured.
  ([KFF calculator](https://www.kff.org/interactive/calculator-aca-enhanced-premium-tax-credit/),
  [Thomson Reuters](https://tax.thomsonreuters.com/news/estimated-impact-of-aca-premium-tax-credit-expiration/))

**Legislative status (as of June 2026 — flag as fluid):** A standalone extension
(the *Lower Health Care Costs Act*, S. 3385, a 3-year extension) **failed to reach 60
votes in the Senate**; a House-passed extension stalled. As of this writing the
enhancements remain expired and 2026 is being administered under the reverted rules. A
retroactive extension later in 2026 is **politically possible but not enacted** — model
2026 as "lapsed" by default and treat any extension as an upside scenario.

**Dated sources for the lapse:**
- healthinsurance.org, *"Marketplace enrollees face return of the 'subsidy cliff' in 2026"* — **updated Feb 11, 2026**: "Congress has not extended enhanced Marketplace subsidies… enrollees are now experiencing the return of the so-called 'subsidy cliff.'" ([link](https://www.healthinsurance.org/blog/subsidy-cliff-will-return-in-2026-if-congress-doesnt-act/))
- CNBC, *"As federal ACA subsidies lapse, blue states offer their own"* — **Jan 23, 2026**. ([link](https://www.cnbc.com/2026/01/23/aca-subsidies-state-premium-tax-credits.html))
- KFF, *"State-Based Efforts Will Provide Limited Relief…"* — **Jan 9, 2026**. ([link](https://www.kff.org/affordable-care-act/state-based-efforts-will-provide-limited-relief-from-enhanced-tax-credit-expiration/))
- Congressional Research Service, *Enhanced Premium Tax Credit and 2026 Exchange Premiums: FAQ*, **R48290**. ([link](https://www.congress.gov/crs-product/R48290))
- ASTHO, *ACA Enhanced PTC: Legislative Developments in 2025 and 2026* (2026). ([link](https://www.astho.org/communications/blog/2026/aca-enhanced-premium-tax-credits-legislative-developments-2025-2026/))

---

## 1. Summary table — the numbers we model (2026)

| Item | 2026 figure | FPL basis | Source / status |
|---|---|---|---|
| FPL, household of 1 (100%) | **$15,650** | 2025 guidelines | ASPE — **final** |
| FPL, household of 2 (100%) | **$21,150** | 2025 guidelines | ASPE — **final** |
| 138% FPL (Medicaid expansion), HH 1 | **$21,597** | 2025 | CBPP/Beyond the Basics — **final** |
| 138% FPL, HH 2 | **$29,187** | 2025 | CBPP/BTB — **final** |
| 400% FPL (subsidy cliff), HH 1 | **$62,600** | 2025 | CBPP/BTB — **final** |
| 400% FPL (subsidy cliff), HH 2 | **$84,600** | 2025 | CBPP/BTB — **final** |
| Enhanced subsidies status | **LAPSED** (>400% = $0 PTC) | — | Multiple, dated (§0) — **final/fluid** |
| Lowest contribution % (<133% FPL) | **2.10%** | — | Rev. Proc. 2025-25 — **final** |
| Highest contribution % (300–400% FPL) | **9.96%** | — | Rev. Proc. 2025-25 — **final** |
| Standard OOP max (self / family) | **$10,600 / $21,200** | — | CMS NBPP 2026 — **final** |
| CSR Silver 94% AV OOP max (≤150% FPL) | **$3,500 / $7,000** | — | Fed. Register 2025-11606 — **final** |
| CSR Silver 87% AV OOP max (151–200%) | **$3,500 / $7,000** | — | Fed. Register 2025-11606 — **final** |
| CSR Silver 73% AV OOP max (201–250%) | **$8,450 / $16,900** | — | Fed. Register 2025-11606 — **final** |
| Medicaid premium (expansion adults) | **~$0** | <138% FPL | 42 CFR 447 — **final** |
| Medicaid cost-sharing aggregate cap | **≤5% of family income** | — | 42 CFR 447.56 — **final** |

---

## 2. Federal Poverty Level (FPL) guidelines for 2026 coverage

**2025 HHS poverty guidelines (48 contiguous states + DC)** — these govern 2026 ACA
eligibility. Base = $15,650 (HH of 1); add **$5,500** per additional person.
(Alaska and Hawaii have separate, higher guidelines — see ASPE.)

| Household | 100% | 138%¹ | 150% | 200% | 250% | 300% | 400%² |
|---|---|---|---|---|---|---|---|
| **1** | $15,650 | $21,597 | $23,475 | $31,300 | $39,125 | $46,950 | **$62,600** |
| **2** | $21,150 | $29,187 | $31,725 | $42,300 | $52,875 | $63,450 | **$84,600** |
| **3** | $26,650 | $36,777 | $39,975 | $53,300 | $66,625 | $79,950 | $106,600 |
| **4** | $32,150 | $44,367 | $48,225 | $64,300 | $80,375 | $96,450 | $128,600 |
| +1 person | +$5,500 | +$7,590 | +$8,250 | +$11,000 | +$13,750 | +$16,500 | +$22,000 |

¹ **138% FPL** = Medicaid expansion adult eligibility ceiling (expansion states).
² **400% FPL** = the **subsidy cliff** — above this, **no PTC in 2026** (enhancements lapsed).

Key bands the calculator cares about:
- **< 138% FPL** → Medicaid (in expansion states); see §5.
- **100–250% FPL** → eligible for **CSR** (silver plans only); see §3.
- **100–400% FPL** → eligible for **PTC**; see below.
- **> 400% FPL** → **full price** in 2026 (no PTC).

Sources: [HHS ASPE 2025 Poverty Guidelines](https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines)
([detailed PDF](https://aspe.hhs.gov/sites/default/files/documents/dd73d4f00d8a819d10b2fdb70d254f7b/detailed-guidelines-2025.pdf));
[Federal Register, Jan 17 2025](https://www.federalregister.gov/documents/2025/01/17/2025-01377/annual-update-of-the-hhs-poverty-guidelines);
percentage columns from [CBPP/Beyond the Basics CY2026 Reference Guide (PDF)](https://www.healthreformbeyondthebasics.org/wp-content/uploads/2024/08/REFERENCE_YearlyGuidelines_CY2026-rev.pdf).

---

## 3. ACA Premium Tax Credit (subsidy) — 2026

### 3a. Required (expected) contribution percentages — Coverage Year 2026

These are the share of income a household is *expected* to pay toward the **benchmark
(second-lowest-cost Silver)** plan. The PTC = (benchmark premium) − (expected
contribution). Because the enhancements lapsed, 2026 uses the **reverted, indexed**
schedule (set by IRS Rev. Proc. 2025-25 / the 2026 Marketplace Integrity rule):

| Household income (% FPL) | Expected contribution (% of income), **2026** | (For contrast: 2021–2025 enhanced) |
|---|---|---|
| < 133% | **2.10%** | 0% |
| 133% | **3.14%** | 0% |
| 138% | **3.45%** | ~0% |
| 150% | **4.19%** | 0% |
| 200% | **6.60%** | 2% |
| 250% | **8.44%** | 4% |
| 300% | **9.96%** | 6% |
| 300–400% | **9.96%** (flat) | 8.5% |
| **> 400%** | **Ineligible for PTC** (cliff) | 8.5% (no cliff) |

> Within a band the percentage is interpolated linearly with income (e.g. 175% FPL sits
> between the 150% and 200% rows). The **9.96%** top figure is the same value the IRS set
> as the 2026 employer-coverage "required contribution percentage" (affordability test).

### 3b. How the subsidy reduces the premium (worked logic)

```
benchmark_premium        = price of 2nd-lowest-cost Silver plan for the household (age-rated)
expected_contribution    = household_MAGI × applicable_percentage(income_as_%FPL)
PTC (subsidy)            = max(0, benchmark_premium − expected_contribution)
net_premium(chosen_plan) = max(0, chosen_plan_premium − PTC)
```

- The PTC is a **fixed dollar amount** tied to the benchmark plan; a household can apply
  it to **any** metal-tier plan. Buy cheaper than benchmark → pay less (possibly $0);
  buy richer → pay the difference.
- **2026 cliff behavior:** if income > 400% FPL, `PTC = 0` → `net_premium = full
  chosen_plan_premium`. This is the single most important 2026 change to model. The cliff
  is brutal for **older** enrollees (age-rated premiums up to 3× younger adults): a
  60-something couple at ~402% FPL can jump from ~8.5% of income to **20–25%+ of income**
  overnight. ([Bipartisan Policy Center](https://bipartisanpolicy.org/issue-brief/enhanced-premium-tax-credits-who-benefits-how-much-and-what-happens-next/),
  [AJMC](https://www.ajmc.com/view/faqs-about-expiration-of-enhanced-subsidies-under-the-affordable-care-act))

### 3c. Excess APTC repayment caps (2026)

If advance PTC is overpaid (income ends up higher than estimated), repayment is capped
**only below 400% FPL** — above 400% there is **no cap** (must repay all excess):

| Income (% FPL) | Repayment cap (single / other) |
|---|---|
| < 200% | $375 / $750 |
| 200–299% | $975 / $1,950 |
| 300–399% | $1,625 / $3,250 |
| ≥ 400% | **None (full repayment)** |

Sources: [IRS Rev. Proc. 2025-25 (PDF)](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf);
[IRB 2025-32](https://www.irs.gov/irb/2025-32_IRB);
[Current Federal Tax Developments analysis](https://www.currentfederaltaxdevelopments.com/blog/2025/7/18/rev-proc-2025-25-a-technical-review-of-2026-premium-tax-credit-and-affordability-adjustments);
[CBPP/BTB CY2026 Reference Guide](https://www.healthreformbeyondthebasics.org/wp-content/uploads/2024/08/REFERENCE_YearlyGuidelines_CY2026-rev.pdf).

---

## 4. Cost-Sharing Reductions (CSR) — 2026

**What CSR is:** for enrollees **100–250% FPL** who pick a **Silver** plan, insurers must
auto-enroll them into a *Silver variant* with a higher actuarial value (AV) → lower
deductibles, copays, coinsurance, **and a reduced out-of-pocket maximum**. CSR is
**Silver-only**, is **not** a tax credit, and is **never reconciled** at tax time.

| CSR tier | Income band (FPL) | Silver AV | **OOP max (self / family), 2026** | Standard Silver for contrast |
|---|---|---|---|---|
| **CSR 94%** | 100–150% | 94% AV | **$3,500 / $7,000** | (standard 70% AV) |
| **CSR 87%** | >150–200% | 87% AV | **$3,500 / $7,000** | |
| **CSR 73%** | >200–250% | 73% AV | **$8,450 / $16,900** | |
| Standard Silver (no CSR) | >250% | 70% AV | $10,600 / $21,200 | = standard OOP max (§4 below / §1) |

> Note the 94% and 87% tiers share the **same** reduced OOP max ($3,500/$7,000) for 2026;
> the AV difference is delivered mainly through lower deductibles/copays. The 73% tier's
> OOP reduction is modest vs. standard. The deductible/copay specifics vary by insurer and
> state, but the OOP-max figures above are federally set.
>
> **Native Americans/Alaska Natives** (≤300% FPL) get zero/limited cost-sharing CSR
> variants — a special case we can flag but need not model precisely.

Sources: reduced OOP maxes from the **2026 Notice of Benefit and Payment Parameters /
"Marketplace Integrity and Affordability" final rule**,
[Federal Register 2025-11606 (Jun 25, 2025)](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability),
as compiled in the [CBPP/BTB CY2026 Reference Guide (PDF)](https://www.healthreformbeyondthebasics.org/wp-content/uploads/2024/08/REFERENCE_YearlyGuidelines_CY2026-rev.pdf);
mechanics from [CBPP/BTB CSR FAQ](https://www.healthreformbeyondthebasics.org/cost-sharing-charges-in-marketplace-health-insurance-plans-part-2/)
and [KFF CSR FAQ](https://www.kff.org/faqs/faqs-health-insurance-marketplace-and-the-aca/help-paying-marketplace-premiums-the-basics/how-much-are-the-cost-sharing-subsidies/).

---

## 4b. Standard 2026 ACA out-of-pocket maximum (non-CSR)

For all non-grandfathered plans (any metal tier) the 2026 **maximum annual limitation on
cost sharing** is:

- **Self-only: $10,600**
- **Family: $21,200**

> Wrinkle worth a footnote: the Biden administration initially finalized lower 2026 caps
> ($10,150 / $20,300); the subsequent **2026 Marketplace Integrity & Affordability final
> rule** raised them to **$10,600 / $21,200**. Use the higher, currently-effective figures.

Sources: [CMS 2026 NBPP / final rule, Fed. Register 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability);
summaries: [Wagner Law Group](https://www.wagnerlawgroup.com/blog/2024/10/2026-aca-out-of-pocket-limits/),
[WTW (revised 2026 limits)](https://www.wtwco.com/en-us/insights/2025/07/cms-releases-revised-2026-out-of-pocket-expense-limits),
[healthinsurance.org glossary](https://www.healthinsurance.org/glossary/out-of-pocket-maximum/).

---

## 5. Medicaid (expansion adults, < 138% FPL) — 2026

- **Premium: ~$0.** Expansion adults pay **no monthly premium**. (Federal law bars
  premiums below 150% FPL.)
- **Cost-sharing is minimal and capped:** total premiums + cost sharing for the household
  **cannot exceed 5% of family income**, measured monthly or quarterly (the
  "**5% aggregate cap**"). Once hit, no further charges for the period.
  ([42 CFR 447.56](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-447/subpart-A/subject-group-ECFRa3c17d28ea07411),
  [Medicaid.gov cost sharing](https://www.medicaid.gov/medicaid/cost-sharing/cost-sharing-out-pocket-costs))
- **Nominal copays:** for enrollees **≤100% FPL**, cost sharing is limited to *nominal*
  amounts (historically ~$4 outpatient / small ER and Rx copays, indexed). States *may*
  charge somewhat higher amounts for those **>100% FPL**.
- **Medicaid enrollees do NOT pay the ACA OOP max.** The $10,600/$21,200 ACA limit does
  **not** apply to Medicaid; the **5%-of-income cap** is the binding protection, and it is
  far lower for low-income households. Model Medicaid out-of-pocket exposure as
  `min(actual cost sharing, 5% × income)`, effectively near-zero.
- **Exemptions from cost sharing** (services/groups, federal floor): primary care, mental
  health & SUD treatment, family planning, **emergency care in a hospital ER**, and
  institutional long-term care are exempt; **children, pregnant women, terminally ill, and
  institutionalized individuals** are exempt groups; preventive services for children are
  exempt. ([KFF Medicaid cost sharing](https://www.kff.org/medicaid/understanding-medicaid-cost-sharing-and-policy-changes-from-the-2025-reconciliation-law/))

> **Coming change to flag (not 2026):** the 2025 reconciliation law ("One Big Beautiful
> Bill") will **require** states to impose cost sharing up to **$35 per service** on
> **expansion adults 100–138% FPL**, effective **Oct 1, 2028** (with the exemptions above
> preserved and Rx limited to nominal amounts). Not in effect for 2026, but relevant for
> long-horizon FIRE projections. ([KFF](https://www.kff.org/medicaid/understanding-medicaid-cost-sharing-and-policy-changes-from-the-2025-reconciliation-law/),
> [Crowell & Moring](https://www.crowell.com/en/insights/client-alerts/president-trumps-one-big-beautiful-bill-makes-changes-to-medicaid))

---

## 6. State variation caveats (model/disclaim accordingly)

1. **Medicaid expansion vs. not.** As of 2026, **41 states + DC have expanded** Medicaid
   (adults to 138% FPL); **10 states have not**. In **non-expansion** states there is a
   **"coverage gap"**: adults below 100% FPL typically get **neither Medicaid nor PTC**
   (PTC starts at 100% FPL), so a low-income user in a non-expansion state may have **no
   affordable option**. The calculator must therefore ask for (or assume) expansion
   status. ([KFF expansion tracker](https://www.kff.org/medicaid/status-of-state-medicaid-expansion-decisions/))
2. **Non-expansion states (10):** primarily in the South (e.g. TX, FL, GA, AL, MS, SC, TN,
   plus a few others) — verify the live list against the KFF tracker before shipping
   state-specific copy.
3. **State-funded premium subsidies layered on top (post-lapse).** A handful of
   state-based marketplaces added their **own** subsidies for 2026 to blunt the cliff —
   e.g. **New Mexico** (backfills to 400% FPL, caps at 8.5% above), **Maryland** (full
   replacement <200% FPL, partial to 400%), **California** (full ≤150%, partial 150–165%),
   **Colorado** (~$80/mo per adult, 100–400%), **Washington** (Cascade Care Savings).
   These cover only a small fraction of the lost federal support and mostly **exclude
   >400% FPL**. Treat as state-specific overrides, not the national default.
   ([KFF Jan 9 2026](https://www.kff.org/affordable-care-act/state-based-efforts-will-provide-limited-relief-from-enhanced-tax-credit-expiration/),
   [CNBC Jan 23 2026](https://www.cnbc.com/2026/01/23/aca-subsidies-state-premium-tax-credits.html))
4. **Premiums themselves vary enormously** by state, rating area, age, and tobacco use —
   the calculator should treat the benchmark premium as a user input or a regional
   estimate, not a single national number.

---

## 7. Figures not yet finalized / uncertain (clearly labeled)

| Item | Status | Best current basis |
|---|---|---|
| **Enhanced-subsidy extension** | **Fluid** — expired & not extended as of Jun 2026; a retroactive 2026 extension remains politically possible but **not enacted** | Model "lapsed" as default; treat extension as an upside toggle |
| 2026 FPL guidelines (2025 dollars) | **Final** | ASPE published Jan 2025 |
| 2026 contribution % schedule | **Final** | IRS Rev. Proc. 2025-25 |
| 2026 standard OOP max ($10,600/$21,200) | **Final** (raised from earlier $10,150/$20,300) | 2026 NBPP final rule |
| 2026 CSR OOP maxes | **Final** | Fed. Register 2025-11606 |
| Medicaid $35 expansion cost-sharing | **Future** (effective **Oct 1, 2028**), not 2026 | 2025 reconciliation law |
| Live non-expansion state list | **Stable but verify** | KFF tracker (re-check before publish) |
| State supplemental subsidies | **Evolving** | KFF/CNBC Jan 2026 (states may add/adjust mid-year) |

Everything tagged **Final** above is published and citable for current-year (2026) SEO
content. The only genuinely moving piece is whether Congress revives the enhancements.

---

## 8. UX recommendation — "scenario navigation" for healthcare cost

Goal: let a user enter a few facts and instantly compare **Medicaid vs. subsidized-ACA
vs. full-price ACA**, then explore how crossing a threshold changes their cost. This maps
naturally onto the FPL bands above.

### Inputs to collect
| Input | Why | Default if skipped |
|---|---|---|
| **Household size** | Drives the FPL dollar thresholds | 1 |
| **Annual income (MAGI)** | Determines band: Medicaid / CSR / PTC / cliff | required |
| **Age(s) of covered adults** | Premiums are age-rated up to 3×; central to the cliff's bite | required (or 1 adult) |
| **State or "expansion state?" toggle** | Medicaid eligibility + coverage gap + state subsidies | "expansion = yes" |
| **Benchmark Silver premium (or regional estimate)** | Needed to compute PTC and net premium | regional/age estimate |
| *(optional)* tobacco use | Surcharge | no |

### Per-scenario outputs
For each of the three scenarios, show:
- **Eligibility verdict** (e.g. "At 120% FPL in an expansion state → **Medicaid**").
- **Premium after subsidy** (`net_premium`; $0 for Medicaid; full price above 400%).
- **OOP maximum** (Medicaid → effectively 5%-of-income cap, near $0; CSR tier OOP; or
  standard $10,600/$21,200).
- **Estimated total annual exposure** = `12 × net_premium + OOP_max` (worst-case), plus an
  "expected" mid estimate if we model utilization.
- **CSR tier badge** when applicable (94/87/73% AV).

### Scenario-navigation behavior
- **Auto-select** the scenario the entered income lands in, but let the user **toggle
  between all three** to see "what if my income were lower/higher."
- **Show the cliff explicitly:** a slider or marker at **400% FPL** ($62,600 single /
  $84,600 for 2 in 2026) where the subsidy drops to $0 — this is the single most
  decision-relevant number for FIRE planners managing MAGI (e.g. Roth conversions, cap-gain
  harvesting). Pair with the **138%** (Medicaid) and **250%** (CSR end) markers.
- **MAGI-management callout:** because FIRE users can often *control* MAGI, highlight that
  staying just under 400% (or under 250% for CSR, or under 138% for Medicaid in expansion
  states) can save thousands — the cliff makes the marginal dollar above 400% extremely
  expensive in 2026.
- **State caveat banner:** if non-expansion state, warn about the **coverage gap** below
  100% FPL; if a state with its own subsidy, note the figures may be more generous than the
  federal default.

---

## Source index

- HHS ASPE — [2025 Poverty Guidelines](https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines) · [detailed PDF](https://aspe.hhs.gov/sites/default/files/documents/dd73d4f00d8a819d10b2fdb70d254f7b/detailed-guidelines-2025.pdf) · [Federal Register Jan 17 2025](https://www.federalregister.gov/documents/2025/01/17/2025-01377/annual-update-of-the-hhs-poverty-guidelines)
- IRS — [Rev. Proc. 2025-25 (PDF)](https://www.irs.gov/pub/irs-drop/rp-25-25.pdf) · [IRB 2025-32](https://www.irs.gov/irb/2025-32_IRB)
- CMS / HHS — [2026 Marketplace Integrity & Affordability final rule, Fed. Register 2025-11606](https://www.federalregister.gov/documents/2025/06/25/2025-11606/patient-protection-and-affordable-care-act-marketplace-integrity-and-affordability)
- CBPP / Beyond the Basics — [CY2026 Yearly Reference Guide (PDF)](https://www.healthreformbeyondthebasics.org/wp-content/uploads/2024/08/REFERENCE_YearlyGuidelines_CY2026-rev.pdf) · [CSR FAQ](https://www.healthreformbeyondthebasics.org/cost-sharing-charges-in-marketplace-health-insurance-plans-part-2/)
- KFF — [Enhanced PTC calculator](https://www.kff.org/interactive/calculator-aca-enhanced-premium-tax-credit/) · [State-based relief (Jan 9 2026)](https://www.kff.org/affordable-care-act/state-based-efforts-will-provide-limited-relief-from-enhanced-tax-credit-expiration/) · [Medicaid cost sharing & 2025 reconciliation](https://www.kff.org/medicaid/understanding-medicaid-cost-sharing-and-policy-changes-from-the-2025-reconciliation-law/) · [Expansion tracker](https://www.kff.org/medicaid/status-of-state-medicaid-expansion-decisions/) · [CSR FAQ](https://www.kff.org/faqs/faqs-health-insurance-marketplace-and-the-aca/help-paying-marketplace-premiums-the-basics/how-much-are-the-cost-sharing-subsidies/)
- Congressional Research Service — [R48290: Enhanced PTC & 2026 Exchange Premiums FAQ](https://www.congress.gov/crs-product/R48290)
- Medicaid.gov — [Cost sharing / out-of-pocket costs](https://www.medicaid.gov/medicaid/cost-sharing/cost-sharing-out-pocket-costs) · [42 CFR 447 Subpart A](https://www.ecfr.gov/current/title-42/chapter-IV/subchapter-C/part-447/subpart-A/subject-group-ECFRa3c17d28ea07411)
- News/analysis (dated lapse confirmation) — [healthinsurance.org subsidy cliff (Feb 11 2026)](https://www.healthinsurance.org/blog/subsidy-cliff-will-return-in-2026-if-congress-doesnt-act/) · [CNBC (Jan 23 2026)](https://www.cnbc.com/2026/01/23/aca-subsidies-state-premium-tax-credits.html) · [Bipartisan Policy Center](https://bipartisanpolicy.org/issue-brief/enhanced-premium-tax-credits-who-benefits-how-much-and-what-happens-next/) · [AJMC FAQ](https://www.ajmc.com/view/faqs-about-expiration-of-enhanced-subsidies-under-the-affordable-care-act)
