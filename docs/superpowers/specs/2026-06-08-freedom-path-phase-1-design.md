# Household FIRE Planner Phase 1 Design

## Purpose

Phase 1 narrows Household FIRE Planner into a simple local-first FIRE planning tool. The app should open directly into a useful calculator, avoid account setup, and keep the portfolio workflow optional but functional.

This design supersedes the broader MVP plan for Phase 1 only. The original PRD remains valuable as a future-enhancement backlog, not the Phase 1 delivery target.

## Phase 1 Scope

Phase 1 includes only two app tabs in top navigation:

1. Path to FIRE
2. Understand Portfolio

There is no separate landing page in Phase 1. The default route should take the user straight to Path to FIRE.

There is no account option in the Phase 1 UI. Supabase Auth, cloud sync, settings, saved paths, historical records, social security, family planning, Monte Carlo, and advanced path comparison are documented as future enhancements.

Local IndexedDB autosave remains the Phase 1 persistence model.

## Navigation and Site Structure

The current sidebar should be removed for Phase 1. Navigation should be a simple top bar with:

- Household FIRE Planner product label
- Path to FIRE tab first
- Understand Portfolio tab second

The current Phase 1 default experience should be:

- `/` routes to Path to FIRE, or renders Path to FIRE directly.
- `/app` routes to Path to FIRE.
- `/app/fire-path` shows Path to FIRE.
- `/app/portfolio-lab` may remain as the URL for Understand Portfolio, or it may be renamed later; the visible tab label must be Understand Portfolio.

Non-Phase-1 routes should not appear in navigation. If kept in code for future reference, they should not distract the user.

## Path to FIRE

Path to FIRE is the first tab and the primary workflow.

The user can manually enter every aggregate number needed for a Phase 1 summary-level FIRE estimate. This should align with the original PRD's Simple FIRE Age and deterministic FIRE concepts without requiring the Phase 2 screens for detailed recurring expenses, income streams, saved paths, Social Security, or Monte Carlo.

- Current age
- Life expectancy
- Planned FIRE age, shown as Income Stream FIRE age or Principal-Preserving FIRE age by mode
- FIRE rule mode
- Current FIRE assets
- Annual expenses
- Retirement expenses inflation-adjusted toggle
- Optional expense categories override, collapsed by default
- Annual passive or guaranteed income after FIRE
- Passive/guaranteed income inflation-adjusted toggle
- Optional income sources override, collapsed by default
- Annual savings before FIRE
- Expected annual portfolio return
- Expected cash-generating investment return, for Principal-Preserving FIRE
- Inflation rate
- Withdrawal rate
- Tax mode
- Simple effective tax rate, when tax mode is simple

FIRE rule mode should support:

- Portfolio Drawdown FIRE
- Principal-Preserving FIRE
- Income Stream FIRE

Portfolio Drawdown FIRE is the default. Principal-Preserving FIRE and Income Stream FIRE split the older Passive Income Coverage concept into two clearer questions: whether assets can last when principal may be drawn down, whether assets can stay above the FIRE-age principal floor, and whether income streams alone cover expenses.

The calculation should output for Withdrawal-Rate FIRE:

- Annual portfolio-funded spending gap today
- Tax-adjusted annual spending gap today
- Today's FIRE number
- Current FIRE gap
- Inflation-adjusted FIRE target at the target-check year
- Projected FIRE assets at the target-check year
- Target reached status
- Target reached years and age, or "not reached"
- Portfolio survival result through life expectancy, only after the target is reached
- Ending balance at life expectancy, only after the target is reached

The calculation should output for Principal-Preserving FIRE:

- Coverage ratio
- Spendable income
- Annual cash-generating investment return
- Annual passive or guaranteed income
- Annual expenses
- Estimated Principal-Preserving FIRE status
- Principal floor
- Shortfall or surplus
- First cash shortfall age
- First principal dip age, if assets fall below the FIRE-age principal floor

The calculation should output for Income Stream FIRE:

- Income coverage ratio
- Annual passive or guaranteed income
- Annual expenses
- Estimated Income Stream FIRE status
- Shortfall or surplus
- First shortfall age, if income streams fail before life expectancy

Formula expectations:

