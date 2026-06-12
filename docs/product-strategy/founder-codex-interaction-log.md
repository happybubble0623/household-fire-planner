# Household FIRE Planner Founder / Codex Interaction Log

*Created: 2026-06-08 · Last updated: 2026-06-12*

Status: Living product-thinking record

Purpose: Document the founder's product thinking, challenges to Codex, additional context, feature proposals, and strategic decisions. This file is intended to show that Household FIRE Planner is founder-directed, not simply AI-directed.

Update rule: Add new entries whenever the founder corrects Codex, challenges an assumption, changes scope, proposes a feature, adds customer insight, or makes a product strategy decision.

## Summary Of Founder Direction

The founder has repeatedly guided Codex away from generic app-building and toward a specific product thesis:

```text
Household FIRE Planner should help multi-account FIRE households understand their current household portfolio, what counts toward FIRE, how account/tax-bucket structure affects planning, and how that current picture connects to FIRE timing.
```

The founder's major inputs include:

- Keep Phase 1 simple and focused.
- Do not overbuild account/cloud features before the local workflow works.
- Use current portfolio only in Phase 1; historical records are later.
- Make Path to FIRE first, but use portfolio clarity as the trust foundation.
- Treat account structure as a first-class product concept.
- Make the product a bridge between current net-worth/allocation clarity and FIRE timing.
- Prioritize multi-account household pain over a generic FIRE calculator.
- Document future enhancements without bloating Phase 1.

## Interaction Timeline

### 1. Initial Build Direction

Founder direction:

- Use the Household FIRE Planner folder as the working directory.
- Read the PRD before developing.
- Build the full MVP website end-to-end.
- Ask clarifying questions when needed rather than guessing.

Product thinking shown:

- The founder started from a PRD-driven process, not a blank UI prompt.
- The founder expected Codex to respect product requirements and clarify ambiguity.

### 2. UI Simplicity Constraint

Founder direction:

- The website UI should be simple.
- It should not have too many tabs.

Product thinking shown:

- The founder rejected unnecessary navigation complexity.
- This later led to a narrower Phase 1 structure with only two main tabs.

### 3. Challenge: Static UI Was Not Enough

Founder challenge:

- The founder observed that the created app felt like a static layout and that features did not really work.

Product thinking shown:

- The founder evaluated the product by actual functionality, not appearance.
- This redirected work from visual layout toward real product behavior.

### 4. Request To Rework The PRD

Founder direction:

- Step back and review the PRD.
- List all key features and functionality the site serves.

Product thinking shown:

- The founder recognized that the implementation and PRD were misaligned.
- This created the need to distinguish original PRD scope from Phase 1 scope.

### 5. Cloud Sync / Supabase Scope Challenge

Founder questions and decisions:

- Asked what Supabase sync and EOD market fetching meant.
- Asked which Supabase keys were needed.
- Asked how to make sure RLS policies were set before real data went in.
- Later decided current IndexedDB autosave works for now.
- Chose to remove account options from Phase 1 and document Supabase for future enhancement.

Product thinking shown:

- The founder understood cloud sync adds complexity and trust/security risk.
- The founder chose local-first Phase 1 to reduce scope and risk.
- The founder still wanted future enhancement documented.

### 6. Market Data Direction

Founder direction:

- Portfolio includes around 80 stocks.
- Holdings are U.S.-listed and include mutual funds, crypto, and initially options.
- EOD refresh is a must.
- No manual import as the primary workflow, but manual import can be a fallback when EOD refresh is unavailable.
- Refresh should not happen automatically.
- User should click a button to retrieve EOD price to control cost.
- Asked for cheaper API or MCP options.
- Asked whether EODHD is unlimited.
- Chose EODHD setup.
- Later made option trading price optional and then removed options from Phase 1 while documenting them for future enhancement.

Product thinking shown:

- The founder balanced usefulness, cost control, API limits, and market-data complexity.
- The founder identified manual refresh as a product requirement, not just an implementation detail.
- The founder reduced Phase 1 complexity by deferring options.

### 7. Phase 1 Scope Reset

Founder direction:

- For Phase 1, no account option.
- Document current Supabase setup for future enhancement.
- No landing page in Phase 1.
- Keep the UI and site structure as simple as possible.
- Top navigation should have only Path to FIRE and Understand Portfolio.
- Path to FIRE should come first.
- Understand Portfolio can connect to Path to FIRE when users want more accuracy.

Product thinking shown:

- The founder intentionally narrowed the product to a focused first usable version.
- The founder prioritized workflow logic: users should first understand the FIRE path, then improve accuracy with portfolio data.

### 8. Portfolio Data Model Direction

Founder direction:

- Phase 1 should use only the latest/current portfolio.
- Historical dated records are Phase 2.
- Use simpler direct balance entry where appropriate.
- Keep the table simple and consistent.
- Portfolio table should include:
  - type
  - tax bucket
  - Include in FIRE
  - unit price
  - units
  - balance
  - custom group
- Include in FIRE should default to Yes.
- Market holding should combine stock, ETF, mutual fund, and crypto in one list.
- Unit price for market holdings should be automatically selected/refreshed rather than manually input.
- Symbol and select-symbol box should be one combined input.
- Home, liability, and other asset names should offer dropdown suggestions while allowing custom typing.

Product thinking shown:

- The founder cared about reducing user error and making repeated portfolio entry manageable.
- The founder favored consistency in table design.
- The founder identified which fields matter for FIRE planning and portfolio understanding.

### 9. Import / Export Direction

Founder direction:

- Adding portfolio should allow CSV or Excel import/export.
- There should be one import icon and one export icon for multiple file types.
- Import/export buttons should be less visually prominent.

Product thinking shown:

- The founder recognized that users with many holdings will not manually enter every row.
- The founder balanced functionality with UI simplicity.

### 10. Portfolio Editing Direction

Founder direction:

- Users should be able to edit and delete portfolio rows.
- Buttons should be easy to click.
- Market-data warning should not repeat under every successfully refreshed record.

Product thinking shown:

- The founder focused on real usability after data is entered.
- The founder corrected UI noise and interaction friction.

### 11. FIRE Calculation Methodology Challenge

Founder challenge:

- The founder questioned whether the Path to FIRE calculation matched the original plan.
- The founder noticed the current calculation did not collect enough information.
- The founder asked how annual expenses and withdrawal rate coordinate.
- The founder approved methodology cleanup only after review.

Product thinking shown:

- The founder did not accept unexplained calculation outputs.
- The founder required the financial model to be logically connected to the PRD.
- The founder treated methodology clarity as core trust, not a secondary detail.

### 12. Strategy Framework Request

Founder direction:

- Step back to review the PRD for Phase 1.
- Understand how to use frameworks such as 4C and go-to-market strategy.
- Get guidance on:
  - feature prioritization
  - target customer
  - what customers care about
  - positioning
  - competitor analysis
  - differentiation

Founder correction:

- When Codex implemented strategy copy into the app, the founder stopped it.
- The founder said the request was for brainstorming, not execution.
- The founder asked Codex to reverse the implementation.

Product thinking shown:

- The founder separated strategy work from product implementation.
- The founder corrected Codex when it moved too fast.
- The founder showed ownership over the product design process.

### 13. Product Design Flow And Frameworks

Founder questions:

- Asked whether a product needs a target customer first.
- Asked which framework helps choose the right customer group.
- Asked where STP fits in the product design flow.

Product thinking shown:

- The founder wanted to understand the reasoning process, not just receive recommendations.
- This led to creating a structured product-design flow.

Resulting artifact:

- `docs/product-strategy/product-design-flow.md`

### 14. Customer Segmentation And STP / JTBD Analysis

Founder direction:

- Start from the problem area:
  - people want to know when they can reach FIRE
  - better understand and track their portfolio
  - use that understanding for better financial planning
  - make decisions wisely
