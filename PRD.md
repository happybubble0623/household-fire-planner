# Household FIRE Planner PRD

Status: Canonical current Phase 1 product requirements  
Last updated: 2026-06-10  
Audience: founder, product reviewer, and AI/code agents continuing the project

## Product Positioning

Household FIRE Planner is a local-first, account-free FIRE planning workspace for motivated FIRE learners with multi-account household portfolios.

Current positioning:

```text
A guided workspace for household FIRE planning.
```

Longer product promise:

```text
Start simple with manual FIRE assumptions, then get progressively more accurate as users add real household accounts, holdings, future income, expense timing, inflation, taxes, and allocation information.
```

Household FIRE Planner should not position itself as a brokerage-connected net-worth app, budgeting app, tax-planning product, investment-advice product, or full retirement planner. The strongest Phase 1 differentiation is:

- Household-level FIRE readiness.
- Multi-account and spouse/household portfolio clarity.
- No brokerage login required.
- Local-first privacy.
- Transparent calculations and visible assumptions.
- Manual user-controlled EOD price refresh instead of automatic paid sync.

## Target Customer

Primary beachhead customer:

```text
Motivated FIRE learners with multi-account household portfolios who need to understand household-level FIRE readiness across taxable, retirement, HSA, spouse, cash, home, and liability accounts without brokerage linking, who know the basics but need help turning scattered accounts, future income, inflation, taxes, and allocation drift into better planning decisions.
```

Secondary supported segments:

- DIY FIRE spreadsheet power users.
- Self-directed investors with tax-bucket complexity.
- Privacy-first no-account portfolio consolidators.
- Stock/ETF/mutual-fund heavy self-directed investors.
- High-income accumulation-stage FIRE aspirants.

Do not make Phase 1 too broad for generic consumers. The product should serve the multi-account household pain first and support the other segments only when doing so does not make the core flow harder.

## User Pain Points

Primary pain:

- Users often hold assets across many accounts: individual taxable brokerage, spouse taxable brokerage, Traditional 401(k), Roth 401(k), Traditional IRA, Roth IRA, HSA, brokerage-link 401(k), cash, home, mortgage, and other liabilities.
- Household planning gets harder when each spouse has separate accounts and ownership matters.
- Net worth and allocation can swing quickly when markets move, especially with concentrated stocks or crypto.
- Users want to know whether their household FIRE path works, but the answer depends on multiple assumptions: current FIRE assets, retirement expenses, future income, inflation, tax treatment, Social Security, home/liability treatment, and allocation drift.
- Spreadsheets offer control but require manual maintenance, formulas, price updates, and repeated reconciliation.
- Brokerage-linked apps may be expensive, privacy-sensitive, budgeting-focused, or not FIRE-planning focused.

Secondary pains:

- Manual ticker entry can create typos.
- Employer retirement plans may contain collective investment trusts or plan-only holdings without public tickers.
- Some assets cannot be refreshed with market-data APIs and need manual balance entry.
- Users need simple defaults first, then optional precision when they are ready.
- Users want clear explanations of terms and calculations without financial-advice language.

## Core User Journey

### Journey 1: New User Starts With FIRE Planning

1. User opens `/app/fire-path`.
2. User sees a concise workspace message, not a public marketing landing page.
3. User chooses a FIRE mode:
   - `Portfolio Drawdown FIRE`
   - `Principal-Preserving FIRE`
   - `Income Stream FIRE`
4. The selected mode opens in a new tab/window so the home workspace stays available.
5. User enters simple assumptions first:
   - current age
   - life expectancy
   - current FIRE assets
   - annual retirement expenses
   - passive/guaranteed income
   - annual savings before FIRE
   - expected annual portfolio return
   - inflation rate
   - simple tax mode where applicable
6. User reads compact result cards and a year-by-year projection table.
7. User can open optional sections for more accuracy:
   - `Expense Categories (Optional)`
   - `Income Sources (Optional)`

### Journey 2: User Adds Real Household Portfolio

1. User opens `/app/portfolio-lab`.
2. User adds holdings manually, imports CSV/XLSX, or uses symbol search for market-priced holdings.
3. User classifies each row by asset/holding type, owner, account type, tax treatment, Include in FIRE, balance/units, and collection membership.
4. User optionally clicks `Refresh EOD Prices` to update supported market-priced holdings.
5. User filters/analyzes by household, owner, account type, tax treatment, holding type, and collections.
6. User uses `Use Portfolio FIRE Assets` from relevant FIRE pages to bring portfolio FIRE assets into the FIRE calculation.

### Journey 3: User Improves Accuracy Over Time