- Annual portfolio-funded spending gap = max(0, annual expenses - annual passive or guaranteed income after FIRE)
- If tax mode is none, tax-adjusted annual spending gap = annual portfolio-funded spending gap.
- If tax mode is simple, tax-adjusted annual spending gap = annual portfolio-funded spending gap / (1 - simple effective tax rate).
- Today's FIRE number = current tax-adjusted annual spending gap / withdrawal rate.
- Current FIRE gap = max(0, today's FIRE number - current FIRE assets)
- Estimated target-reached years should account for current FIRE assets, annual savings before FIRE, expected annual portfolio return, inflation, and whether passive/guaranteed income grows with inflation.
- If the optional expense categories override is enabled, the app replaces the single annual expense amount with the sum of active expense-category rows for that year. This avoids double counting.
- Expense category rows are active from `startAge` through `endAge` when an end age is supplied, or indefinitely after `startAge` when end age is blank.
- Expense category rows can be inflation adjusted individually. An inflation-adjusted category grows by the plan inflation rate in projected years; a non-adjusted category stays flat in nominal dollars.
- If optional income sources are enabled, target-reached years should also count active detailed income sources that start before the estimated FIRE age as additional pre-FIRE cash flow.
- For each projected year, the app should compare projected FIRE assets against that year's inflation-adjusted FIRE target, not only against today's FIRE number.
- If current FIRE assets already meet or exceed today's FIRE number, target-reached years should be 0.
- Target reached age = current age + target-reached years.
- If projected assets never catch the inflation-adjusted target before life expectancy, show "not reached" rather than presenting an estimated FIRE age.
- Portfolio survival should test whether assets last from the target-reached age through life expectancy.
- Before FIRE, assets grow by expected annual portfolio return and annual savings are added once per year.
- Before FIRE, active optional income-source rows are also added to cash flow when their start age has arrived and their end age has not passed.
- Before FIRE, the simple passive/guaranteed income bucket is not added to assets because it has no start-age timing. Users who want timed income before FIRE should use `Income Sources (Optional)`.
- After FIRE, annual expenses grow by inflation each year only when the user enables the retirement-expenses inflation-adjusted toggle.
- After FIRE, annual passive/guaranteed income grows by inflation only when the user enables the income inflation-adjusted toggle.
- If the optional income sources override is enabled, the app replaces the single passive/guaranteed income amount with the sum of active income-source rows for that year. This avoids double counting.
- Income source rows are active from `startAge` through `endAge` when an end age is supplied, or indefinitely after `startAge` when end age is blank.
- Income source rows can be inflation adjusted individually. An inflation-adjusted source grows by the plan inflation rate in projected years; a non-adjusted source stays flat in nominal dollars.
- After FIRE, the tax-adjusted spending gap is withdrawn and assets grow by expected annual portfolio return.
- A Withdrawal-Rate FIRE result passes survival when the target is reached and selected FIRE assets never fall below $0 before life expectancy.
- Principal-Preserving FIRE does not count annual retirement expenses before the Principal-Preserving FIRE age.
- Before the Principal-Preserving FIRE age, assets grow by expected annual portfolio return and annual savings before FIRE are added once per year.
- Before the Principal-Preserving FIRE age, active optional income-source rows are also added when their start age has arrived and their end age has not passed.
- At the Principal-Preserving FIRE age, projected assets become the principal floor.
- At and after the Principal-Preserving FIRE age, spendable income equals income streams plus cash-generating investment return.
- Cash-generating investment return is a separate percentage input for dividends, interest, and distributions only; it should not include unrealized appreciation.
- Principal-Preserving FIRE passes when projected ending assets stay at or above the FIRE-age principal floor through life expectancy.
- Income Stream FIRE does not count annual retirement expenses before the Income Stream FIRE age.
- Income Stream FIRE ignores current FIRE assets, annual savings before FIRE, expected portfolio return, and portfolio depletion.
- At and after the Income Stream FIRE age, passive or guaranteed income is compared against annual retirement expenses for every projected year through life expectancy.
- Income Stream FIRE passes when annual passive or guaranteed income is greater than or equal to annual expenses for every projected year from the Income Stream FIRE age through life expectancy.
- If Principal-Preserving FIRE or Income Stream FIRE passes, estimated FIRE age is the selected planned FIRE age, or current age if the planned age is already in the past.
- If the selected mode does not pass under the summary assumptions, show "not reached under these assumptions" rather than inventing an age.
- Inputs should validate empty, negative, and invalid numeric values with clear inline messages.
- Expected annual portfolio return, inflation rate, withdrawal rate, and simple effective tax rate should be entered as user-facing percentages, such as `7` for 7%.
- Current age must be less than life expectancy.
- Planned FIRE age must be a whole year and, when Principal-Preserving FIRE or Income Stream FIRE is active, must be less than or equal to life expectancy.
- Withdrawal rate must be greater than 0.
- Simple effective tax rate must be less than 100%.

Important Phase 1 simplifications:

- Annual passive or guaranteed income remains one summary number by default.
- Users can optionally open `Expense Categories (Optional)` and turn on `Use expense categories instead of the simple annual expense amount` for more accurate expense timing. Phase 1 expense category types include housing, healthcare, insurance, food, transportation, travel, taxes, childcare/education, debt, general living, and other expense.
- Users can optionally open `Income Sources (Optional)` and turn on `Use income sources instead of the simple passive income amount` for more accurate source timing. Phase 1 source types include Social Security, rental income, pension, annuity, part-time income, and other income.
- Social Security source rows use start age only. The separate Social Security calculator should be linked from this section so users can estimate age 62, full retirement age, or age 70 benefits before entering an annual amount.
- Annual expenses remains the simple-mode summary number. Phase 1 now also supports optional detailed expense categories with start/end timing for progressive accuracy.
- Expected annual portfolio return is one summary number. Phase 2 can replace this with allocation-based assumptions and Monte Carlo.
- Current age and life expectancy are summary inputs. Phase 2 can add birthdates, family planning horizon, and household members.

Path to FIRE should also include an optional action:

- Use Portfolio FIRE Assets

That action should set Current FIRE assets from the sum of portfolio rows where Include in FIRE is Yes. The user should still be able to override the number manually afterward.

## Understand Portfolio

Understand Portfolio is the second tab and supports the FIRE calculator.

Phase 1 portfolio data represents only the user's latest/current portfolio. There are no historical dated records in the Phase 1 UI.

The top section should be a visual Portfolio Overview, not only a static stat strip.

The overview should include key stats:

- Analyzed net worth
- Assets
- Liabilities
- Included in FIRE
- Last EOD refresh status or date

The overview should use the approved Option A model: a guided lens bar that keeps filters simple while still answering household allocation questions. The controls should be:

- Portfolio scope: All portfolio or FIRE included
- Analyze by: Account owner, Account type, Tax treatment, or Collection
- Focus: All selected scope or one value from the selected lens, such as User 1, User 2, Roth IRA, Tax-Deferred / Pre-tax, or a collection name
- Allocation view: Market Holding Risk Exposure or Holdings

The overview should answer these Phase 1 questions directly:

- How much of the selected scope belongs to User 1, User 2, Joint, or Child?
- For a selected owner, account type, tax treatment, or collection, what percent is in Stock, ETF, Mutual Fund, Crypto, Bond / Fixed Income, and Cash?
- For a selected owner, account type, tax treatment, or collection, what percent is in specific holdings such as TSLA, BTC, VTI, or cash?
- For example, the user should be able to select Tax treatment = Tax-Deferred / Pre-tax and Allocation view = Holdings to see TSLA as a percentage of tax-deferred assets.
- Home, liabilities, and other non-market direct-balance rows are excluded from Market Holding Risk Exposure so the chart answers risk-allocation questions instead of net-worth composition questions.
- Bond / Fixed Income is supported in Phase 1 as a risk category for direct bond rows, bond ETFs, bond mutual funds, and cash-like fixed-income holdings when EODHD search identifies or the app can reasonably infer them.

Option C, progressive drilldown, remains the fallback direction if Option A becomes too dense after real portfolio testing. The fallback should start at household level, then let the user drill into owner, account wrapper, tax treatment, collection, and holding details.

The overview should include a consumer-friendly allocation visual, such as a ring/pie-style mix plus bar breakdown. It should not look like an enterprise BI dashboard.

Provider warning text from EOD refresh should be quiet. A successful refresh should show a compact status such as `3 prices updated`; long market-data caveats should move into a small note or tooltip instead of occupying the primary status area.

The portfolio tab should support file-based portfolio entry:

- One secondary Import icon/menu with CSV and Excel `.xlsx` options
- One secondary Export icon/menu with CSV and Excel `.xlsx` options

This is required for Phase 1 because users may have dozens of holdings and should not need to enter every row manually.

Import should accept one row per current asset or liability. The expected file columns are:

- `type`
- `name`
- `symbol`
- `account_owner`
- `account_name`
- `account_type`
- `tax_bucket`
- `include_in_fire`
- `unit_price`
- `units`
- `balance`
- `collections`

The `account_name` column is retained for older imports/exports and possible future account-level enhancement, but Phase 1 manual entry should not ask users to type Account Name. The `tax_bucket` file column represents the visible Tax Treatment field. The legacy `custom_group` column is accepted on import for backward compatibility, but new exports should use `collections`.

Import behavior:

- CSV and XLSX use the same column names.
- Column names should be case-insensitive and tolerate spaces, such as `Tax Treatment` or legacy `Tax Bucket`.
- `type`, `name`, and either `balance` or `unit_price` plus `units` are required.
- Market-priced asset rows can calculate balance from `unit_price * units`.
- Direct-balance rows should use `balance`.
- Liability rows should be stored and displayed as negative balances, even if the imported balance is positive.
- `include_in_fire` should accept `yes/no`, `true/false`, and `1/0`.
- `collections` should accept semicolon-separated collection names and create memberships for imported rows.
- If `collections` is blank or missing, legacy `custom_group` values should be imported as collection names.
- Invalid rows should be reported with row numbers and clear messages.
- A partial import should add valid rows and report invalid rows.

Export behavior:

- CSV and XLSX exports should include the same columns listed above.
- Export should include the current/latest table only, not hidden historical records.
- Exported liability balances should remain negative so re-import is stable.

The main section should be a single simple table with these columns:

- Select
- Type
- Holding Type
- Name / Symbol
- Account Owner
- Account Type
- Tax Treatment
- Include in FIRE
- Unit Price
- Units
- Balance
- Collections
- Actions

The table should include a gear icon for local column preferences. Selection and Actions stay visible so users can still batch manage rows. All other table columns should be visible by default and user preferences should be stored locally.

The table should support multi-select batch deletion. Deleting selected portfolio rows also removes their collection memberships.

Supported Type values:

- Market Holding
- Cash
- Home
- Liability
- Other Asset

Market Holding is the single add/edit path for Stock, ETF, Mutual Fund, Crypto, and supported Bond / Fixed Income symbols. The saved row should keep the exact type returned by EODHD, but the user should not have to pick those types separately.

For market holdings:

- Balance = Unit Price x Units
- Unit Price is filled by the manual EOD refresh action or preserved through import.
- Unit Price is not manually typed in the Phase 1 add/edit form.
- Units are editable through the add/edit workflow.
- Holding entry should be one combined EODHD-backed search/select box that returns Stock, ETF, Mutual Fund, and Crypto results in the same list.
- Selecting a holding should not fetch price automatically. The user controls cost by clicking Refresh EOD Prices when ready.
- Unit Price should display as `--` until a refresh or import supplies a price.

For Cash, Home, Liability, and Other Asset:

- Balance is entered directly.
- Unit Price and Units should display as `--` in the table.
- Home, Liability, and Other Asset name entry should provide suggested names while still allowing the user to type any custom name.

Liabilities should appear in the same table as negative balances.

Include in FIRE controls whether a row contributes to the Path to FIRE portfolio-derived asset value. The Phase 1 default should be:

- Market assets: Yes
- Cash: Yes
- Home: Yes
- Liability: Yes
- Other Asset: Yes

The user can override Include in FIRE for any row.

Custom Group was originally defined as a user-entered text value, with no separate group-management screen.

This is now superseded by the approved Portfolio Collections design:

```text
docs/superpowers/specs/2026-06-08-portfolio-collections-design.md
```

Collections are first-class user-defined analysis groups, while Account Owner, Account Type, Tax Treatment, and Include in FIRE remain separate concepts.

Phase 1 collection behavior:

- Users can create, edit, and delete collections.
- Collection names must be unique case-insensitively.
- Users can select holdings from the portfolio table and add them to a collection.
- A holding can belong to more than one collection.
- Deleting a collection does not delete the underlying portfolio rows.
- Deleting a portfolio row removes its collection memberships.
- The collection management section stays lightweight and shows assigned-row count only. Allocation analysis for a collection happens through Portfolio Overview by choosing Analyze by = Collection.
- CSV/XLSX export includes collection names in the `collections` column.
- CSV/XLSX import preserves collection names and memberships.

Phase 1 account metadata behavior:

- Account Owner is a switch with four choices: User 1, User 2, Joint, and Child.
- Home and liability rows are forced to Household shared because they should not be treated as owner-specific portfolio holdings in Phase 1 analysis.
- Account Type is selected from a fixed list instead of typed manually.
- Account Type auto-fills Tax Treatment, while still allowing the user to override Tax Treatment if needed.
- Account Owner, Account Type, Tax Treatment, Include in FIRE, and Type stay sticky after adding a row so users can enter multiple holdings from the same household account without reselecting context.
- Account Name is hidden from the Phase 1 manual form to reduce input burden. The underlying type and import/export compatibility may keep `accountName` / `account_name` for older files and future enhancement.
- The table shows Account Owner and Account Type as separate default columns.

Phase 1 Account Type values:

- Taxable Investment Account
- Traditional 401(k)
- Traditional IRA
- Roth 401(k)
- Roth IRA
- HSA
- Cash Account
- Crypto Account / Wallet
- Real Estate / Home
- Liability / Loan
- Other Asset

Phase 1 Tax Treatment values:

- Taxable
- Tax-Deferred / Pre-tax
- Roth / After-tax
- HSA
- Not Applicable
- Property / Other
- Other

Default Account Type to Tax Treatment mapping:

- Taxable Investment Account -> Taxable
- Traditional 401(k) / Traditional IRA -> Tax-Deferred / Pre-tax
- Roth 401(k) / Roth IRA -> Roth / After-tax
- HSA -> HSA
- Cash Account -> Not Applicable
- Crypto Account / Wallet -> Taxable
- Real Estate / Home -> Property / Other
- Liability / Loan -> Not Applicable
- Other Asset -> Other

## Phase 1 Data Shape

The Phase 1 UI should work from a simplified current-state model:

```ts
type Phase1PortfolioItem = {
  id: string;
  type: "stock" | "etf" | "mutual_fund" | "crypto" | "cash" | "home" | "liability" | "other_asset";
  name: string;
  symbol?: string;
  accountOwner?: string;
  accountName?: string;
  accountType?: string;
  taxBucket: string;
  includedInFire: boolean;
  unitPrice?: number;
  units?: number;
  balance: number;
  customGroup?: string;
  priceStatus?: "manual" | "refreshed" | "unsupported" | "failed";
};

type Phase1PortfolioCollection = {
  id: string;
  name: string;
  purpose?: string;
  targetMinPercent?: number;
  targetMaxPercent?: number;
  createdAt: string;
  updatedAt: string;
};

type Phase1PortfolioCollectionMembership = {
  collectionId: string;
  portfolioItemId: string;
};

type Phase1FireInputs = {
  currentAge: number;
  lifeExpectancy: number;
  fireRuleMode: "withdrawal_rate" | "income_stream" | "principal_preserving";
  currentFireAssets: number;
  passiveIncomeFireAge: number;
  annualExpenses: number;
  expensesInflationAdjusted: boolean;
  useExpenseCategoriesOverride: boolean;
  expenseCategories: Array<{
    id: string;
    type:
      | "housing"
      | "healthcare"
      | "insurance"
      | "food"
      | "transportation"
      | "travel"
      | "taxes"
      | "childcare_education"
      | "debt"
      | "living"
      | "other";
    annualAmount: number;
    startAge: number;
    endAge?: number;
    inflationAdjusted: boolean;
  }>;
  annualPassiveGuaranteedIncome: number;
  passiveGuaranteedIncomeInflationAdjusted: boolean;
  useIncomeSourcesOverride: boolean;
  incomeSources: Array<{
    id: string;
    type: "social_security" | "rental_income" | "pension" | "annuity" | "part_time_income" | "other";
    owner: "user_1" | "user_2" | "joint" | "child" | "household";
    annualAmount: number;
    startAge: number;
    endAge?: number;
    inflationAdjusted: boolean;
  }>;
  annualSavingsBeforeFire: number;
  expectedAnnualPortfolioReturnPercent: number;
  expectedCashGeneratingReturnPercent: number;
  inflationRatePercent: number;
  withdrawalRatePercent: number;
  taxMode: "none" | "simple";
  simpleEffectiveTaxRatePercent: number;
};
```

Existing broader plan types may be retained for future work, but the Phase 1 screens should not force users through historical snapshots, saved paths, account sync, or PRD-era complexity.

Internal future-code types may retain option placeholders, but Phase 1 form entry and import should not expose or accept option holdings. Options move to the future-enhancement backlog.

## Add/Edit Asset Section

There should be one bottom section for adding different assets and liabilities.

The form should change based on selected Type:

For market-priced assets:

- Type: Market Holding
- Holding: one combined search/select box for Stock, ETF, Mutual Fund, and Crypto
- Account Owner
- Account Type
- Tax Treatment
- Include in FIRE
- Units

For direct-balance assets:

- Type
- Name
- Account Owner
- Account Type
- Tax Treatment
- Include in FIRE
- Balance

Buttons must be easy to click:

- Minimum practical hit area around 44px tall
- Clear labels
- High contrast
- No tiny icon-only primary actions
- Secondary import/export icon actions must have accessible labels and 44px hit areas
- Disabled/loading states should remain visibly clickable or clearly disabled

## EODHD Price Refresh

Phase 1 includes a button-based EOD price refresh in Understand Portfolio.

The refresh must not run automatically. The user clicks:

- Refresh EOD Prices

The refresh should:

- Use `EODHD_API_KEY` from the server environment.
- Keep the API key out of browser/client code.
- Deduplicate symbols before fetching prices.
- Update Unit Price for supported market-priced assets.
- Leave Cash, Home, Liability, and Other Asset rows unchanged.
- Show clear per-row or summary feedback for unsupported or failed symbols.
- Keep generic market-data delay/staleness warnings in summary feedback, not repeated under every successfully refreshed row.
- Never let one failed symbol break the full refresh.
- Never fetch prices when a holding is selected from search; only the explicit refresh button should call the price endpoint.

Current environment variables:

```bash
EODHD_API_KEY=<server-side key>
MARKET_DATA_PROVIDER=eodhd
```

CSV/XLSX import can preserve a Unit Price as a fallback when EOD refresh is unavailable for a holding. Phase 1 does not expose an on-screen manual market-price entry field.

## Local Storage

Phase 1 should use IndexedDB autosave only.

The app should save:

- Portfolio rows
- FIRE calculator inputs
- EOD refresh metadata
- Last import/export status message

The UI should not expose Supabase account creation or cloud save/load in Phase 1.

## Future Enhancements

The following are out of scope for Phase 1 but should remain documented for later work:

- Supabase account login and cloud sync
- Supabase `plan_documents` table and RLS policies
- Full historical dated portfolio records
- Wealth Records
- Saved Paths
- Path Comparison
- Family Plan
- Social Security Guide
- Monte Carlo simulation
- Advanced tax modeling
- Account-level tax settings
- Multiple saved FIRE scenarios
- Option holdings, import support, and contract pricing
- Landing page or marketing site
- Historical import/export of dated records
- Public launch hardening and legal review

Current Supabase setup for future enhancement:

- Project URL is configured through `NEXT_PUBLIC_SUPABASE_URL`.
- Browser-safe key is configured through `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `plan_documents` has RLS policies for select, insert, update, and delete by `auth.uid() = user_id`.
- Phase 1 should leave this setup unused in the UI.

## Testing and Verification

Implementation should include focused tests for:

- Portfolio row balance calculation by asset type
- FIRE asset sum from Include in FIRE rows
- CSV and XLSX portfolio import/export parsing and round trip
- Mixed market-holding search UI that combines Stock, ETF, Mutual Fund, and Crypto results
- Simple FIRE number, tax-adjusted spending gap, and years-to-FIRE calculation
- Deterministic Withdrawal-Rate FIRE survival through life expectancy
- Principal-Preserving FIRE principal-floor status and Income Stream FIRE coverage status
- EOD refresh behavior for success, partial failure, unsupported symbols, and missing API key

Manual browser verification should confirm:

- Default route opens Path to FIRE
- Top navigation has only two tabs
- No sidebar appears
- No account/login/cloud-save flow appears in Phase 1 UI
- Buttons are easy to click on desktop and mobile
- Portfolio table remains readable without text overlap
- EOD refresh button shows loading and result feedback