- List all possible customer groups.
- Use STP and JTBD to understand each group.
- Score each group.
- Pause before choosing a beachhead customer, positioning, and feature prioritization.

Product thinking shown:

- The founder explicitly staged the strategy process instead of rushing to positioning.
- The founder asked Codex to pause for founder review before continuing.

Resulting artifact:

- `docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md`

### 15. Multi-Account Household Pain Point

Founder additional context:

- Many people have multiple investment accounts:
  - several personal investment accounts
  - Roth accounts
  - 401(k) accounts
  - brokerage-link 401(k) accounts
  - HSA accounts
  - spouse accounts for family planning
- It is hard to track total net worth when markets fluctuate.
- Portfolio allocation can change dramatically.
- The founder had not found a tool that effectively handles this, though comprehensive competitor analysis was still pending.

Founder question:

- Asked whether this pain point is value added.
- Asked whether the customer analysis should change.

Product thinking shown:

- The founder introduced the core differentiated pain point: multi-account household portfolio fragmentation.
- This shifted the product thesis from generic FIRE planning toward FIRE-aware multi-account portfolio clarity.

Resulting update:

- Customer analysis was revised so multi-account FIRE households became the top segment.

### 16. Combined Customer Group Decision

Founder decision:

- A good combined target includes:
  - Multi-account FIRE households
  - DIY FIRE spreadsheet power users
  - Self-directed investors with tax-bucket complexity
  - Privacy-first no-account portfolio consolidators
  - Stock/ETF/Mutual-Fund Heavy Self-Directed Investors
  - High-Income Accumulation-Stage FIRE Aspirants
- The primary beachhead customer should be Multi-account FIRE households.
- The app should serve them first, while supporting the remaining related segments.
- The first target is individual investors with many accounts, including spouse accounts.

Product thinking shown:

- The founder chose a primary beachhead while allowing adjacent supporting segments.
- This avoided building for everyone while preserving a coherent combined market.

### 17. Account Structure As First-Class Concept

Founder decision:

- Account structure should be a first-class product concept.
- Different account types are all important because they affect the user's portfolio and FIRE path.

Context:

- Codex asked whether account structure should stay inside Custom Group or become first-class.
- The founder chose first-class.

Product thinking shown:

- The founder identified that account type, ownership, and tax bucket are not merely labels.
- They are core planning dimensions.

Implications for future product design:

- Account owner may matter: self, spouse, joint, household.
- Account type may matter: taxable brokerage, Roth IRA, traditional IRA, 401(k), brokerage-link 401(k), HSA, cash, home, liability, other.
- Tax bucket should remain separate from account type.
- FIRE inclusion should remain explicit.

### 18. Bridge Between Portfolio Clarity And FIRE Timing

Founder decision:

- The product should solve the bridge between current net-worth/allocation clarity and FIRE timing.
- The logical order makes sense:
  1. current net-worth/account/allocation clarity
  2. then FIRE timing based on that clarified picture

Founder concern:

- From a UI/site attraction perspective, showing the portfolio page first may not be attractive.
- New users may not have motivation to manually enter a portfolio before seeing value.

Product thinking shown:

- The founder distinguished product logic from onboarding psychology.
- The founder understood that portfolio clarity is the trust foundation, but quick FIRE insight may be the better first user experience.

### 19. Target Audience Picture Expanded

Founder additional context:

- Target users may have entry-level FIRE knowledge.
- They are motivated to keep learning more advanced FIRE concepts relevant to them.
- They need help with advanced planning or calculation.
- They may know basics like Social Security can start around age 62, or they may not know.
- They may need help estimating Social Security benefits.
- They may have a rough idea of retirement costs, but not understand inflation or other complexities.
- They may need periodic rebalancing support.
- Example: if crypto surges, crypto allocation may exceed their comfort level, and they may want to reduce allocation.

Product thinking shown:

- The founder positioned the target user between beginner and advanced.
- The founder identified progressive education as part of the product experience.
- The founder connected portfolio allocation drift to planning decisions without asking for investment advice automation.

### 20. Stock/ETF/Mutual-Fund Segment Correction

Founder correction:

- Stock/ETF/Mutual-Fund Heavy Self-Directed Investors may want backtesting to see historical performance.
- This is currently out of scope.

Product thinking shown:

- The founder recognized that this segment's expectations may pull the product toward historical performance and backtesting.
- This changed the scoring and interpretation of that segment.

Resulting update:

- The customer analysis now treats this segment as valuable but less clean as a Phase 1 beachhead.
- It is better as a supporting segment unless Household FIRE Planner intentionally expands toward historical performance and portfolio-analysis features.

## Founder-Proposed Features And Concepts

### Phase 1 / Near-Term Concepts

- Path to FIRE first.
- Understand Portfolio second.
- No landing page for Phase 1.
- No account/cloud sync in Phase 1.
- Local IndexedDB autosave.
- Current/latest portfolio only.
- CSV/XLSX import and export.
- Manual EOD price refresh by button.
- Unified market holding search for stock, ETF, mutual fund, and crypto.
- Unit price filled by EOD refresh or import, not typed manually for market holdings.
- Direct-balance entry for cash, home, liability, and other assets.
- Include in FIRE defaults to Yes.
- Editable/deletable portfolio rows.
- Portfolio fields:
  - type
  - tax bucket
  - Include in FIRE
  - unit price
  - units
  - balance
  - custom group
- Home/liability/other asset name suggestions with custom typing.

### Strategy / Product Direction Concepts

- Primary beachhead: multi-account FIRE households.
- Supporting segments:
  - DIY FIRE spreadsheet power users
  - self-directed investors with tax-bucket complexity
  - privacy-first no-account portfolio consolidators
  - stock/ETF/mutual-fund-heavy investors
  - high-income accumulation-stage FIRE aspirants
- Main pain: many fragmented accounts across household members and tax buckets.
- Account structure should be first-class.
- Product should bridge portfolio clarity and FIRE timing.
- Quick FIRE insight may be better first-user attraction than asking for full portfolio entry upfront.
- Portfolio clarity should improve the confidence of the FIRE calculation.
- The product should support progressive learning from basic FIRE to more advanced planning.

### Future / Deferred Concepts

- Historical portfolio records.
- Historical net-worth tracking.
- Saved paths.
- Scenario comparison.
- Social Security benefit estimation.
- Monte Carlo.
- Advanced tax modeling.
- Account-level tax settings.
- Option holdings and contract pricing.
- Backtesting and historical performance analysis.
- Allocation drift over time.
- Rebalancing support or target allocation awareness.
- Supabase account/cloud sync.
- Brokerage/bank connections, if ever justified.

## Evidence Of Founder-Led Thinking

The founder repeatedly challenged Codex in ways that materially improved the product direction:

- Rejected static UI as insufficient.
- Asked to review and rework the PRD instead of accepting the initial implementation.
- Narrowed Phase 1 scope when the app became too broad.
- Removed account/cloud workflows from Phase 1 despite initial setup.
- Required EOD refresh to be user-triggered for cost control.
- Pushed for import/export because manual entry would not work for many holdings.
- Questioned FIRE calculation methodology.
- Corrected Codex when it implemented strategy guidance instead of brainstorming.
- Introduced the multi-account household pain point as the strongest product wedge.
- Chose a primary beachhead customer.
- Chose account structure as a first-class concept.
- Chose the bridge between portfolio clarity and FIRE timing as the product center.
- Added nuanced target-user context around learning, Social Security, inflation, and allocation drift.
- Corrected the stock/ETF/mutual-fund segment because backtesting expectations are out of Phase 1 scope.

### 2026-06-08 - Founder-Provided Product Development Workflow

Founder input:

- Provided a product-development workflow covering product positioning, PRD drafting, visual design, SDD documentation, formal development, testing, deployment, and closed-loop delivery.
- Asked Codex to update the product design flow document only where the framework applies to Household FIRE Planner.

Codex response / artifact:

- Updated `docs/product-strategy/product-design-flow.md` to incorporate the workflow as an end-to-end operating process.
- Adapted the generic framework to Household FIRE Planner's current case: multi-account FIRE households, local-first Phase 1, manual EOD refresh, Path to FIRE first, Understand Portfolio second, and deferred cloud/historical/advanced-planning features.
- Added guidance for future canonical docs: PRD.md, DESIGN.md, ARCHITECTURE.md, and TODO.md.

Product significance:

- Strengthens the founder-led process by making product positioning, design validation, development constraints, testing, and deployment explicit before future implementation.
- Helps prevent AI-driven implementation drift by requiring docs, scope boundaries, and acceptance criteria before coding.
- Preserves that the founder supplied the product workflow and asked Codex to adapt it thoughtfully instead of blindly applying every step.

### 2026-06-08 - Manual Portfolio Collections Mockup Approval

Founder input:

- Asked for a visual mockup because manual collections were still hard to imagine.
- Approved the mockup showing a three-step flow: create collection, add holdings across accounts, and review allocation.

Codex response / artifact:

- Created the approved design spec at `docs/superpowers/specs/2026-06-08-portfolio-collections-design.md`.
- Updated the Phase 1 design spec so the earlier `Custom Group` text-field idea is marked as superseded for the next portfolio enhancement.

Product significance:

- Changes `Custom Group` from a simple note/tag concept into first-class Portfolio Collections.
- Supports the founder's multi-account household thesis by letting users analyze selected holdings across different accounts.
- Keeps account context, tax treatment, Include in FIRE, and Collection as separate concepts.

### 2026-06-08 - Portfolio Collections Implementation

Founder input:

- Approved the manual collections mockup and asked for an implementation plan.
- Chose Subagent-Driven execution for the implementation.

Codex response / artifact:

- Implemented first-class Portfolio Collections for Phase 1 local-first portfolio analysis.
- Added lightweight account metadata so collections can group holdings across accounts.
- Added collection-aware CSV/XLSX import and export support.
- Added workbook normalization so older local data can migrate from legacy `customGroup` values safely.

Product significance:

- Moves Household FIRE Planner closer to the multi-account FIRE household wedge.
- Replaces plain custom-group tagging with analysis-ready collections.
- Preserves the founder's requirement that account context, tax treatment, Include in FIRE, and Collection remain separate concepts.

### 2026-06-08 - Account Input Simplification

Founder input:

- Challenged the manual input burden created by Account Name, Account Type, Account Owner, and Tax Treatment fields.
- Asked for Account Owner to become a simple switch with only User 1, User 2, Joint, and Child.
- Asked for Account Type to become a select list, with Tax Treatment auto-filled from the selected Account Type and overridable only when needed.
- Clarified that user-selected account context should stay as the default until the user changes it, so entering multiple holdings from the same account does not require repeated setup.
- Confirmed that Cash Account should default to Not Applicable for Tax Treatment.

Codex response / artifact:

- Removed Account Name from Phase 1 manual entry while keeping underlying compatibility for older data/imports.
- Added Account Owner presets, Account Type presets, Tax Treatment auto-fill, Tax Treatment override, and sticky form defaults.
- Updated Phase 1 docs to use Account Owner, Account Type, and Tax Treatment language instead of the older Account Name / Tax Bucket workflow.

Product significance:

- Reduces friction for the beachhead user: multi-account FIRE households entering many holdings manually or through imports.
- Keeps account structure first-class without forcing users to type repetitive account names in Phase 1.
- Preserves the founder's intent that household ownership, account wrapper, tax treatment, FIRE inclusion, and collections remain distinct planning concepts.

### 2026-06-08 - Portfolio Overview Visual Direction

Founder input:

- Challenged the loud EOD refresh warning because it made the page feel noisy and over-important.
- Asked for the warning to be removed from the main status area or moved into a tiny bottom note / tooltip.
- Asked for the portfolio page to include more visuals: summary stats, an allocation chart, detailed holdings below, and filters that control the visual and summary stats.
- Clarified that the reference visual was only functional inspiration, not a style or layout to copy, and that the product should feel appealing for consumers rather than like an enterprise dashboard.
- Explicitly asked Codex to use taste-skill for a better visual direction.

Codex response / artifact:

- Reworked the Understand Portfolio top area into a consumer-friendly Portfolio Overview.
- Added Portfolio scope and Visual grouping controls that drive both summary stats and allocation visuals.
- Added a ring-style allocation visual plus bar breakdown.
- Moved long provider EOD caveats into a small Market data note tooltip while keeping the main refresh status compact.

Product significance:

- Moves the portfolio page closer to the target experience: a guided FIRE planning workspace that starts with understandable household portfolio clarity.
- Makes the product feel more useful before the user reaches the detailed holdings table.
- Preserves trust without letting generic market-data disclaimers dominate the experience.

### 2026-06-08 - Portfolio Overview Lens And Holding Allocation

Founder input:

- Asked for Portfolio Overview stats to be controlled by filters, not just the visual chart.
- Asked for more analysis lenses, including account owner, specific account/account wrapper, collection, account type, and tax treatment.
- Raised the navigation risk that too many filters could make the portfolio page hard to use.
- Reviewed four mockup options and chose Option A, Guided Lens Bar, as the first implementation direction, with Option C, Progressive Drilldown, as a fallback if Option A feels too dense.
- Corrected the first mockup because it showed mostly category-level allocation and did not answer holding-level questions such as BTC 10% or TSLA 15%.
- Clarified the product must answer questions such as: How much is User 1 vs User 2? What percentage of User 1 or User 2 is cash vs market holdings? What percentage of a tax-deferred account or tax treatment is a specific holding such as TSLA?

Codex response / artifact:

- Revised the approved mockup to show both group allocation and holding-level allocation.
- Implemented the Option A control model in Portfolio Overview: Portfolio scope, Analyze by, Focus, and Allocation view.
- Added a lens breakdown section for owner/account/tax/collection comparisons.
- Added selected allocation visual modes for Asset mix and Holdings.
- Made summary stats and detailed holdings follow the selected overview scope and focus.
- Documented Option C as the fallback product direction if Option A becomes too dense in real use.

Product significance:

- Turns Portfolio Overview from a simple visual summary into an analysis surface for the beachhead customer: multi-account FIRE households.
- Preserves simple navigation by separating the question into two steps: choose the analysis lens, then choose asset mix or holding allocation.
- Keeps the product grounded in the founder's requirement that specific holdings across owners, tax treatments, and collections must be visible without brokerage linking.

### 2026-06-09 - Risk Exposure, Bond Support, And Table Control

Founder input:

- Clarified that the collection section does not need its own allocation review because the shared Portfolio Overview chart should handle collection analysis.
- Asked to replace Asset Mix with Market Holding Risk Exposure, including Stock, ETF, Mutual Fund, Crypto, Bond / Fixed Income if supported, and Cash.
- Asked Codex to verify whether the selected EODHD provider can support any bond, Treasury, or T-bill data before implementing.
- Approved Phase 1 support for Bond / Fixed Income as a risk category, including bond ETFs, bond mutual funds, cash, and direct bonds only when EODHD search returns them cleanly.
- Clarified that Home and Liability should be forced to Household shared rather than assigned to User 1, User 2, Joint, or Child.
- Asked for detailed holdings table controls: a gear icon for locally saved column preferences and multi-select batch deletion.

Codex response / artifact:

- Confirmed EODHD search supports a `bond` type and can return direct bond rows; Phase 1 handles direct bonds as supported search results with manual price fallback if EOD price retrieval is unavailable.
- Implemented Market Holding Risk Exposure as the default allocation view and kept Holdings as the specific-symbol view.
- Added Bond / Fixed Income risk classification for direct bonds, bond ETFs, and bond-like mutual funds using provider type plus conservative name/symbol inference.
- Simplified Portfolio Collections so the management section shows assigned-row count while collection allocation is reviewed through Portfolio Overview.
- Added local table column preferences and batch deletion for selected detailed holdings.

