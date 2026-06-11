# Changelog

All notable changes to the Freedom Path planner are recorded here. Dates use `YYYY-MM-DD`.

## 2026-06-11 — Review-cycle changes

A pass focused on making the FIRE calculators consistent and clear, adding a self-service healthcare estimate, a mortgage fees toggle, and a Contact page. Highlights below are grouped by area.

### A) Calculation & label consistency (FIRE strategies)

- **Primary home no longer counts as a FIRE asset by default.** Real estate is not liquid money you can draw on, so a home is now excluded from your spendable FIRE total unless you deliberately plan a home sale. New assets of type "home" default to *not* included, and even if one is manually flagged it is still kept out of the FIRE total by a hard guard. If you plan to sell, the proceeds are added separately via the "Future home sale" fields.
  *(`src/lib/phase1/portfolio.ts` — `getDefaultIncludedInFire("home") === false`, `countsTowardFireAssets` guard; `src/components/planning/fire-strategy-panel.tsx`)*

- **Three matching on-screen notes about the home exclusion.** The "Current FIRE assets" field now explains the rule in its tooltip, in the inline helper text beneath the input, and again in the "Future home sale (optional)" section — so the behavior is never a surprise.
  *(`src/components/planning/fire-strategy-panel.tsx`)*

- **Documentation reconciled.** The spec docs previously gave conflicting guidance on whether a home counts. Both now state the same rule, matching the code.
  *(`ARCHITECTURE.md`, `PRD.md`)*

- **Projection-table headers now match each FIRE strategy.** Each mode labels its columns in its own terms instead of sharing generic headings, with a short "How returns are treated here" note above the table. For example, Portfolio Drawdown shows "Investment return (total)", while Principal-Preserving splits growth into "Appreciation (unspent)" and "Cash yield". This removes the earlier confusion about whether returns were being double-counted.
  *(`src/components/planning/fire-strategy-panel.tsx`)*

- **The two return inputs were renamed and explained.** "Price appreciation (kept)" is the price growth you don't spend; "Cash yield (spendable)" is the dividends/interest you can live on after FIRE. An inline explainer reminds you that total return = appreciation you keep + yield you can spend, with a worked example (10% total − 3% yield → enter 7% appreciation).
  *(`src/components/planning/fire-strategy-panel.tsx`)*

- **New "Progress to FIRE" meter for Principal-Preserving.** The old "coverage" bar was replaced with a clearer meter showing your current FIRE assets as a percentage of the principal floor this strategy needs — 100% means you could retire under this strategy today.
  *(`src/components/planning/fire-strategy-panel.tsx`)*

- **Pre-FIRE cash yield is now shown, not hidden.** The Principal-Preserving projection table gives cash yield its own column in every year. Before FIRE the yield is reinvested (and labeled as such in the header and audit notes) instead of showing $0, so the growth math is transparent.
  *(`src/components/planning/fire-strategy-panel.tsx`, `src/lib/phase1/fire.ts`)*

### B) Healthcare calculator

- **Bronze / Silver / Gold plan-tier picker.** Pick a metal tier and the calculator auto-fills a typical premium, deductible, and out-of-pocket maximum for that tier — no manual lookups required. (Bronze ≈ 80% of the benchmark premium with a higher deductible; Silver ≈ the benchmark; Gold ≈ 120% with a lower deductible.)
  *(`src/components/planning/healthcare-cost-panel.tsx`, `src/lib/calculations/healthcare-data.ts`)*

- **Built-in benchmark-premium estimate ("estimate vs exact" mode).** In the default *Estimate* mode the tool derives your benchmark (second-lowest-cost silver) premium internally from your age (a standard age curve), a national base premium, and an area cost band (lower / average / higher) — so you don't have to look anything up. Switch to *Exact* mode to type real quotes from healthcare.gov.
  *(`src/components/planning/healthcare-cost-panel.tsx`, `src/lib/calculations/healthcare-data.ts`)*

- **Rewritten tooltips and a subsidy explainer.** Plain-English help text throughout, plus an FAQ explaining how the pre-65 ACA premium tax credit is figured (benchmark premium minus your required contribution from the 2026 applicable-percentage table) and how Medicare IRMAA surcharges work.
  *(`src/components/planning/healthcare-cost-panel.tsx`)*

- **Data sources.** The healthcare constants are built from public 2026 figures: KFF marketplace benchmark-premium and metal-tier analyses, the CMS Default Standardized Age Curve, CMS 2026 Medicare Part B premium/deductible figures, and Rev. Proc. 2025-25 for the ACA applicable-percentage table. These are planning estimates, not quotes.
  *(`src/lib/calculations/healthcare-data.ts`)*

### C) Mortgage calculator

- **"Include taxes, insurance & fees" toggle.** A checkbox lets you exclude property tax, home insurance, PMI, and HOA from the monthly payment so you can see principal & interest only. Turning it off keeps your typed values — they come back when you re-enable it, rather than being wiped to zero.
  *(`src/components/planning/planning-tool-panel.tsx`)*

- **Loan-type and field tooltips.** Added info popovers (loan type, loan amount, PMI, insurance, and more) explaining each field in everyday terms.
  *(`src/components/planning/planning-tool-panel.tsx`)*

### D) New Contact page

- **`/contact` route with a feedback form.** A simple page for the owner to collect feedback and suggestions. Name and email are required; phone is optional (and only validated if filled in); a message is required.
  *(`src/app/contact/page.tsx`, `src/components/contact/contact-form.tsx`)*

- **How submissions are handled.** Valid messages are saved to a Supabase `feedback_messages` table (name, email, optional phone, message). If the feedback service isn't configured, the form shows a friendly fallback asking the visitor to email `zhchong0623@gmail.com` directly, and a thank-you confirmation appears on success.
  *(`src/components/contact/contact-form.tsx`)*