1. User keeps a simple annual expense/income setup for quick planning.
2. When ready, user opens optional expense categories and turns on the override.
3. User enters age-specific categories such as housing, healthcare, travel, taxes, debt, and general living.
4. User opens optional income sources and turns on the override.
5. User enters Social Security, rent, pension, annuity, part-time income, or other income with start/end ages and inflation behavior.
6. User uses helper calculators for Social Security, mortgage, and investment assumptions, then brings outputs back into the FIRE mode manually.

## MVP Core Features

### Navigation and Structure

- Top navigation only:
  - `Path to FIRE`
  - `Understand Portfolio`
- No sidebar.
- No account/login navigation in Phase 1.
- No public landing page in Phase 1.
- FIRE mode and tool cards open in new tabs/windows.

### Local Workbook

- Store the Phase 1 workbook in browser IndexedDB through Dexie.
- Database name: `freedom-path-phase1`.
- Current workbook schema: `phase1.7`.
- Autosave on local browser/device.
- Show local save status in the UI.

### Path to FIRE

MVP modes:

- `Portfolio Drawdown FIRE`
  - Finds the earliest FIRE age where assets can support retirement expenses through life expectancy.
  - `Withdrawal rate` is not a required input in this main mode.
  - Shows `Implied withdrawal rate` as an output.
- `Principal-Preserving FIRE`
  - Finds the earliest FIRE age where income streams plus cash-generating investment return cover expenses while ending assets stay at or above the FIRE-age principal floor through life expectancy.
  - The FIRE age is an output, not a user input. Shows `Not reached` when no age qualifies.
- `Income Stream FIRE`
  - Tests whether recurring income streams cover retirement expenses from the planned FIRE age through life expectancy.

MVP inputs:

- Current age.
- Life expectancy.
- Income Stream FIRE age (Income Stream mode only). Principal-Preserving and Portfolio Drawdown modes compute the earliest FIRE age as an output.
- Current FIRE assets.
- Annual retirement expenses.
- Retirement expenses inflation toggle.
- Optional expense categories override:
  - category type
  - annual amount
  - start age
  - optional end age
  - inflation toggle
- Annual passive/guaranteed income after FIRE.
- Passive/guaranteed income inflation toggle.
- Optional income sources override:
  - source type
  - owner
  - annual amount
  - start age
  - optional end age
  - inflation toggle
- Annual savings before FIRE.
- Return assumptions, mode-specific: Portfolio Drawdown uses one "Expected total return"; Principal-Preserving splits into "Spendable investment return" (cash yield) and "Asset appreciation (not spent)"; Income Stream uses none.
- Inflation rate.
- Simple tax mode (Option B) in all three modes: grosses up spending by expenses ÷ (1 − rate); a blunt estimate that taxes all income.
- Optional one-time home sale (proceeds + age) for Portfolio Drawdown and Principal-Preserving. The home itself is excluded from drawdown assets (liquid investments only).

MVP outputs:

- Compact summary cards only.
- Progress bar for FIRE readiness/coverage.
- Year-by-year projection table with actual calendar years.
- Calculation details/audit notes.
- Info icons for important terms.
- Clear planning-estimate disclaimer.

### Understand Portfolio

MVP portfolio model:

- One current/latest portfolio only.
- No historical dated records in Phase 1.
- Asset types:
  - stock
  - ETF
  - mutual fund/trust
  - crypto
  - bond/fixed income
  - cash
  - home
  - liability
  - other asset
- `option` exists in the type model but options pricing and active option workflow are deferred.
- Include account owner:
  - User 1
  - User 2
  - Joint
  - Child
  - Household shared for home/liability
- Account type is selected from controlled options, not free-typed.
- Tax treatment is auto-defaulted from account type when possible.
- Account owner and account type are first-class Phase 1 concepts. Do not expose a separate `Account name` field in the visible add/edit workflow unless the founder explicitly reverses this decision.
- Current account-type/tax-treatment defaults:
  - `Taxable Investment Account` -> `Taxable`
  - `Traditional 401(k)` and `Traditional IRA` -> `Tax-Deferred / Pre-tax`
  - `Roth 401(k)` and `Roth IRA` -> `Roth / After-tax`
  - `HSA` -> `HSA`
  - `Cash Account` and `Liability / Loan` -> `Not Applicable`
  - `Real Estate / Home` -> `Property / Other`
  - `Other Asset` -> `Other`
- Home and liability rows must be household shared.
- Market-priced holdings require units unless marked as plan-only/no-public-ticker.
- Collective investment trusts and other no-public-ticker plan holdings can be entered manually as plan-only market holdings.
- Include in FIRE defaults to yes for every asset type except real estate/home, which defaults to no and is never counted in the FIRE-asset total (a planned home sale is modeled as a one-time inflow in the FIRE inputs).
- Users can add, edit, delete, select, sort, and filter holdings.

MVP portfolio views:

- Key stats should respond to filters.
- Filters include scope/focus, owner, account/account type, tax treatment, collection, holding type, and detailed holdings search where available.
- Detailed holdings table should be fixed-height and scrollable.
- Focused holding/allocation views should also use fixed-height scroll when long.

### Collections

Collections are first-class allocation groups, not merely tags.

MVP collection behavior:

- User creates a collection with name and optional purpose.
- User selects holdings and adds them to a collection.
- Holdings can belong to multiple collections.
- Duplicate memberships must be deduped.
- User can view collection balance, percent of net worth, percent of FIRE assets, and holding mix inside the collection.
- User can edit/delete collections and remove memberships.

### Import/Export

MVP import/export:

- One import control and one export control for multiple file types.
- CSV and XLSX supported for portfolio rows.
- Current headers:
  - `type`
  - `name`
  - `symbol`
  - `account_owner`
  - `account_type`
  - `tax_bucket`
  - `include_in_fire`
  - `unit_price`
  - `units`
  - `balance`
  - `collections`
- The current implementation still imports/exports optional legacy `account_name` for backwards compatibility. This field is not a visible Phase 1 product concept and should not cause agents to reintroduce an Account Name input.
- Legacy `custom_group` import is still accepted and migrated into collections.
- Current gap: full workbook import/export for FIRE inputs, collections, and all local data is not implemented yet.

### Market Data

MVP market data:

- Provider: EODHD.
- Symbol search and EOD price refresh are manual, user-triggered actions.
- Do not add automatic refresh.
- Supported market-priced types:
  - stock
  - ETF
  - mutual fund/trust when searchable/supported
  - crypto
  - bond/fixed income where provider returns cleanly
- Unsupported prices fall back to manual entry.
- Options automated pricing is deferred.
- Do not repeat successful market-data caveats on every row.

### Calculators

MVP helper tools:

- Social Security benefit calculator.
- Mortgage calculator.
- Investment calculator.

Social Security current scope:

- Unofficial worker-benefit estimate.
- Compares age 62, full retirement age, and age 70.
- Uses AIME/PIA-style behavior with current constants in code.
- Includes annual earnings override for better accuracy.
- Does not model spouse, divorced-spouse, survivor, WEP/GPO, Medicare, taxes, or official SSA record import.

## Absolute No-Go / Feature Blacklist For Phase 1

Do not implement these without explicit founder approval:

- Brokerage or bank linking.
- Required sign-in.
- Supabase cloud sync in the visible Phase 1 UX.
- Historical net-worth records.
- Backtesting.
- Monte Carlo simulation.
- Advanced tax modeling.
- Full household Social Security spouse/survivor modeling.
- Options pricing.
- Automatic market-price refresh.
- Budgeting app features.
- Public marketing/landing page.
- Paid subscription or launch GTM.
- Investment, tax, legal, or financial advice language.
- Large multi-tab/sidebar app structure.
- Reintroducing the original broad PRD as the current MVP scope.

## Future Enhancements Considered

Phase 1.5 candidates:

- Full workbook JSON export/import for device transfer.
- Saved local scenarios.
- Scenario comparison: base / conservative / optimistic.
- Better FIRE charts: gap, projected assets, inflation-adjusted expenses, principal floor.
- Sample import template and example portfolio.
- More complete account-type/tax-treatment default mapping.
- Cleanup of legacy portfolio file fields such as `account_name` and `custom_group`, after an explicit migration/backward-compatibility decision.
- Concentration and allocation warnings for owner/account/tax/collection/holding-type views.
- FIRE Number by Withdrawal Rate quick calculator for 4%/5% rule estimates.
- Better Social Security estimator UX with saved assumptions.
- Asset Allocation Templates for Saved Paths (see dedicated section below; under evaluation for Phase 1).

### Asset Allocation Templates (under evaluation for Phase 1)

User-selected allocation templates for Saved Paths. The app must label these as **planning templates, not recommendations**, and must avoid investment-advice language.

MVP templates:

- Aggressive Growth: 100% Stocks.
- Growth 80/20: 80% Stocks / 20% Bond Equivalent.
- Growth 70/30: 70% Stocks / 30% Bond Equivalent.
- Balanced 60/40: 60% Stocks / 40% Bond Equivalent.
- Conservative 50/40/10: 50% Stocks / 40% Bond Equivalent / 10% Cash.
- Cash Buffer + Growth: 70% Stocks / 10% Bond Equivalent / 20% Cash.
- Custom.

The app should compare the current household allocation against the selected planning allocation and show **allocation drift** (target vs actual per asset role, and the gap).

#### Handling "S&P 500 Stocks" vs equivalent ETFs (key design decision)

The original template wording said "S&P 500 Stocks," but users rarely hold the exact same ticker. One person holds VOO, another IVV, SPY, or the mutual fund FXAIX/SWPPX; another holds a total-market fund like VTI that serves the same growth purpose. Matching templates by exact ticker would break for almost everyone.