Product significance:

- Keeps the product centered on the founder's main insight: multi-account FIRE households need clear risk exposure and specific holding visibility without brokerage linking.
- Avoids duplicating chart views across collection and portfolio areas, reducing navigation complexity.
- Adds a practical fixed-income category that matters for FIRE planning and rebalancing decisions without expanding Phase 1 into a full bond analytics product.

### 2026-06-09 - Plan-Only 401(k) Holdings Without Public Tickers

Founder input:

- Identified a real employer 401(k) edge case: holdings such as Vanguard Institutional 500 Index Trust Unit A are collective investment trusts available through employer retirement plans and do not have normal public tickers like VOO or VFIAX.
- Asked how users can log and track these holdings when EODHD or public-market symbol search cannot find them.
- Approved a plan-only holding path where users can enter these rows without a public ticker.

Codex response / artifact:

- Proposed treating these as Market Holding rows with a No public ticker / plan-only holding path.
- Added manual entry for plan-only holdings: name, holding type/risk category, account metadata, tax treatment, FIRE inclusion, and direct balance.
- Saved plan-only holdings without a symbol, marked them as manual price status, and kept them out of EOD refresh.
- Kept optional proxy tracking as a future enhancement rather than using proxy prices to overwrite actual plan balances.

Product significance:

- Strengthens Household FIRE Planner for the primary beachhead: multi-account FIRE households with employer 401(k), spouse accounts, HSA, taxable, cash, home, and liability complexity.
- Avoids forcing users to fake a ticker or misclassify plan-only retirement holdings.
- Preserves trust by separating actual user-entered plan balances from future estimated/proxy market movement.

### 2026-06-09 - Portfolio Interaction Friction Fixes

Founder input:

- Noticed that portfolio scope/focus selection should support deselecting a selected option with a second click.
- Identified that native number inputs can accidentally change Units when the user scrolls after clicking into the field.
- Asked for a solution to prevent Detailed Holdings from becoming too long as the portfolio grows.

Codex response / artifact:

- Added toggle behavior for selected portfolio focus chips, so clicking the active chip returns the view to All selected scope.
- Changed portfolio Units and Balance inputs to text-mode decimal inputs, preserving numeric parsing while avoiding native scroll-wheel stepper behavior.
- Proposed keeping the Detailed Holdings list manageable through a table-first control pattern rather than expanding navigation.

Product significance:

- Reduces accidental data entry errors in a financial planning workflow where small input mistakes can change FIRE conclusions.
- Makes portfolio analysis controls feel reversible and less sticky.
- Surfaces a scaling need for the primary beachhead: multi-account households may have dozens or hundreds of holdings.

### 2026-06-09 - Detailed Holdings Table Scaling

Founder input:

- Approved the compact table-toolbar approach for preventing Detailed Holdings from becoming too long as portfolios grow.
- Preferred keeping the existing table and simple site structure rather than adding more tabs or a separate detailed-holdings page.

Codex response / artifact:

- Added Detailed Holdings search, rows-per-page selection, previous/next pagination, and a selected-only filter.
- Kept bulk selection scoped to the currently visible page of holdings.
- Put the table in a fixed-height scroll area with sticky headers so long portfolios do not stretch the whole page.

Product significance:

- Supports the primary target customer: multi-account FIRE households with many holdings across user, spouse, taxable, retirement, cash, home, and liability contexts.
- Keeps portfolio review efficient without making the navigation more complex.
- Preserves the table-first workflow while preparing the app for larger real portfolios.

### 2026-06-09 - Path To FIRE Landing And Visual System Direction

Founder input:

- Agreed to rename Income-Only FIRE to Passive Income Coverage.
- Requested shadcn-style UI/UX with simple, clean rounded cards, more padding, more vertical spacing, light gray background, dark gray primary text, and green only for buttons or key calls to action.
- Asked for Path to FIRE to function as the landing page, with a strong benefit-led title and two clear calculator choices: Withdrawal-Rate FIRE and Passive Income Coverage.

Codex response / artifact:

- Reworked the Path to FIRE page into a benefit-led entry experience.
- Added local shadcn-style Button and Card usage for the visible Path to FIRE workflow.
- Kept the page structure simple and avoided adding a separate tools page or extra top-level navigation for this pass.

Product significance:

- Makes the first screen more attractive to a new user who may not be ready to enter a full portfolio yet.
- Clarifies the difference between portfolio-withdrawal planning and passive-income coverage.
- Aligns the visual language with a calm, trust-first finance planning product rather than a dense dashboard.

### 2026-06-09 - Detailed Holdings Scroll-Only Simplification

Founder input:

- Decided Detailed Holdings no longer needs Rows per page or related pagination controls.
- Clarified that the existing scroll behavior is enough for the table.

Codex response / artifact:

- Removed the Rows per page dropdown and Previous/Next page controls from Detailed Holdings.
- Removed page-size/page-number state and now renders the full filtered holdings list inside the scrollable table.
- Kept search, sorting, selected-only filtering, column preferences, and bulk selection.

Product significance:

- Reduces unnecessary controls in a table-heavy workflow.
- Keeps long portfolio review simple without adding more navigation or page-management friction.
- Preserves the useful scroll-table behavior for large multi-account household portfolios.

### 2026-06-09 - Specific Holdings Allocation Scroll Area

Founder input:

- Noticed that the Holdings allocation view for a specific portfolio/account/focus can also become too long.
- Asked for that view to use a fixed height with internal scrolling, similar to the Detailed Holdings table.

Codex response / artifact:

- Added a fixed-height scroll area around the Selected allocation segment list.
- Kept the chart and allocation summary in place while letting long symbol lists scroll within the card.
- Added a regression test for the scrollable Selected allocation segments list.

Product significance:

- Keeps portfolio overview compact even when a user has many holdings in one account, owner, tax bucket, or collection.
- Supports the target multi-account household use case without adding more navigation.
- Preserves quick allocation scanning while avoiding page-length sprawl.

### 2026-06-09 - FIRE Strategy Pages And Projection Audit Trail

Founder input:

- Confirmed that Household FIRE Planner should keep both FIRE strategy modes: Withdrawal-Rate FIRE and Passive Income Coverage.
- Asked that each strategy open on its own page rather than crowding the Path to FIRE home page.
- Pushed to reduce summary-card output to only a few key items and move detailed logic into a year-by-year projection table.
- Clarified that the projection table should not need a Stage column because before-FIRE, FIRE-year, and after-FIRE status should be obvious from the years and cash flow.
- Asked to rename Still needed to FIRE gap.
- Clarified that Savings and Withdrawal should be represented through one Cash flow column, with positive savings and negative withdrawal/spending.
- Clarified that savings should include all income that can be saved toward FIRE and withdrawal should include expenses.
- Asked to remove Investment growth as a separate projection-table column.
- Asked for info icons on key terms and progress bars for better visualization.
- Asked to add Social Security benefit, mortgage, and investment calculators as separate supporting tools linked from Path to FIRE.

Codex response / artifact:

- Split Path to FIRE into a simple strategy/tools home page plus separate pages for Withdrawal-Rate FIRE and Passive Income Coverage.
- Made the strategy cards fully clickable.
- Added compact result cards, progress bars, info icons, and scrollable year-by-year projection tables for both FIRE modes.
- Consolidated projection movement into Cash flow and removed Stage and Investment growth columns.
- Kept FIRE gap and Ending FIRE assets visible in the audit trail.
- Added separate calculator pages for Social Security benefit, mortgage, and investment assumptions.

Product significance:

- Keeps the first Path to FIRE experience simpler and less intimidating while still supporting deeper review.
- Makes the calculation more explainable through an audit trail instead of many competing summary numbers.
- Supports motivated FIRE learners who need guided planning, but still want transparent formulas and assumptions.
- Keeps calculators connected to planning assumptions without turning them into extra top-level navigation.

### 2026-06-09 - Path Home Benefit Framing And Real Info Popovers

Founder input:

- Challenged the Path to FIRE home page heading `Choose a FIRE strategy` as too functional and not attractive enough for a new user.
- Asked for the page to outline the benefit so users have a reason to stay.
- Asked to replace `FIRE strategies` with `Choose a FIRE Mode`.
- Noted that info buttons appeared visually, but clicking them did not show anything.

Codex response / artifact:

- Reframed the hero around the user benefit: seeing whether the household FIRE path is on track.
- Updated the mode section heading to `Choose a FIRE Mode`.
- Replaced native browser `title` attributes with a real click-to-open in-app info popover.
- Added a regression test that clicks a FIRE target info icon and verifies the explanatory popover appears.

Product significance:

- Reinforces that the first Path to FIRE screen should motivate the user with a clear outcome, not just present navigation.
- Makes info icons trustworthy interactive controls instead of confusing static symbols.
- Supports the product direction of guided FIRE learning while keeping the UI simple.

### 2026-06-09 - Portfolio Drawdown FIRE And SSA-Aware Social Security Direction

Founder input:

- Challenged the old withdrawal-rate calculation because annual expenses and withdrawal rate were being used in a confusing way.
- Clarified that the main mode should be `Portfolio Drawdown FIRE`, not a withdrawal-rate shortcut.
- Approved removing withdrawal rate as a required input from the main mode and keeping annual expenses as the primary spending input.
- Asked for `Implied withdrawal rate` to be shown as an output.
- Asked for the home page headline to become `A guided workspace for household FIRE planning`.
- Asked that the Social Security calculator follow the SSA PIA method, consider age 62 versus full retirement age and age 70, keep default inputs simple, and optionally improve accuracy with yearly earnings.
- Added that Social Security should include marital status if it changes planning context.
- Approved that info icons should explain concepts rather than repeat field names.

Codex response / artifact:

- Reworked the Phase 1 drawdown model to test each possible FIRE age and choose the first age where assets can support retirement cash flows through life expectancy.
- Removed withdrawal rate from the required main-mode input surface while preserving it for a future quick `FIRE Number by Withdrawal Rate` tool.
- Updated result cards toward estimated FIRE age, FIRE year, assets at FIRE, and implied withdrawal rate.
- Updated the projection table to use calendar years, compact signed cash flow, FIRE gap, and ending FIRE assets.
- Upgraded Social Security logic with SSA 2026 bend points, AIME/PIA rounding behavior, age-62 early claiming reduction, delayed credits through age 70, and marital-status context notes.
- Added an optional annual earnings-by-year override while keeping the default Social Security form simple.

Product significance:

- Separates the full household planning mode from the simple 4% or 5% shortcut.
- Makes annual expenses the real spending driver and turns withdrawal rate into a diagnostic output.
- Moves Household FIRE Planner closer to a guided household FIRE workspace rather than a generic calculator.
- Keeps Social Security useful for motivated FIRE learners without forcing a complex household claiming engine into Phase 1.

### 2026-06-09 - Social Security Calculator Input Simplification

Founder input:

- Challenged the calculator for asking both `Annual earnings growth` and `Wage growth assumption`.
- Noted that `Marital status` was not actually used in the calculation and had no spouse information fields.
- Pointed out that `Claiming age` was unnecessary because the output already compares age 62, full retirement age, and age 70.
- Asked for `Improve accuracy with annual earnings` to become fixed year-by-year fields based on `Work start year` and `Work end year`.
- Clarified that manually entered Social Security wages should override the earlier projected earnings for those years.
- Asked that calculator/tool links open in new windows for easier navigation.

Codex response / artifact:

- Removed `Claiming age`, `Marital status`, and `Wage growth assumption` from the Phase 1 Social Security calculator UI.
- Kept the Social Security calculator as a worker-benefit estimate until spouse-specific household inputs are designed.
- Kept output comparison cards for age 62, full retirement age, and age 70.
- Converted annual earnings accuracy input from a free-form text box into fixed year rows generated from work start and end years.
- Made manual Social Security wage entries override the simplified projected wage for matching years.
- Updated Path to FIRE calculator/tool cards to open in a separate browser tab/window.

Product significance:

- Reduces user confusion by only asking for inputs that clearly affect the visible calculation.
- Avoids pretending marital status is modeled before spouse, divorced-spouse, and survivor inputs exist.
- Supports the product principle of guided planning: start simple, then let users improve accuracy when they have better data.
- Makes reference tools easier to use alongside the main FIRE plan.

### 2026-06-09 - Social Security Rule Audit And Eligibility Guardrails

Founder input:

- Challenged the Social Security estimate because the number appeared too high.
- Asked whether the calculator considered wage caps, work credits, and qualification rules.
- Pointed out that a worker with too few years or credits may not qualify for retirement benefits at all.

Codex response / artifact:

- Reviewed the calculator against official SSA rules for taxable maximums, work credits, 35-year AIME, PIA bend points, early claiming reduction, and delayed retirement credits.
- Added historical 1978-2026 taxable wage caps before benefit computation.
- Added historical 1978-2026 Social Security credit thresholds and a 40-credit retirement eligibility check.
- Changed the calculator so ineligible workers show `Not eligible` instead of a payable monthly benefit.
- Added a visible `Credit eligibility` result card and warning text when credits are below 40.
- Adjusted today-dollar output so future eligibility-year formula values are converted down before display.

Product significance:

- Makes the calculator more conservative and less likely to overstate benefits.
- Makes eligibility rules visible to motivated FIRE learners instead of hiding them inside the math.
- Creates a stronger foundation for later spouse, survivor, and official-record import enhancements.

### 2026-06-09 - AI Handoff And Transferability Requirement

Founder input:

- Asked what documentation and files are needed to hand the project to another AI tool.
- Clarified that continuing development on another device or with another tool should be a seamless transfer or handover.
- Asked for a handoff file to be created or updated and kept current.

Codex response / artifact:

- Added `docs/AI_HANDOFF.md` as the current-state handoff file.
- Added a root `README.md` that points future tools to the handoff file and the basic setup commands.
- Documented which files to copy, which generated or secret files not to copy, how to recreate `.env.local`, how to run the app, and how to verify changes.
- Documented the current Phase 1 product surface, code map, calculation scope, market-data setup, local IndexedDB behavior, and deferred features.
- Captured a current transfer gap: Phase 1 has portfolio CSV/XLSX import/export, but not yet a full workbook export/import for all local FIRE inputs and collections.

Product significance:

- Makes Household FIRE Planner less dependent on one long AI thread.
- Preserves founder-directed product decisions for future tools.
- Separates app transfer from local browser data transfer, which prevents a future AI from overclaiming seamless migration.
- Establishes a maintenance rule for updating handoff documentation when scope, routes, calculations, env vars, or setup steps change.

### 2026-06-09 - FIRE Mode Navigation Behavior

Founder input:

- Asked that clicking `Passive Income Coverage` or `Portfolio Drawdown FIRE` navigate in a new browser window/tab.

Codex response / artifact:

- Updated the Path to FIRE mode cards to use new-window navigation.
- Added a regression test covering `target="_blank"` and `rel="noreferrer"` on both FIRE mode cards.
- Updated `docs/AI_HANDOFF.md` so future tools preserve the behavior.

Product significance:

- Supports easier side-by-side navigation between the Path to FIRE home page, FIRE strategy pages, and calculators.
- Keeps the workspace feel lightweight without adding more tabs to the app itself.

### 2026-06-09 - Progressive Income Sources Without Breaking Simple Mode

Founder input:

- Clarified that Default Simple Mode should remain intact.
- Required `Annual passive/guaranteed income after FIRE` to stay as a simple top-level input.
- Approved a collapsed optional income-source section only if it can overwrite the simple passive-income bucket for additional accuracy.
- Clarified that `Passive/guaranteed income is inflation adjusted` should remain.
- Added that annual retirement expenses should also have an inflation option.
- Clarified that Social Security source rows do not need a separate claiming-age field when the row already has a start age.