Decision: templates are defined by **asset role, not by ticker**. For MVP there are three roles:

- **Stocks** — broad equity exposure. Any equity holding counts here, regardless of which S&P 500 / total-market ETF, index fund, or individual stock it is. (Internally this is the equity role; the UI may label it "Stocks (S&P 500 / broad US equity)" so it is honest about what it assumes.)
- **Bond Equivalent** — bonds and fixed income.
- **Cash** — cash and cash equivalents.

Each holding maps to a role automatically from its existing `type` field: `bond` → Bond Equivalent; `cash` → Cash; `stock` / `etf` / `mutual_fund` → Stocks. `crypto`, `home`, `liability`, and `other_asset` are excluded from the template comparison (or shown as "Other / not in template"). Because the match is by role, the exact S&P 500 ticker is never required — VOO, IVV, SPY, FXAIX, SWPPX, and VTI all count toward the Stocks target.

To stay accurate, add an optional **per-holding allocation-role override** (a small dropdown) so a user can correct a mapping the `type` can't infer — for example, reclassifying a holding, or later marking an international or gold ETF as a different role once those roles exist.

Explicit MVP limitation: the role model does **not** distinguish S&P 500 from total-market, international, small-cap, or sector equity — all are "Stocks." That is acceptable for the MVP stock/bond/cash templates, and it is exactly why the templates below are roadmap-only.

Roadmap allocation templates:

- All Weather.
- Permanent Portfolio.
- Three-Fund Global.
- Target-Date Glide Path.
- Risk Parity approximation.
- Bucket Strategy.

The MVP must **not** claim to fully model All Weather, Permanent Portfolio, or Risk Parity until the app supports the additional asset classes those strategies require — long-term Treasuries, international stocks, gold, and commodities — as distinct allocation roles. Until then, present them as labeled, simplified planning approximations or keep them disabled.

Phase 2+ backlog:

- Historical dated portfolio records.
- Portfolio performance/backtesting.
- Monte Carlo with transparent methodology.
- Advanced tax modeling.
- Spouse/survivor Social Security.
- Roth conversion and withdrawal-order planning.
- Supabase cloud sync with RLS.
- Optional account system.
- Brokerage/bank connections.
- Options pricing.
- Public beta/marketing page.

## Acceptance Criteria

### Product Acceptance

- A user can open `/app/fire-path` and understand that this is a private household FIRE planning workspace.
- A user can run all three FIRE modes without entering portfolio data.
- A user can add real portfolio rows, refresh supported prices manually, and use included FIRE assets in Portfolio Drawdown or Principal-Preserving FIRE.
- A user can create collections and inspect allocation inside a collection.
- A user can import and export portfolio rows as CSV/XLSX.
- A user can use simple inputs first and optional detailed expense/income sections later.
- The app never requires account login for Phase 1.

### Calculation Acceptance

- Portfolio Drawdown FIRE searches candidate FIRE ages and only succeeds when assets survive through life expectancy.
- Portfolio Drawdown FIRE shows implied withdrawal rate as an output.
- Annual expenses and passive income apply inflation only when their toggles are enabled.
- Optional expense categories replace simple annual expenses only when enabled.
- Optional income sources replace simple passive income only when enabled.
- Principal-Preserving FIRE searches candidate FIRE ages and reports the earliest age that preserves the FIRE-age principal floor through life expectancy; it shows `Not reached` when no age qualifies.
- Principal-Preserving FIRE never passes if projected ending assets fall below the FIRE-age principal floor.
- Income Stream FIRE is not allowed to imply portfolio survival because it does not model assets.
- Projection rows use actual calendar years.

### UX Acceptance

- Top navigation has only `Path to FIRE` and `Understand Portfolio`.
- Important buttons have easy-to-click touch targets.
- Numeric inputs can be fully cleared and replaced.
- Add/edit portfolio forms use account owner and account type, not a separate visible account-name field.
- Optional expense and income sections are collapsed by default.
- Expense Categories appears above Income Sources.
- Tables that can grow long use fixed-height scroll.
- Info icons reveal helpful term explanations.
- Errors are specific and domain-readable.
- Loading/local-save states are visible.
- Empty states explain what to do next without sounding like marketing.

### Technical Acceptance

- `npm test -- --run` passes.
- `npm run lint` passes.
- `npm run build` passes.
- Browser smoke covers:
  - `/app/fire-path`
  - `/app/fire-path/withdrawal-rate`
  - `/app/fire-path/principal-preserving`
  - `/app/fire-path/income-stream`
  - `/app/portfolio-lab`
  - calculator routes
  - import/export
  - EOD refresh fallback
- Do not claim cross-device data transfer is solved until full workbook export/import or cloud sync exists.