Codex response / artifact:

- Added `Retirement expenses are inflation adjusted` as an explicit FIRE input.
- Added collapsed `Income Sources (Optional)` UI.
- Added a user-controlled `Use income sources instead of the simple passive income amount` override to avoid double counting.
- Modeled income sources with source type, owner, annual amount, start age, optional end age, and per-source inflation behavior.
- Added a Social Security calculator link from the income-source section and kept Social Security rows start-age based.
- Bumped the Phase 1 workbook schema to `phase1.3` and documented the behavior in the handoff/spec files.

Product significance:

- Preserves the product principle of starting simple, then improving accuracy only when the user chooses.
- Avoids confusing users by double counting passive income and detailed source rows.
- Gives motivated FIRE learners a path to model Social Security, rental income, pensions, and similar sources without turning the first screen into a complex retirement-planning suite.

### 2026-06-09 - Pre-FIRE Passive Income Timing Bug

Founder input:

- Challenged the Portfolio Drawdown FIRE logic for a case where passive income starts before the projected FIRE age.
- Example: current age 36, life expectancy 90, current assets around $500k, annual spending around $140k, and Social Security beginning at 62 while FIRE is projected later.
- Pointed out that income received between the Social Security start age and the FIRE age should affect the plan instead of being ignored.
- Asked for multiple scenarios and edge cases to be tested.

Codex response / artifact:

- Identified that pre-FIRE projection only added `Annual savings before FIRE` and ignored active detailed income sources.
- Updated Portfolio Drawdown FIRE so active optional income sources with start/end ages are added to pre-FIRE cash flow when the income is active before FIRE.
- Kept the simple passive-income bucket excluded from pre-FIRE accumulation because it has no start-age timing and could double count annual savings.
- Added tests for income starting before FIRE, simple passive income not being added before FIRE, income starting exactly at FIRE, temporary income ending before FIRE, and inflation-adjusted income before FIRE.

Product significance:

- Makes the bridge between future income and FIRE timing more realistic for users whose Social Security, pension, rental, or other income starts before their projected retirement date.
- Preserves the product principle that detailed timing belongs in optional progressive-accuracy sections, not in the default simple bucket.

### 2026-06-09 - Passive Income Coverage FIRE Timing And Portfolio Button

Founder input:

- Asked to rename `Passive Income Coverage` to `Passive Income Coverage FIRE`.
- Asked for the passive-income FIRE page to support `Use Portfolio FIRE Assets`, like Portfolio Drawdown FIRE.
- Challenged Passive Income Coverage logic because annual retirement expenses were counted before the FIRE age.
- Asked for real-case and edge-case tests.
- Noted that expected annual portfolio return should allow positive values below 3%.

Codex response / artifact:

- Renamed the mode label, page heading, and projection table to `Passive Income Coverage FIRE`.
- Added `Passive Income FIRE age` so retirement expenses begin at that planned age instead of current age.
- Added `Use Portfolio FIRE Assets` to both FIRE strategy pages.
- Made `Annual savings before FIRE` visible in Passive Income Coverage FIRE because assets now accumulate before the planned FIRE age.
- Updated Passive Income Coverage FIRE so pre-FIRE rows grow assets from portfolio return, annual savings, and active optional income sources, while the simple passive-income bucket starts at the Passive Income FIRE age.
- Added regression tests for planned-FIRE-age expenses, simple passive income timing, detailed income timing, coverage ratio measured at FIRE age, portfolio button behavior, and return values below 3%.
- Bumped the Phase 1 workbook schema to `phase1.4`.

Product significance:

- Makes Passive Income Coverage FIRE behave like a true FIRE mode rather than an already-retired income calculator.
- Keeps the simple bucket easy to use while giving timed income sources a clear role in pre-FIRE and post-FIRE projections.
- Helps multi-account FIRE households connect actual portfolio assets to both FIRE strategy pages.

### 2026-06-09 - Principal-Preserving FIRE And Income Stream Split

Founder input:

- Challenged the meaning of `Passive Income Coverage FIRE`.
- Clarified that one desired mode should mean FIRE without planned principal drawdown, where the balance should not fall below the assets at the FIRE age.
- Clarified that this mode should include only cash-generating investment return such as dividends, interest, and distributions, not unrealized appreciation.
- Approved the name `Principal-Preserving FIRE`.
- Asked to keep a separate `Income Stream FIRE` mode but simplify its calculation and layout.
- Approved a separate cash-generating return field and asked for the info icon to explain it clearly.
- Asked for more than 20 real and edge-case scenarios to verify the calculations.

Codex response / artifact:

- Split the old passive-income concept into `Principal-Preserving FIRE` and `Income Stream FIRE`.
- Added `expectedCashGeneratingReturnPercent` as a separate Phase 1 input from expected annual portfolio return.
- Updated Principal-Preserving FIRE so expected annual portfolio return is used before FIRE to estimate the FIRE-age balance, while after FIRE only income streams plus cash-generating return are treated as spendable.
- Set the Principal-Preserving FIRE pass rule to assets staying at or above the FIRE-age principal floor through life expectancy.
- Simplified Income Stream FIRE so it ignores portfolio assets, annual savings, portfolio return, depletion, and portfolio buttons; it now tests only whether recurring income streams cover expenses from the selected FIRE age.
- Added explicit routes for `/app/fire-path/principal-preserving` and `/app/fire-path/income-stream`; kept `/app/fire-path/passive-income` as a compatibility route to Income Stream FIRE.
- Added a scenario matrix with more than 20 cases covering inflation, zero income, exact coverage, temporary income, delayed income, detailed income overrides, cash-yield behavior, principal-floor failure, and legacy-mode migration.
- Bumped the Phase 1 workbook schema to `phase1.5`.

Product significance:

- Preserves the founder's distinction between income-stream coverage and principal-preservation planning.
- Prevents the product from accidentally counting unrealized appreciation as spendable passive income.
- Makes the mode names easier for users to understand and keeps the Income Stream screen lighter.

### 2026-06-10 - Optional Expense Categories For Progressive Accuracy

Founder input:

- Asked to add optional expense category fields similar to the existing optional income sources.
- Clarified that the setup and calculation should mirror income sources but must be expense-specific.
- Requested the layout move away from separate cards below the main inputs: the optional panels should sit to the right of Assumptions, with expenses above income, both collapsed.

Codex response / artifact:

- Added `Expense Categories (Optional)` as a collapsed progressive-accuracy section above `Income Sources (Optional)`.
- Implemented expense categories as a replacement for the simple annual expense amount only when the override is enabled, matching the income-source override pattern and avoiding double counting.
- Added expense category type, annual amount, start age, optional end age, and per-category inflation adjustment.
- Updated FIRE calculations so all modes use detailed active expense categories by projected year when the override is enabled.
- Bumped the Phase 1 workbook schema to `phase1.6`.

Product significance:

- Keeps the default FIRE flow simple while letting motivated users model lumpy or age-specific retirement expenses.
- Supports the founder's progressive-accuracy direction: start with one annual expense number, then improve the plan with category timing when needed.
- Makes expenses and income visually parallel without creating another tab.

### 2026-06-10 - Principal-Preserving FIRE Age Becomes An Output

Founder input:

- Principal-Preserving FIRE was asking the user to set the FIRE age, which answers "If I retire at this age, can I preserve principal?"
- The founder wants it to answer "What is the earliest age where I can retire while preserving principal?" instead, so the FIRE age is calculated, not entered.
- Suggested algorithm: test each age from the current age forward; project FIRE assets to that age using current assets, savings, expected return, and timed income; set that projected balance as the principal floor; from that age through life expectancy check that passive/guaranteed income plus cash-generating return covers expenses and assets never fall below the floor; the first passing age is the result; if none pass, show "Not reached under current assumptions."
- Replace the input with outputs: earliest Principal-Preserving FIRE age, principal floor at FIRE, first-year income coverage, and shortfall if not reached.

Codex response / artifact:

- Removed `passiveIncomeFireAge` as an input for Principal-Preserving FIRE and implemented an earliest-age search in `src/lib/phase1/fire.ts` (`estimatePrincipalPreservingProjection` + `projectPrincipalPreservingSurvival`), mirroring the existing Portfolio Drawdown earliest-age search for consistency.
- Added `estimatedFireYear` and `estimatedYearsToFire` to `Phase1PrincipalPreservingResult`; `estimatedFireAge` is null when not reached.
- Updated the UI: hid the FIRE-age input for this mode, added a hint that the age is found automatically, led the results with "Earliest Principal-Preserving FIRE age" and "FIRE year", and added a "Not reached" explanation that surfaces the retire-now first principal-dip age and suggested levers (more savings, lower expenses, more income, higher cash-generating return).
- When no age qualifies, the projection now shows the retire-now scenario so the shortfall and first principal-dip age stay meaningful.
- Updated tests (`src/tests/phase1/fire.test.ts`, `src/tests/components/path-to-fire-panel.test.tsx`) to the earliest-age semantics, and updated `PRD.md`, `ARCHITECTURE.md`, and `docs/AI_HANDOFF.md`.
- Could not run `npm test`, `npm run build`, or the dev-server smoke test inside the Cowork Linux sandbox because the mounted `node_modules` holds macOS-native binaries (vitest/rolldown and Next swc) and the npm registry is blocked. Verified logic numerically via a standalone JS port of the calc (17 scenarios) and confirmed the production TypeScript typechecks and lints cleanly. Founder should run the full suite and smoke test on macOS.

Product significance:

- Turns Principal-Preserving FIRE from a yes/no check at a guessed age into a direct answer to the question users actually have: the soonest age they can retire while keeping their nest egg intact.
- Keeps the three FIRE modes consistent, since Portfolio Drawdown already computes the earliest age.
- The "Not reached" diagnostics keep the mode honest and actionable instead of silently failing.

### 2026-06-10 - Non-Overlapping Return Fields And Optional-Section Layout Fix

Founder input:

- The two return fields in Principal-Preserving FIRE (Expected annual portfolio return and Expected cash-generating investment return) were confusing because they overlap.
- Keep Expected cash-generating investment return and count it toward money the user can use after FIRE.
- Change Expected annual portfolio return to mean the remaining return other than the cash-generating part. Example: if total expected return is 10% and cash-generating is 3%, the user enters 7%.
- Confirmed in clarifying question: keep the conservative model. After FIRE, appreciation is not applied to assets; only cash-generating return plus income streams are spendable. Pre-FIRE growth uses the full total (appreciation + cash-generating).
- Reported a UI/UX flaw: when the collapsed Expense Categories and Income Sources sections are expanded, the layout breaks (text collapses to one character per line, form card overflows). Asked to fix.

Codex response / artifact:

- Relabeled the Principal-Preserving return field to `Expected appreciation return` (non-cash portion only) and updated help text so the two fields are clearly non-overlapping; total return = appreciation + cash-generating. Portfolio Drawdown FIRE keeps a single total-return field because it has no separate cash-generating field.
- Updated `src/lib/phase1/fire.ts` so Principal-Preserving pre-FIRE accumulation grows at appreciation + cash-generating return (added `getPrincipalPreservingPreFireReturnPercent` and an optional rate argument on `projectAssetsBeforeFire`). After-FIRE behavior is unchanged per the founder's conservative choice.
- Fixed the layout flaw: Income Sources now stacks in a single column like Expense Categories instead of using a two-column inner grid that overflowed the narrow right-hand column.
- Updated tests and docs (`PRD.md` unaffected on this point; `ARCHITECTURE.md`, `docs/AI_HANDOFF.md`, and this log updated). Verified logic numerically via the standalone JS port (all 17 scenarios pass) and confirmed clean lint and types for production files; full `npm test`/`npm run build`/dev smoke test must run on macOS due to the sandbox's native-binary mismatch.

Product significance:

- Removes a real source of user confusion: the two return inputs no longer look like they double-count.
- Keeps Principal-Preserving FIRE conservative and meaningful (you live off yield; appreciation is not spent), matching the mode's name and intent.
- Fixes a visible rendering bug that made the optional progressive-accuracy sections look broken.

### 2026-06-10 - Renamed The Product To Household FIRE Planner

Founder input:

- No longer likes the name "Freedom Path"; it feels generic in the FIRE space.
- Worked through naming with Codex and chose a clear, descriptive name that tells users what the site is for.
- Decision: name = **Household FIRE Planner**; tagline = "Plan your path to financial independence and early retirement — across all your household accounts."
- Was unsure whether target users know the term "FIRE." Resolved by keeping "FIRE" in the name (the audience is defined as FIRE learners) plus a plain-language tagline so newcomers still understand.
- Scope: rename everywhere, including older archived docs. Tagline should appear in the browser tab metadata and as a visible subtitle.

Codex response / artifact:

- Replaced the visible brand string "Freedom Path" with "Household FIRE Planner" across the app (header, tab title, auth panel, disclaimers, sample plan) and across all docs including archived specs/plans and the original PRD.
- Added the tagline to `src/app/layout.tsx` metadata description and a subtitle line under the name in the app header (`app-shell.tsx`).
- Updated `package.json` name to `household-fire-planner` and the portfolio export filenames to `household-fire-planner-portfolio.csv/.xlsx`.
- Intentionally did NOT change data-critical or link-critical identifiers: the IndexedDB database names (`freedom-path-phase1`, `freedom-path`), the saved-settings localStorage key, internal code identifiers (e.g. `FreedomPathDb`), the project folder name, and the `freedom_path_full_codex_handoff_prd_v1_7.md` filename. Renaming the database would orphan every user's saved plans and portfolios; renaming the folder/filename would break the workspace mount and doc links. These are invisible to users, so there is no benefit and real risk.
- The legacy `/app/freedom-map` route is a separate feature name ("Freedom Map"), not the product brand, so it was left unchanged.

Product significance:

- Clear, descriptive name tells users immediately what the site does, while the tagline covers users who don't know the FIRE acronym.
- Keeps the household/all-accounts differentiator in the name itself.
- Protecting the database and identifier names means no existing user loses their saved data during the rename.

### 2026-06-10 - Asset Allocation Templates And The Ticker-Equivalence Problem

Founder input:

- Wants asset allocation templates for Saved Paths (Aggressive Growth, 80/20, 70/30, 60/40, Conservative 50/40/10, Cash Buffer + Growth, Custom), labeled as planning templates not recommendations, with allocation-drift comparison against the household portfolio. Roadmap templates: All Weather, Permanent Portfolio, Three-Fund Global, Target-Date Glide Path, Risk Parity approximation, Bucket Strategy.
- Considering this for Phase 1 but wants careful planning. Raised the key concern: templates say "S&P 500 Stocks," but users may hold a different ETF/fund that serves the same purpose (VOO, IVV, SPY, FXAIX, VTI). How to handle the mismatch?

Codex response / artifact:

- Added an "Asset Allocation Templates (under evaluation for Phase 1)" section to `PRD.md` with the MVP and roadmap templates and the planning-template labeling requirement.
- Resolved the ticker-equivalence concern with a role-based design: templates are defined by asset ROLE (Stocks / Bond Equivalent / Cash), not by ticker. Holdings map to a role automatically from the existing `type` field (bond -> Bond Equivalent, cash -> Cash, stock/etf/mutual_fund -> Stocks), with an optional per-holding role override. So any S&P 500-equivalent or broad-equity holding counts toward the Stocks target; the exact ticker is never required.
- Documented the explicit MVP limitation: the role model does not yet distinguish S&P 500 from total-market, international, small-cap, gold, or commodities, which is why All Weather / Permanent Portfolio / Risk Parity stay roadmap-only until those asset-class roles exist.

Product significance:

- Makes allocation templates feasible without forcing users onto specific tickers, fitting the multi-account household reality.
- Keeps the door open to richer strategies without over-claiming what the MVP models.

### 2026-06-10 - FIRE Mode Clarity Redesign (labels, model, home sale, tax)

Founder input:

- The projection fields were confusing (e.g. "why isn't portfolio return income?"). Money is fungible: in drawdown you can spend returns by selling.
- Decisions reached over several rounds: keep "Portfolio Drawdown FIRE" (not "Die with Zero" — that mode leaves a large balance, not zero). Make labels mode-specific but consistent. Cash yield counts as spendable; appreciation is shown only where it differs in treatment.
- Liquidity: a home isn't spendable like a stock, so exclude real estate from the drawdown pool by default and add an optional one-time home-sale inflow instead.
- Tax: make simple tax mode available in all three modes, Option B (gross up all spending: need expenses ÷ (1 − rate) from any source; taxes all income equally; blunt estimate).
- Home page should guide users to the mode that fits their lifestyle, not just explain mechanics.
- Tooltips must explain the key point/gotcha, not restate the label.

Codex response / artifact:

- Per-mode return model: Portfolio Drawdown uses a single "Expected total return" (you spend by selling, so the appreciation/yield split isn't shown). Principal-Preserving splits into "Spendable investment return" (cash yield) and "Asset appreciation (not spent)" — appreciation now grows the unspent principal post-FIRE while income + yield fund spending. Income Stream has no return fields.
- Option B simple tax wired into all three modes via a single grossed spending-need helper; verified 60k → 80k at 25% and the Drawdown first-year draw at 90k for the 90k/30k/25% case.
- One-time home-sale inflow (homeSaleAge + homeSaleProceeds, schema bumped to phase1.7) added to liquid assets at the sale age in the asset modes; home/real estate excluded from the drawdown pool.
- Tables redesigned: Drawdown shows Starting → Investment return → Income/savings → Expenses → Assets withdrawn → Ending; Principal-Preserving shows the floor in the result card only and red-tints a dip row only in the not-reached scenario.
- Home page reframed to goal-first cards ordered most-cautious (Income Stream) to most-flexible (Portfolio Drawdown), with a "not sure? start with Portfolio Drawdown" hint.
- Verified the calc adversarially with a standalone JS port (survival vs displayed-rows agreement, Option B gross-up, home-sale lands once, income-covers→no withdrawal, Income Stream pass implies Principal-Preserving pass, appreciation grows principal). Updated component + unit tests; production code lints and type-checks clean. Full `npm test` still runs on macOS.

Product significance:

- Removes the core confusion: each mode now shows only the money concepts that matter to it, with honest labels and gotcha-focused tooltips.
- Reflects real liquidity (home isn't drawdown capital) and lets tax be modeled everywhere.
- The mode spectrum (Income Stream ⊂ Principal-Preserving ⊂ Portfolio Drawdown) is now surfaced as lifestyle-based guidance.

### 2026-06-12 - Production Price-Fetch Fix, Learn/SEO Launch, And GSC/Analytics Decisions

Founder input:

- Reported that portfolio price fetching was broken in production while working locally.
- Wanted Learn content and sitewide SEO to improve discoverability without adding new top-level navigation tabs.
- Challenged the ambiguous "Annual surplus / shortfall" slash label as unclear.
- Asked to align the home page "Three paths to reach early retirement" intro with the centered "Free calculators" section, and to move the "Help me choose" link directly below that intro.
- Wanted real analytics in place and a Google Search Console "13 errors / URL not allowed" error resolved.
- Asked for a marketing plan and a monetization plan to be written down.

Codex response / artifact:

- Diagnosed the production price-fetch failure as a missing `EODHD_API_KEY` in the Vercel environment (the key existed locally but not in production); the founder added it and an empty redeploy commit `8df927b` confirmed the fix.
- Built Learn pages + sitewide SEO (commit `b9f47a4`): new `/what-is-fire` and `/fire-glossary` pages; a single "Learn" nav dropdown instead of new top-level tabs; FAQ + FAQPage JSON-LD on the three strategy pages; sitewide Organization + WebSite JSON-LD and Twitter card tags in the root layout; both new pages added to the sitemap; two-way internal linking.
- Replaced the ambiguous slash with a sign-driven dynamic label (commit `049c02c`): "Annual surplus" (green) when positive, "Annual shortfall" (red) when negative, with plainly reworded tooltips; applies to Income Stream and Principal-Preserving modes.
- Centered the "Three paths to reach early retirement" heading + subtitle and moved the "Not sure which fits you? Help me choose" link to directly below that intro, above the path cards (commit `1b661be`).
- Added Vercel Web Analytics (commit `f80e971`): `@vercel/analytics` + `<Analytics />` in the root layout; the founder enabled it in the Vercel dashboard.
- Fixed the sitemap (commit `7a95c55`): removed the redirecting root "/" entry (it 307-redirects to `/app/fire-path`) and promoted `/app/fire-path` to priority 1, resolving the "Page with redirect" GSC error.
- Wrote `MARKETING_PLAN.md` (commit `7f0aaa4`) and `MONETIZATION_PLAN.md` (commit `d3d3407`).

Founder decisions:

- The GSC "13 errors / URL not allowed" root cause was the Jun-11 sitemap listing `http://localhost:3000` URLs (`NEXT_PUBLIC_SITE_URL` not applied at that build); already fixed — the live sitemap now emits valid `https://www.planmyfi.com` URLs.
- DECIDED to KEEP `www` as canonical (do NOT switch to non-www). The GSC property is a Domain property covering both `www` and non-www, so there was no real host mismatch — no Vercel domain flip and no env change. For GSC Domain properties, sitemaps must be submitted as the full URL (`https://www.planmyfi.com/sitemap.xml`), not just `sitemap.xml`.
- Analytics approach: Search Console + Vercel Web Analytics now; Google Analytics 4 optional later (needs a `G-XXXXXXX` Measurement ID from the founder).

Pending / next:

- Verify the healthcare calculator fixes are fully shipped (present-value headline, Medicaid/low-income handling, couple OOP bug, "moderate" OOP default) — verification in progress.
- Sanity-check default figures (Medigap ~$155/mo, home insurance ~$2,400/yr) for accuracy.
- Optional: GA4 setup; request indexing for individual calculator pages in Search Console.
- Housekeeping: delete the old iCloud copy of the repo.

Product significance:

- Restores a core trust feature (live portfolio prices) in production and confirms the failure was environment config, not application logic.
- Adds Learn content and structured-data SEO to grow organic discovery while honoring the founder's standing constraint against navigation bloat.
- Removes a recurring point of user confusion in the FIRE result labels and tightens home-page visual consistency.
- Establishes real analytics and a clean, valid sitemap so Search Console can index the site correctly, and records the deliberate www-canonical decision for future reference.

## Current Open Strategy Questions

- Should the first visible experience be a quick FIRE snapshot, followed by portfolio setup?
- What minimum account fields are needed for Phase 1 or Phase 1.5?
- How much allocation clarity belongs in Phase 1 before it becomes too much?
- How should the app educate users without becoming a content site?
- How should the app discuss rebalancing without giving personalized investment advice?
- How deep should Social Security household claiming logic go after the simple Phase 1 calculator?
- How much competitor analysis is needed before final positioning?

## Maintenance Notes

When updating this file, prefer this pattern:

```text
### YYYY-MM-DD - Short Topic

Founder input:

- ...

Codex response / artifact:

- ...

Product significance:

- ...
```

Do not rewrite founder decisions as if Codex created them. Preserve the distinction between founder input, Codex suggestion, and final founder decision.
