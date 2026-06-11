# Household FIRE Planner — Full Codex Handoff PRD v1.7

## 0. Purpose of This Document

This is the **full integrated PRD and Codex handoff document** for Household FIRE Planner.

This v1.7 update adds:
- Legal and compliance guardrails
- Earliest FIRE age feature logic
- Clear distinction between Simple FIRE Age, Deterministic FIRE Age, and Monte Carlo FIRE Age
- MVP FIRE Rule Modes limited to Withdrawal-Rate FIRE and Income-Only FIRE
- Principal Preservation FIRE and Hybrid FIRE moved to next-development roadmap
- A required in-product Roadmap / Next Development section
- Safer product language for retirement-readiness outputs

It replaces:
- `freedom_path_codex_handoff_prd_v1_3.md`
- `freedom_path_prd_v1_4_historical_net_worth_addendum.md`

Do **not** feed only the historical net-worth addendum to Codex. That addendum was not a full PRD. Use this full v1.4 document instead.

---

## 1. Product Summary

Household FIRE Planner is an account-optional FIRE planning and wealth tracking website.

Users can:
- Use the app without an account
- Optionally create an account to save and sync history
- Enter assets, liabilities, stock holdings, cash balances, manual assets, and debt balances
- Enter historical effective-dated holdings and balances
- Track net-worth growth over time
- Fetch end-of-day stock prices
- Enter expenses, income, Social Security assumptions, and tax assumptions
- Calculate FIRE timing
- Run historical Monte Carlo simulations
- Compare many Saved Paths side by side

### Product Promise

```text
No login required to start.
Optional account for saving and syncing.
No brokerage connection required.
End-of-day stock pricing for market-sensitive portfolios.
Historical net-worth tracking from effective-dated snapshots.
Planning estimates only, not financial advice.
```

---

## 2. Hard Budget Constraint

The owner will build this personally using Codex / AI-assisted development.

### Initial cash build budget

```text
Maximum: $150
Target: $10–$30
```

This excludes:
- Owner’s time
- Existing laptop/computer
- Existing AI coding subscription if already paid

### Cost Rules

Use:
- Free hosting tier
- Free Supabase tier
- Free email/auth tier
- Free market data tier
- Open-source UI libraries
- Static historical data files
- No paid developers
- No paid agency
- No paid real-time market data
- No brokerage/bank connections

### Starting Cost Plan

| Item | MVP Choice | Cost |
|---|---|---:|
| Domain | Buy one domain | $10–$25/year |
| Hosting | Vercel/Cloudflare/Netlify free | $0 |
| Database/Auth | Supabase free | $0 |
| Email | Supabase auth email / free tier | $0 |
| Market data | Free EOD API tier + cache | $0 |
| Historical Monte Carlo data | Static bundled files | $0 |
| UI library | shadcn/ui + Tailwind | $0 |
| Charts | Recharts | $0 |
| Monitoring | Skip or free tier | $0 |
| Analytics | Skip or free tier | $0 |
| Legal docs | Basic DIY disclaimer | $0 |
| Buffer | Reserved | $125+ |

---

## 3. Product Language

Avoid the word:

```text
Dashboard
```

Use aspirational labels:

```text
Product: Household FIRE Planner
Main overview: Freedom Map
Portfolio area: Portfolio Lab
Retirement planner: FIRE Path
Planning scenarios: Saved Paths
Comparison: Path Comparison
Household planning: Family Plan
Social Security area: Social Security Guide
Income planning: Freedom Income
Records/history: Wealth Records
Settings: Settings
```

---

## 4. Access Model

## 4.1 Guest Mode

No account required.

Guest users can:
- Create plans
- Save plans locally
- Export/import plan JSON
- Enter assets and liabilities
- Enter historical holdings and balances
- Fetch end-of-day prices
- Run FIRE projections
- Run Monte Carlo simulations
- Compare Saved Paths

Storage:

```text
IndexedDB
```

Required guest-mode warning:

```text
Guest plans are saved on this device. Export a backup if you want to protect against browser data loss or move your plan to another device.
```

## 4.2 Optional Account Mode

Users may create an account to:
- Save plans in cloud
- Sync across devices
- Preserve historical records
- Restore plans later

Cloud storage:

```text
Supabase Auth + Supabase Postgres
```

Required copy:

```text
You can use Household FIRE Planner without an account. Create an optional account only if you want to save and sync your plans across devices.
```

Account creation must remain optional.

---

## 5. Recommended Tech Stack

```text
Next.js
TypeScript
Tailwind CSS
shadcn/ui
Recharts
zod
react-hook-form
date-fns
Dexie.js
Supabase
```

Suggested packages:

```text
next
typescript
tailwindcss
shadcn/ui
recharts
zod
react-hook-form
date-fns
dexie
@supabase/supabase-js
```

---


---

## 5A. Legal and Compliance Guardrails

This product stores and analyzes sensitive financial planning information. The app must be designed as a **planning and tracking tool**, not as an investment adviser, tax adviser, legal adviser, broker, or trading platform.

This section is a product-risk guardrail, not a legal opinion. Before a broad public or paid launch, the owner should consider a legal review.

### 5A.1 Core Product Positioning

Household FIRE Planner may:

```text
Let users enter their own assets, liabilities, expenses, income, Social Security assumptions, tax assumptions, and planning scenarios.
Calculate planning estimates based on user-provided assumptions.
Show historical net-worth growth.
Show estimated earliest FIRE age under a Saved Path.
Run deterministic projections.
Run Monte Carlo simulations using historical sampled market paths.
Show end-of-day stock values with source/date.
Provide educational explanations of calculations.
```

Household FIRE Planner must not:

```text
Recommend buying, selling, or holding specific securities.
Recommend a specific portfolio allocation as optimal for a user.
Recommend a specific retirement decision.
Say a user is guaranteed to retire safely.
Say a user should retire at a certain age.
Present Social Security estimates as official.
Present tax outputs as tax advice.
Execute trades.
Connect to brokerage or bank accounts in MVP.
Ask for Social Security numbers.
Store brokerage credentials.
Use real-time market data in MVP.
Redistribute market data beyond provider terms.
```

### 5A.2 Investment Advice Guardrails

The app must avoid language that sounds like personalized investment advice.

Avoid:

```text
You should retire at 47.
You can safely retire now.
You should buy VOO.
You should sell TSLA.
Your optimal allocation is 80/20.
This portfolio is best for you.
```

Use:

```text
Estimated earliest FIRE age under this Saved Path.
Based on your assumptions, this path first passes at age 47.
This is a planning estimate, not a recommendation.
This allocation is used for projection purposes only.
```

### 5A.3 Earliest FIRE Age Wording

The app must label FIRE-age outputs as estimates.

Required labels:

```text
Simple FIRE Age Estimate
Deterministic FIRE Age Estimate
Monte Carlo FIRE Age Estimate
```

Required explanatory copy:

```text
These estimates are based on the assumptions you entered. They are not a guarantee and are not financial advice.
```

Allowed result wording:

```text
Under this Saved Path, the earliest deterministic FIRE age is estimated at 48 years and 4 months.
```

```text
At age 51, this path survived in 91.3% of 5,000 simulated historical market paths.
```

Disallowed result wording:

```text
You should retire at 51.
You are safe to retire at 51.
You have a 91.3% chance of success.
```

### 5A.4 Tax Guardrails

The app may provide simplified tax estimates, but it must not provide tax advice.

Required wording:

```text
Tax calculations are simplified planning estimates and are not tax advice.
```

MVP tax features must stay limited to:
- No tax
- Simple blended effective tax rate
- Account-level effective tax rates
- Pro-rata withdrawal assumption

Do not include in MVP:
- Tax optimization
- Roth conversion recommendations
- Required minimum distribution recommendations
- Exact federal/state tax liability
- ACA subsidy optimization
- Capital-gains tax-lot optimization

### 5A.5 Social Security Guardrails

The Social Security Guide must be labeled unofficial.

Required wording:

```text
This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record and may differ from your official Social Security estimate.
```

The app must not ask for:
- Social Security number
- SSA username
- SSA password
- Government login credentials

The app should let users choose:
- Direct entry
- Optional formula calculator

For privacy, default behavior should be:

```text
Save the Social Security estimate result.
Do not save detailed annual earnings history unless the user explicitly chooses to save it.
```

### 5A.6 Data Privacy and Security Guardrails

The app handles sensitive financial planning data even without brokerage connections.

MVP requirements:
- Guest mode stores data locally in IndexedDB.
- Cloud sync is optional.
- No SSN.
- No brokerage credentials.
- No bank credentials.
- No account numbers required.
- Supabase Row Level Security must be enabled.
- Users can export their data.
- Users can delete cloud plans.
- HTTPS only.
- Environment variables must be used for secrets.
- API keys must not be exposed in browser code.
- Basic privacy policy and disclaimer must be included before sharing widely.

Required guest-mode warning:

```text
Guest plans are saved on this device. Export a backup if you want to protect against browser data loss or move your plan to another device.
```

Required cloud-save wording:

```text
Creating an account lets you save and sync your plan. You can still use Household FIRE Planner without an account.
```

### 5A.7 Market Data Guardrails

End-of-day stock pricing is required for MVP, but market-data use must respect provider terms.

Requirements:
- Use end-of-day data only.
- Show source and price date.
- Cache conservatively.
- Allow manual price override.
- Do not display or redistribute vendor data beyond the chosen provider’s terms.
- Check data-provider terms before broader public launch.
- Do not use real-time data in MVP.
- Do not expose paid API keys in client code.

Required wording near stock prices:

```text
Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values.
```

### 5A.8 Disclaimers Required in Product

General disclaimer:

```text
Household FIRE Planner provides planning estimates only. It is not investment, tax, legal, or financial advice.
```

Monte Carlo disclaimer:

```text
Monte Carlo results are based on sampled historical market paths and assumptions you provide. They are not a guarantee of future results.
```

Social Security disclaimer:

```text
This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record and may differ from your official Social Security estimate.
```

Market data disclaimer:

```text
Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values.
```

Tax disclaimer:

```text
Tax calculations are simplified planning estimates and are not tax advice.
```

### 5A.9 Legal Review Trigger Points

The owner should consider legal review before:
- Charging users money
- Opening unrestricted public signup
- Marketing the app as financial planning or retirement advice
- Adding recommendations
- Adding portfolio allocation suggestions
- Adding tax optimization
- Adding brokerage/bank connections
- Adding paid market data
- Adding account aggregation
- Storing significantly more personal financial data
- Supporting many unrelated public users

### 5A.10 Legal Source Context for Developer

The product should be conservative because U.S. investment-adviser rules can apply broadly where a person or business, for compensation, is in the business of advising others about securities or issuing securities analyses. SEC robo-adviser guidance is also relevant if automated software provides investment-advisory services. FTC guidance is relevant because the product stores sensitive financial data. Market-data vendors may restrict redistribution or display of their data.

Source references for owner/legal review:
- SEC Investment Adviser Regulation: https://www.sec.gov/divisions/investment/iaregulation.shtml
- Investment Advisers Act definition, 15 U.S.C. § 80b-2(a)(11): https://www.law.cornell.edu/uscode/text/15/80b-2
- SEC Robo-Advisers guidance: https://www.sec.gov/investment/im-guidance-2017-02.pdf
- FTC Start with Security: https://www.ftc.gov/business-guidance/resources/start-security-guide-business
- FTC Safeguards Rule: https://www.ftc.gov/legal-library/browse/rules/safeguards-rule
- Financial Modeling Prep pricing/data display note: https://site.financialmodelingprep.com/pricing-plans
- SSA retirement benefit calculation: https://www.ssa.gov/OACT/ProgData/retirebenefit2.html
- SSA PIA formula: https://www.ssa.gov/oact/cola/piaformula.html

## 6. MVP Scope

## 6.1 P0 Must-Have

### A. App Foundation

- Public website
- Guest mode
- Optional account mode
- IndexedDB local save
- Supabase cloud save
- JSON export/import
- Required disclaimers
- Mobile-friendly enough for testing

### B. Historical Net Worth Engine

This is a must-have.

The app must not store only current values for important financial records.

Users need to enter:

```text
AAPL = 100 shares as of 2024-06-01
AAPL = 50 shares as of 2025-06-01
```

Then the app must calculate historical net worth using the correct value for each historical period.

Interpretation:

```text
2024-06-01 through 2025-05-31: 100 shares
2025-06-01 forward: 50 shares
```

No buy/sell transaction is required for MVP.

### C. Effective-Dated Records

The MVP must support:

```text
Effective-dated quantity snapshots for stocks/ETFs/crypto
Effective-dated cash balance snapshots
Effective-dated manual asset valuation snapshots
Effective-dated liability balance snapshots
Historical net-worth calculation
Historical net-worth chart
Historical date drilldown
Historical EOD price lookup or manual price override
Cache invalidation after old snapshot edits
```

### D. End-of-Day Stock Price Integration

This is critical for stock-heavy users.

Users can enter:
- Ticker
- Shares
- Effective date
- Portfolio group
- Cost basis optional
- Manual price override optional

The app should fetch latest available end-of-day price and calculate:

```text
market_value = shares * latest_eod_price
```

Required behavior:
- Show price date
- Show price source
- Show stale/missing data warning
- Allow manual price override
- Cache prices daily by ticker
- Never fetch the same ticker repeatedly in one day unless user requests refresh

### E. Basic Portfolio Lab

P0 Portfolio Lab is simple.

Must show:
- Holdings by portfolio group
- Current value by holding
- Historical quantity timeline per holding
- Total value by group
- Combined investable assets
- Allocation by group
- Manual refresh prices
- Last price update timestamp

Do not build advanced analytics yet.

### F. FIRE Path

- Individual Planning
- Family Planning
- Current age or birthdate
- Life expectancy
- Family horizon = later of two life expectancies
- Target retirement date optional
- Calculated FIRE date
- Withdrawal rate default: 5%
- First-year withdrawal increases by inflation each year
- Global deterministic inflation rate
- Annual savings/contribution
- Simple FIRE number
- Deterministic FIRE projection
- Years left to FIRE
- Simple FIRE Age Estimate
- Deterministic FIRE Age Estimate
- Monte Carlo FIRE Age Estimate
- FIRE Rule Mode selector for MVP:
  - Withdrawal-Rate FIRE
  - Income-Only FIRE
- Principal Preservation FIRE and Hybrid FIRE are documented as roadmap items, not MVP modes

### G. Saved Paths

Users can:
- Create Saved Path
- Duplicate
- Rename
- Archive
- Mark default
- Compare many paths side by side

Examples:
- Base Path
- Retire Earlier
- Retire Later
- No Social Security
- Include Home Equity
- High Inflation
- Lower Spending
- Family Plan

### H. Expenses

Recurring expenses support:
- Name
- Category
- Amount
- Monthly or annual
- Exact start date
- Exact end date
- Relative start/end event
- Month/year offset
- Inflation-adjusted flag
- Essential/discretionary flag

### I. Income

Income streams support:
- Name
- Type
- Amount
- Monthly or annual
- Exact start/end date
- Relative start/end event
- Month/year offset
- Inflation-adjusted flag
- Taxable flag

Income types:
- Social Security
- Pension
- Rental income
- Part-time work
- Business income
- Portfolio income
- Other

### J. Planning Events

Support:
- Retirement Date
- Social Security Claiming Date
- Healthcare Transition
- Mortgage Payoff Date
- Debt Payoff Date
- Home Sale Date
- Custom Event

Default Healthcare Transition:

```text
Age 65, editable
```

### K. Social Security Guide

Social Security has two user paths:

1. Direct entry
2. Optional calculator

Direct entry is required.

The basic formula calculator is also included in MVP because it has no API cost and does not require SSN.

#### Direct Entry Fields

- Person
- Monthly benefit in today’s dollars
- Claiming age/date
- Include/exclude in FIRE plan
- Inflation-adjusted flag

#### Basic Formula Calculator Fields

User enters:
- Birth date or birth year
- Claiming age
- Work start year
- Current or expected stop-work year
- Annual covered earnings, either:
  - year-by-year table, or
  - salary + start year + growth assumption
- Future covered earnings assumption
- Wage growth assumption for projecting future bend points
- Display in today’s dollars or future dollars

Do not ask for:
- Social Security number
- SSA login
- Government credentials

Calculator output:
- Estimated AIME
- Estimated PIA
- Claiming adjustment
- Estimated monthly benefit
- Estimated annual benefit
- Today-dollar and future-dollar view
- Clear unofficial-estimate warning

### L. Tax Model

Modes:
- No tax
- Simple blended effective tax rate
- Account-level effective tax rates

Simple formula:

```text
required_pre_tax_withdrawal = after_tax_spending_gap / (1 - tax_rate)
```

Account-level tax buckets:
- Taxable
- Tax-deferred
- Tax-free / Roth
- Cash
- Real estate
- Custom

Default withdrawal method:

```text
Pro-rata across selected FIRE accounts
```

### M. Planning Allocation

Use one overall FIRE planning allocation:

- S&P 500 Stocks
- Bond Equivalent
- Cash / T-Bills

Validation:

```text
Stock + Bond Equivalent + Cash = 100%
```

Conservative allocation warning:

```text
Trigger when Bond Equivalent + Cash / T-Bills >= 50%
```

Warning copy:

```text
This path uses 50% or more in Bond Equivalent and Cash / T-Bills. This may reduce market volatility, but it may also lower long-term growth. A lower-growth allocation can require a larger FIRE number, higher savings, lower spending, or a later retirement date.
```

### N. Monte Carlo

Use historical market return sampling.

Settings:
- U.S. market only
- Stock proxy: S&P 500
- Conservative proxy: Bond Equivalent
- Cash proxy: T-Bills
- Inflation: sampled historical inflation
- Monthly data
- 12-month block bootstrap
- Annual rebalancing
- Default simulations: 5,000
- Options: 1,000 / 5,000 / 10,000
- Default success threshold: 90%
- Options: 80% / 85% / 90% / 95%

Output:
- Success rate
- FIRE age
- Median ending balance
- 10th percentile ending balance
- 90th percentile ending balance
- Failure age if failed

Safe wording:

```text
Your plan survived in X% of simulated historical market paths.
```

Do not say:

```text
You have X% chance of success.
```

---

## 7. Important Definitions

## 7.1 Effective-Dated Historical Holdings Engine — MVP

This answers:

```text
What did I own as of a certain date?
What was my net worth on that date?
How did my net worth grow over time?
```

User enters position snapshots:

```text
AAPL: 100 shares as of 2024-06-01
AAPL: 50 shares as of 2025-06-01
Cash: $30,000 as of 2024-06-01
Cash: $42,000 as of 2025-06-01
House value: $500,000 as of 2025-01-01
Mortgage: $320,000 as of 2025-01-01
```

The app calculates historical net worth from these effective-dated snapshots.

## 7.2 Full Transaction Ledger — Later

This answers:

```text
How did I get from 100 shares to 50 shares?
What did I buy?
What did I sell?
What was my cost basis?
What are my realized gains?
Were dividends reinvested?
Were there splits or transfers?
```

That is useful later, but it is not required to calculate historical net worth.

---

## 8. Historical Net Worth Calculation

For every date on the net-worth chart, the app should:

1. Find the latest stock/ETF/crypto quantity snapshot on or before that date.
2. Find the latest cash balance snapshot on or before that date.
3. Find the latest manual valuation snapshot on or before that date.
4. Find the latest liability balance snapshot on or before that date.
5. Fetch or use cached historical end-of-day prices for market-priced assets.
6. Calculate asset values.
7. Subtract liabilities.
8. Return net worth for that date.

Formula:

```text
historical_net_worth(date) =
sum(market_position_quantity_as_of_date * market_price_as_of_date)
+ sum(cash_balance_as_of_date)
+ sum(manual_asset_value_as_of_date)
- sum(liability_balance_as_of_date)
```

Example:

```text
AAPL quantity snapshots:
2024-06-01: 100 shares
2025-06-01: 50 shares

AAPL EOD price on 2024-06-01 or prior market day: $190
AAPL EOD price on 2025-06-01 or prior market day: $210

AAPL value on 2024-06-01 = 100 * $190 = $19,000
AAPL value on 2025-06-01 = 50 * $210 = $10,500
```

For 2024-12-31:

```text
Use 100 shares because the latest quantity snapshot before 2024-12-31 is 2024-06-01.
Use AAPL price as of 2024-12-31.
```

For 2025-12-31:

```text
Use 50 shares because the latest quantity snapshot before 2025-12-31 is 2025-06-01.
Use AAPL price as of 2025-12-31.
```

---

## 9. Historical Chart Requirements

Freedom Map must include:

- Net worth over time
- Total assets over time
- Total liabilities over time
- Chart range selector
- Source data drilldown for selected date

Chart ranges:

```text
1M
3M
6M
YTD
1Y
3Y
5Y
All
Custom
```

Suggested granularity:

| Range | Default granularity |
|---|---|
| 1M | Daily |
| 3M | Daily or weekly |
| 6M | Weekly |
| 1Y | Weekly or monthly |
| 3Y | Monthly |
| 5Y | Monthly |
| All | Monthly |

When user clicks a historical date, show:

```text
Net worth on selected date
Assets by category
Liabilities by category
Market prices used
Manual valuations used
Stale/manual price warnings
```

---

## 10. Historical Prices

For market positions, the app needs historical prices.

MVP behavior:

1. Use cached EOD prices if available.
2. If missing, fetch historical EOD price from free API.
3. If still unavailable, use prior available close.
4. If unavailable, ask user for manual price override.
5. Clearly label stale or manual prices.

Price function:

```text
getMarketPriceOnOrBefore(symbol, date)
```

This should return the latest available close on or before the requested date because markets are closed on weekends and holidays.

---

## 11. Editing Historical Data

When user adds or edits a snapshot with an old effective date:

Example:

```text
AAPL 100 shares as of 2024-06-01
```

The app should:

1. Save the quantity snapshot.
2. Invalidate cached net-worth snapshots from 2024-06-01 forward.
3. Recalculate affected chart points when needed.
4. Show the user a message:

```text
This update affects your net-worth history from June 1, 2024 forward.
```

If user later enters:

```text
AAPL 50 shares as of 2025-06-01
```

Then the app interprets the history as:

```text
2024-06-01 through 2025-05-31: 100 shares
2025-06-01 forward: 50 shares
```

No buy/sell transaction is required.

---

## 12. End-of-Day Stock Price Integration Logic

## 12.1 MVP Requirements

- User enters ticker and shares
- App fetches latest available EOD price
- App calculates market value
- App caches price by ticker/date
- App displays source and price date
- App allows manual override
- App works even if API fails

## 12.2 Recommended Implementation

Use a small serverless API route:

```text
/api/prices?symbols=AAPL,VOO,MSFT
```

Server route:
1. Check Supabase `price_cache`
2. If latest price date is today or most recent market date, return cached
3. If missing/stale, call free market data API
4. Save result to cache
5. Return normalized prices

Do not expose API keys in browser code.

## 12.3 Manual Fallback

If price fetch fails:

```text
Could not fetch latest price. Enter a manual price or try again later.
```

Manual price fields:
- price
- price date
- notes

## 12.4 Cost Control

- Batch symbols where possible
- Cache daily
- Refresh once per day per ticker
- Limit guest refresh frequency
- Allow manual price
- Optional user-provided API key later

---

## 13. Social Security Calculator Logic

## 13.1 Required Static Data Files

Create JSON files for:

```text
ssa_bend_points_by_eligibility_year.json
ssa_national_average_wage_index.json
ssa_taxable_maximum_by_year.json
ssa_full_retirement_age_by_birth_year.json
ssa_delayed_retirement_credit_by_birth_year.json
```

For MVP, seed enough data for common user ages and allow fallback/projection for future years.

## 13.2 Calculator Algorithm

### Step 1: Build earnings history

From user input:
- Year-by-year covered earnings, or
- Salary + start year + growth assumption

Cap each year at the Social Security taxable maximum if table exists.

### Step 2: Determine eligibility year

For retirement benefits:

```text
eligibility_year = year user turns 62
```

### Step 3: Index earnings

For earnings before the indexing year:

```text
indexing_year = year user turns 60
indexed_earnings = earnings * (NAWI[indexing_year] / NAWI[earnings_year])
```

Earnings in or after the indexing year are not wage-indexed.

### Step 4: Pick highest 35 years

If fewer than 35 years, fill missing years with zero.

```text
top_35_indexed_earnings = highest 35 indexed annual earnings values
```

### Step 5: Compute AIME

```text
AIME = floor(sum(top_35_indexed_earnings) / 420)
```

### Step 6: Compute PIA

Use bend points for eligibility year.

If future bend points are not available, project latest available bend points by wage growth assumption.

```text
PIA =
90% of first bend-point layer
+ 32% of second layer
+ 15% above second bend point
```

### Step 7: Apply claiming age adjustment

If claiming before full retirement age:
- reduce 5/9 of 1% per month for first 36 months
- reduce 5/12 of 1% per month after 36 months

If claiming after full retirement age:
- increase based on delayed retirement credits
- for 1943-or-later births, use 8% per year / 2/3 of 1% per month
- stop credits at age 70

### Step 8: Output benefit estimate

Return:
- AIME
- PIA
- monthly benefit at selected claiming age
- annual benefit
- today-dollar estimate
- future-dollar estimate
- warning that this is unofficial

Required disclaimer:

```text
This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record and may differ from your official Social Security estimate.
```

---

## 14. Data Model Strategy

Use a versioned plan-document model first.

## 14.1 Supabase Tables

### plan_documents

```sql
create table plan_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Enable Row Level Security.

Users can only access their own plan documents.

### price_cache

```sql
create table price_cache (
  symbol text not null,
  price_date date not null,
  close_price numeric not null,
  source text not null,
  fetched_at timestamptz not null default now(),
  primary key (symbol, price_date)
);
```

This table can be public-readable if it contains only ticker prices, not personal data.

---

## 15. Plan Document JSON Shape

```ts
type PlanDocument = {
  schemaVersion: "1.4";
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;

  settings: {
    currency: "USD";
    planningMode: "individual" | "family";
    defaultSavedPathId: string | null;
  };

  people: PersonProfile[];

  portfolioGroups: PortfolioGroup[];

  marketPositions: MarketPosition[];
  cashAccounts: CashAccount[];
  manualAssets: ManualAsset[];
  liabilityAccounts: LiabilityAccount[];

  savedPaths: SavedPath[];

  cachedNetWorthSnapshots?: CachedNetWorthSnapshot[];
};
```

### PersonProfile

```ts
type PersonProfile = {
  id: string;
  label: string;
  birthDate?: string;
  currentAge?: number;
  lifeExpectancy: number;
  isPrimary: boolean;
};
```

### PortfolioGroup

```ts
type PortfolioGroup = {
  id: string;
  name: string;
  description?: string;
};
```

### MarketPosition

Used for stocks, ETFs, crypto, and similar holdings.

```ts
type MarketPosition = {
  id: string;
  symbol: string;
  name?: string;
  assetType: "stock" | "etf" | "mutual_fund" | "crypto";
  portfolioGroupId?: string;
  includedInFire: boolean;
  taxBucket?: "taxable" | "tax_deferred" | "tax_free" | "cash" | "real_estate" | "custom";
  notes?: string;

  quantitySnapshots: QuantitySnapshot[];
  manualPriceOverrides?: ManualPriceOverride[];
};
```

### QuantitySnapshot

```ts
type QuantitySnapshot = {
  id: string;
  effectiveDate: string; // YYYY-MM-DD
  quantity: number;
  source: "manual";
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### ManualPriceOverride

```ts
type ManualPriceOverride = {
  id: string;
  priceDate: string; // YYYY-MM-DD
  price: number;
  notes?: string;
  createdAt: string;
};
```

### CashAccount

```ts
type CashAccount = {
  id: string;
  name: string;
  portfolioGroupId?: string;
  includedInFire: boolean;
  taxBucket: "cash";
  balanceSnapshots: BalanceSnapshot[];
};
```

### ManualAsset

Used for home value, vehicle, private equity, and custom assets.

```ts
type ManualAsset = {
  id: string;
  name: string;
  assetType: "home" | "vehicle" | "private_equity" | "other";
  portfolioGroupId?: string;
  includedInFire: boolean;
  valuationSnapshots: ValuationSnapshot[];
  notes?: string;
};
```

### LiabilityAccount

```ts
type LiabilityAccount = {
  id: string;
  name: string;
  liabilityType: "mortgage" | "credit_card" | "student_loan" | "auto_loan" | "personal_loan" | "other";
  includedInNetWorth: boolean;
  balanceSnapshots: BalanceSnapshot[];
  notes?: string;
};
```

### BalanceSnapshot

Used for cash and liabilities.

```ts
type BalanceSnapshot = {
  id: string;
  effectiveDate: string; // YYYY-MM-DD
  balance: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### ValuationSnapshot

Used for home, vehicle, private equity, and custom assets.

```ts
type ValuationSnapshot = {
  id: string;
  effectiveDate: string; // YYYY-MM-DD
  value: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
```

### CachedNetWorthSnapshot

```ts
type CachedNetWorthSnapshot = {
  id: string;
  snapshotDate: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  source: "calculated";
  calculatedAt: string;
  invalidatedAt?: string;
};
```

Important rule:

```text
CachedNetWorthSnapshot is not the source of truth.
The source of truth is effective-dated positions, balances, valuations, liabilities, and market prices.
```

### SavedPath

```ts
type SavedPath = {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isArchived: boolean;

  assumptions: FireAssumptions;
  planningEvents: PlanningEvent[];
  expenses: RecurringExpense[];
  incomeStreams: RetirementIncomeStream[];
  socialSecurity: SocialSecurityEstimate[];
  taxSettings: TaxSettings;
  allocation: PlanningAllocation;

  latestResult?: ProjectionResult;
};
```

### FIRE Assumptions

```ts
type FireRuleMode =
  | "withdrawal_rate"
  | "income_only";

type FireAssumptions = {
  withdrawalRate: number; // default 0.05
  globalInflationRate: number;
  annualSavings: number;
  retirementDate?: string;
  targetRetirementAge?: number;
  fireAssetBasis: "investable_only" | "total_net_worth" | "custom";
  includeHomeEquity: boolean;

  fireRuleMode: FireRuleMode;
};
```

### Planning Allocation

```ts
type PlanningAllocation = {
  stockPercent: number;
  bondEquivalentPercent: number;
  cashPercent: number;
  rebalanceFrequency: "annual";
};
```

### Timing Rule

```ts
type TimingRule =
  | {
      type: "exact_date";
      date: string;
    }
  | {
      type: "relative_event";
      eventId: string;
      offsetValue: number;
      offsetUnit: "months" | "years";
      direction: "before" | "after";
    };
```

### Recurring Expense

```ts
type RecurringExpense = {
  id: string;
  name: string;
  category: string;
  amount: number;
  frequency: "monthly" | "annual";

  startTiming: TimingRule;
  endTiming?: TimingRule;

  inflationAdjusted: boolean;
  isEssential: boolean;
  includedInFirePath: boolean;
};
```

### Income Stream

```ts
type RetirementIncomeStream = {
  id: string;
  name: string;
  incomeType:
    | "social_security"
    | "pension"
    | "rental"
    | "part_time_work"
    | "business"
    | "portfolio_income"
    | "dividend"
    | "interest"
    | "annuity"
    | "other";

  incomeCategory:
    | "guaranteed"
    | "passive"
    | "earned"
    | "portfolio_income"
    | "other";

  amount: number;
  frequency: "monthly" | "annual";

  startTiming: TimingRule;
  endTiming?: TimingRule | "lifetime";

  inflationAdjusted: boolean;
  taxable: boolean;
  includedInFirePath: boolean;
  personId?: string;
};
```

### SocialSecurityEstimate

```ts
type SocialSecurityEstimate = {
  id: string;
  personId: string;
  entryMode: "direct_entry" | "formula_calculator";

  // direct entry
  monthlyBenefitTodayDollars?: number;

  // calculator input
  birthYear?: number;
  claimingAge?: number;
  workStartYear?: number;
  workEndYear?: number;
  currentAnnualCoveredEarnings?: number;
  assumedAnnualEarningsGrowth?: number;
  annualEarningsByYear?: Record<string, number>;

  // output
  estimatedAime?: number;
  estimatedPia?: number;
  estimatedMonthlyBenefitTodayDollars?: number;
  estimatedMonthlyBenefitFutureDollars?: number;

  claimingTiming: TimingRule;
  inflationAdjusted: boolean;
  includedInFirePlan: boolean;
};
```

### Tax Settings

```ts
type TaxSettings = {
  mode: "none" | "simple_blended" | "account_level";
  simpleEffectiveTaxRate?: number;
  accountWithdrawalMethod: "pro_rata";
  accountTaxRates?: {
    taxable: number;
    tax_deferred: number;
    tax_free: number;
    cash: number;
    real_estate: number;
    custom: number;
  };
};
```

---

## 16. Core Calculation Functions

## 16.1 Latest Snapshot Helper

```ts
function getLatestSnapshotOnOrBefore<T extends { effectiveDate: string }>(
  snapshots: T[],
  targetDate: string
): T | null {
  return snapshots
    .filter(s => s.effectiveDate <= targetDate)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0] ?? null;
}
```

## 16.2 Net Worth As Of Date

```ts
async function calculateNetWorthAsOf(plan: PlanDocument, date: string): Promise<NetWorthResult> {
  let totalAssets = 0;
  let totalLiabilities = 0;

  for (const position of plan.marketPositions) {
    const quantitySnapshot = getLatestSnapshotOnOrBefore(position.quantitySnapshots, date);
    if (!quantitySnapshot) continue;

    const price = await getMarketPriceOnOrBefore(position.symbol, date, position.manualPriceOverrides);
    const value = quantitySnapshot.quantity * price;
    totalAssets += value;
  }

  for (const cash of plan.cashAccounts) {
    const balanceSnapshot = getLatestSnapshotOnOrBefore(cash.balanceSnapshots, date);
    if (!balanceSnapshot) continue;
    totalAssets += balanceSnapshot.balance;
  }

  for (const asset of plan.manualAssets) {
    const valuationSnapshot = getLatestSnapshotOnOrBefore(asset.valuationSnapshots, date);
    if (!valuationSnapshot) continue;
    totalAssets += valuationSnapshot.value;
  }

  for (const liability of plan.liabilityAccounts) {
    if (!liability.includedInNetWorth) continue;
    const balanceSnapshot = getLatestSnapshotOnOrBefore(liability.balanceSnapshots, date);
    if (!balanceSnapshot) continue;
    totalLiabilities += balanceSnapshot.balance;
  }

  return {
    date,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
  };
}
```

## 16.3 Simple FIRE Number

```text
annual_spending_gap = annual_expenses - annual_income
required_pre_tax_gap = tax_adjusted_gap
simple_fire_number = required_pre_tax_gap / withdrawal_rate
```

Default withdrawal rate:

```text
5%
```

## 16.4 Inflation-Adjusted Withdrawal Rule

```text
Year 1 withdrawal = starting_retirement_portfolio * withdrawal_rate
Each later year withdrawal grows by inflation.
```

## 16.5 Family Planning Horizon

```text
planning_horizon = later of the two life expectancies
```

## 16.6 Monte Carlo Algorithm

Use monthly historical block bootstrap.

Algorithm:
1. Load historical monthly rows containing stock return, bond equivalent return, cash return, inflation.
2. Randomly select 12-month contiguous blocks.
3. Stitch blocks until the full planning horizon is covered.
4. For each month:
   - Apply allocation-weighted return.
   - Apply sampled inflation to inflation-adjusted expenses/income.
   - Apply contributions before retirement.
   - Apply withdrawals after retirement.
5. Rebalance annually.
6. Mark success if portfolio never drops below zero.
7. Repeat 1,000 / 5,000 / 10,000 times.
8. Return success rate and distribution metrics.

---


---

## 16A. Earliest FIRE Age Feature

The app must estimate the user’s **earliest FIRE age** for each Saved Path. This is one of the core product features.

Important: the output is an estimate, not advice.

Required label:

```text
Estimated Earliest FIRE Age
```

Do not label it:

```text
Safe retirement age
Recommended retirement age
Guaranteed retirement age
```

### 16A.1 Which FIRE Age Should the App Calculate?

The app should calculate three FIRE-age outputs because they answer different questions.

#### 1. Simple FIRE Age Estimate

Question:

```text
When do my selected FIRE assets reach my simple FIRE number?
```

Formula:

```text
simple_fire_number = annual_portfolio_funded_spending_gap / withdrawal_rate
```

With the default 5% rule:

```text
simple_fire_number = annual_portfolio_funded_spending_gap / 0.05
```

This is a rough estimate. It is useful for orientation, but it does not fully handle changing expenses, Social Security timing, taxes, changing income, or market volatility.

#### 2. Deterministic FIRE Age Estimate

Question:

```text
What is the earliest retirement date where my plan survives through the planning horizon using fixed assumptions?
```

This should be the main fixed-assumption planning result.

It uses:
- User-entered inflation
- User-entered return assumptions
- User-entered savings
- User-entered expenses
- User-entered income streams
- Social Security assumptions
- Tax model
- Selected FIRE assets
- Individual or Family Planning horizon

A deterministic candidate passes if:

```text
The selected FIRE assets never fall below $0 before the planning horizon ends.
```

#### 3. Monte Carlo FIRE Age Estimate

Question:

```text
What is the earliest retirement date where my plan survives in at least the selected percentage of simulated historical market paths?
```

This should be the main risk-aware planning result when Monte Carlo is enabled.

Default threshold:

```text
90%
```

A Monte Carlo candidate passes if:

```text
success_rate >= selected_success_threshold
```

Example:

```text
Age 48: survived 82% of simulations
Age 49: survived 87% of simulations
Age 50: survived 91% of simulations

Monte Carlo FIRE Age Estimate = 50
```

Required wording:

```text
At age 50, this path survived in 91% of simulated historical market paths.
```

Do not say:

```text
You have a 91% chance of success.
```

### 16A.2 Recommended UI Priority

Show all three, but prioritize them like this:

```text
1. Monte Carlo FIRE Age Estimate, if Monte Carlo has been run
2. Deterministic FIRE Age Estimate
3. Simple FIRE Age Estimate
```

Reason:

```text
Simple FIRE age is a quick benchmark.
Deterministic FIRE age is a fixed-assumption projection.
Monte Carlo FIRE age is the risk-aware stress-tested result.
```

### 16A.3 High-Level Calculation Logic

The app should search possible retirement dates from today through the planning horizon.

For performance, use a two-pass search:

```text
Pass 1: test yearly candidate retirement dates.
Pass 2: once the first passing year is found, test monthly dates around that year.
```

The output should include:

```text
Earliest FIRE date
Earliest FIRE age
Years and months left to work
Simple FIRE number
Deterministic result
Monte Carlo result, if run
```

### 16A.4 Candidate Retirement Date Logic

For each candidate retirement date:

1. Resolve planning events.
2. Project assets from today to the candidate retirement date.
3. At retirement, begin withdrawal modeling.
4. For every month/year after retirement:
   - Calculate active expenses.
   - Calculate active income.
   - Inflate inflation-adjusted items.
   - Calculate spending gap.
   - Apply tax gross-up if enabled.
   - Withdraw from selected FIRE assets.
   - Apply investment returns.
   - Rebalance annually where applicable.
5. Candidate passes if assets never fall below zero through the planning horizon.

### 16A.5 Planning Horizon

Individual Planning:

```text
planning_horizon = person_life_expectancy_date
```

Family Planning:

```text
planning_horizon = later of the two life expectancy dates
```

### 16A.6 Pre-Retirement Projection

Before the candidate retirement date:

```text
portfolio grows
savings are added
no retirement withdrawals are taken
```

Monthly deterministic version:

```text
monthly_return = (1 + annual_return)^(1/12) - 1
monthly_savings = annual_savings / 12
portfolio_end = (portfolio_start + monthly_savings) * (1 + monthly_return)
```

### 16A.7 Post-Retirement Projection

After the candidate retirement date:

```text
active_expenses = expenses active in that month/year
active_income = income streams active in that month/year
after_tax_gap = active_expenses - active_income - separate_portfolio_income
```

If the gap is negative:

```text
withdrawal_needed = 0
optional surplus can be reinvested later
```

If the gap is positive:

```text
gross_withdrawal = tax_adjusted(after_tax_gap)
```

Recommended conservative monthly order:

```text
1. Withdraw at beginning of month.
2. Apply monthly investment return after withdrawal.
```

Formula:

```text
portfolio_after_withdrawal = portfolio_start - gross_withdrawal
portfolio_end = portfolio_after_withdrawal * (1 + monthly_return)
```

Candidate fails if:

```text
portfolio_end < 0
```

### 16A.8 Monte Carlo Earliest FIRE Age Logic

For Monte Carlo, the same candidate-date search is used, but returns and inflation come from historical monthly block sampling.

Each simulation:
1. Randomly samples 12-month historical blocks.
2. Applies S&P 500 Stocks / Bond Equivalent / Cash returns based on the Saved Path allocation.
3. Samples historical inflation with each block.
4. Adds savings before retirement.
5. Subtracts withdrawals after retirement.
6. Rebalances annually.
7. Succeeds if the portfolio never drops below zero.

For a candidate retirement date:

```text
success_rate = successful_simulations / total_simulations
```

Candidate passes if:

```text
success_rate >= success_threshold
```

The first passing candidate is:

```text
Monte Carlo FIRE Age Estimate
```

### 16A.9 Pseudocode

```ts
async function estimateEarliestFireAges(
  plan: PlanDocument,
  savedPath: SavedPath
): Promise<EarliestFireAgeResult> {
  const today = getToday();
  const horizonDate = getPlanningHorizonDate(plan, savedPath);

  const simpleFireAge = await estimateSimpleFireAge(plan, savedPath);

  const candidateDates = generateCandidateRetirementDates({
    startDate: today,
    endDate: horizonDate,
    firstPass: "yearly",
    secondPass: "monthly",
  });

  let deterministicFireDate: string | null = null;
  let monteCarloFireDate: string | null = null;
  let monteCarloSuccessRateAtFireDate: number | null = null;

  for (const candidateDate of candidateDates) {
    const resolvedPath = resolvePlanningEvents(savedPath, candidateDate);

    if (!deterministicFireDate) {
      const deterministic = await runDeterministicProjection(plan, resolvedPath, {
        retirementDate: candidateDate,
      });

      if (deterministic.neverRunsOutOfMoney) {
        deterministicFireDate = candidateDate;
      }
    }

    if (!monteCarloFireDate && savedPath.monteCarlo?.enabled) {
      const monteCarlo = await runMonteCarloProjection(plan, resolvedPath, {
        retirementDate: candidateDate,
        simulations: savedPath.monteCarlo.simulations ?? 5000,
        successThreshold: savedPath.monteCarlo.successThreshold ?? 0.90,
      });

      if (monteCarlo.successRate >= monteCarlo.successThreshold) {
        monteCarloFireDate = candidateDate;
        monteCarloSuccessRateAtFireDate = monteCarlo.successRate;
      }
    }

    if (deterministicFireDate && (!savedPath.monteCarlo?.enabled || monteCarloFireDate)) {
      break;
    }
  }

  return {
    simpleFireAge,
    deterministicFireDate,
    deterministicFireAge: deterministicFireDate
      ? calculateAgeOnDate(plan.people[0], deterministicFireDate)
      : null,
    monteCarloFireDate,
    monteCarloFireAge: monteCarloFireDate
      ? calculateAgeOnDate(plan.people[0], monteCarloFireDate)
      : null,
    monteCarloSuccessRateAtFireDate,
  };
}
```

### 16A.10 UI Output Example

```text
Base Path

Simple FIRE Age Estimate:
46 years, 8 months

Deterministic FIRE Age Estimate:
48 years, 4 months

Monte Carlo FIRE Age Estimate:
51 years, 2 months at 90% threshold

At age 51, this path survived in 91.3% of 5,000 simulated historical market paths.
```

If no passing date is found:

```text
This Saved Path does not reach FIRE before the selected planning horizon under the current assumptions.
```


---

## 16B. FIRE Rule Modes

The MVP must support **two** FIRE rule modes only:

```text
Withdrawal-Rate FIRE
Income-Only FIRE
```

The following modes must be documented for the next development cycle, but must **not** be built as MVP modes:

```text
Principal Preservation FIRE
Hybrid FIRE
```

Reason for this scope decision:

```text
Withdrawal-Rate FIRE and Income-Only FIRE cover the two most important first-use cases:
1. Retire by allowing planned portfolio withdrawals.
2. Retire only when income covers expenses without planned principal withdrawals.

Principal Preservation FIRE and Hybrid FIRE are valuable, but they add additional pass/fail rules, principal floors, and more complex user education. They belong in the roadmap after the first working version.
```

Required safe wording:

```text
Choose the FIRE rule you want this Saved Path to test.
```

Avoid:

```text
This is the best FIRE rule.
```

### 16B.1 MVP FIRE Rule Modes

Each Saved Path must have one selected `fireRuleMode`.

For MVP, allowed values are:

```text
withdrawal_rate
income_only
```

### 16B.2 Mode 1 — Withdrawal-Rate FIRE

This is the default mode.

User question:

```text
Can I retire if I withdraw from my portfolio using a selected withdrawal rule?
```

Default withdrawal rate:

```text
5%
```

Rule:

```text
The user may withdraw from principal.
A candidate retirement date passes if selected FIRE assets never fall below $0 before the planning horizon ends.
```

Simple FIRE number:

```text
annual_portfolio_funded_spending_gap / withdrawal_rate
```

This mode may use:
- Portfolio income
- Social Security
- Pension
- Rental income
- Part-time income
- Principal withdrawals

Pass/fail test:

```text
portfolio_balance >= 0 through planning horizon
```

### 16B.3 Mode 2 — Income-Only FIRE

This is the “do not plan to touch 本金” mode.

User question:

```text
Can my passive income and guaranteed income cover my expenses without planned principal withdrawals?
```

Rule:

```text
after_tax_passive_income + guaranteed_income >= expenses
```

This mode tests income coverage only. It does not require the portfolio market value to stay above a principal floor.

Important explanation:

```text
Income-Only FIRE means the user does not plan to sell principal. It does not mean the market value of principal can never fall.
```

Examples of income counted:
- Dividends
- Bond interest
- Cash/T-Bill interest
- Rental net income
- Business distributions
- Private investment distributions
- Social Security
- Pension
- Annuity

Pass/fail test:

```text
income_coverage_ratio >= 100% for each required retirement period
```

Where:

```text
income_coverage_ratio =
(after_tax_passive_income + guaranteed_income) / expenses
```

If passive/guaranteed income covers expenses, no planned portfolio withdrawal is required.

Candidate fails if:

```text
income_coverage_ratio < 100%
```

for any required retirement period.

### 16B.4 Income Categories

Income streams must be categorized so the FIRE engine knows how to treat them.

Each `RetirementIncomeStream` should include:

```ts
incomeCategory: "guaranteed" | "passive" | "earned" | "portfolio_income" | "other";
```

Recommended mapping:

| Income type | Default category |
|---|---|
| Social Security | guaranteed |
| Pension | guaranteed |
| Annuity | guaranteed |
| Rental income | passive |
| Dividend income | passive |
| Bond interest | passive |
| Cash/T-Bill interest | passive |
| Business distribution | passive |
| Part-time work | earned |
| Consulting income | earned |
| Portfolio income estimate | portfolio_income |
| Other | other |

The user should be able to override the category.

### 16B.5 MVP Outputs by FIRE Rule Mode

#### Withdrawal-Rate FIRE output

```text
Estimated Withdrawal-Rate FIRE Age
Simple FIRE number
Portfolio survival result
Ending balance
Total withdrawals
```

#### Income-Only FIRE output

```text
Estimated Income-Only FIRE Age
Income coverage ratio
Annual passive/guaranteed income
Annual expenses
First date income coverage fails, if any
```

### 16B.6 Relationship to Earliest FIRE Age

The selected FIRE Rule Mode changes how the earliest FIRE age is calculated.

For a candidate retirement date:

```text
Withdrawal-Rate FIRE:
passes if portfolio never falls below $0.

Income-Only FIRE:
passes if passive/guaranteed income covers expenses in all required periods.
```

The app must clearly show which mode produced the estimate.

Required label examples:

```text
Estimated Withdrawal-Rate FIRE Age
Estimated Income-Only FIRE Age
```

### 16B.7 Data Model Additions

Update `FireAssumptions`:

```ts
type FireRuleMode =
  | "withdrawal_rate"
  | "income_only";

type FireAssumptions = {
  withdrawalRate: number; // default 0.05
  globalInflationRate: number;
  annualSavings: number;
  retirementDate?: string;
  targetRetirementAge?: number;
  fireAssetBasis: "investable_only" | "total_net_worth" | "custom";
  includeHomeEquity: boolean;

  fireRuleMode: FireRuleMode;
};
```

Update `RetirementIncomeStream`:

```ts
type RetirementIncomeStream = {
  id: string;
  name: string;
  incomeType:
    | "social_security"
    | "pension"
    | "rental"
    | "part_time_work"
    | "business"
    | "portfolio_income"
    | "dividend"
    | "interest"
    | "annuity"
    | "other";

  incomeCategory:
    | "guaranteed"
    | "passive"
    | "earned"
    | "portfolio_income"
    | "other";

  amount: number;
  frequency: "monthly" | "annual";

  startTiming: TimingRule;
  endTiming?: TimingRule | "lifetime";

  inflationAdjusted: boolean;
  taxable: boolean;
  includedInFirePath: boolean;
  personId?: string;
};
```

### 16B.8 Calculation Function Requirement

Implement a shared candidate test function:

```ts
function evaluateCandidateRetirementDate(
  plan: PlanDocument,
  savedPath: SavedPath,
  candidateRetirementDate: string,
  projectionMode: "deterministic" | "monte_carlo"
): CandidateFireResult
```

This function must branch based on:

```ts
savedPath.assumptions.fireRuleMode
```

Mode-specific pass logic:

```ts
switch (fireRuleMode) {
  case "withdrawal_rate":
    return portfolioNeverFallsBelow(0);

  case "income_only":
    return incomeCoveragePassesEveryPeriod();
}
```

### 16B.9 MVP Defaults

Default new Saved Path values:

```text
fireRuleMode: withdrawal_rate
withdrawalRate: 5%
```

### 16B.10 Roadmap-Only FIRE Modes

Document these for the next development cycle, but do not implement them in the MVP.

#### Principal Preservation FIRE — roadmap

User question:

```text
Can my income cover expenses while my principal market value stays above a selected floor?
```

Future rule:

```text
Income coverage test must pass
AND
principal preservation test must pass
```

Future principal floor options:

```text
nominal
real_inflation_adjusted
custom
```

Important explanation to preserve for future work:

```text
Principal Preservation FIRE can fail even when Income-Only FIRE passes, because passive income may cover expenses while market value declines.
```

#### Hybrid FIRE — roadmap

User question:

```text
Can passive income cover part of my expenses while withdrawals cover the remaining gap?
```

Future rule:

```text
Passive/guaranteed income reduces the spending gap.
Withdrawals cover the remaining gap.
Portfolio must stay above the selected floor.
```

Future floor options:

```text
zero_floor
nominal
real_inflation_adjusted
custom
```


## 17. UX Requirements

## 17.1 Landing Page

Must say:
- Plan your path to financial independence.
- No login required to try.
- Optional account for saving and syncing.
- No brokerage connection required.
- Not investment, tax, or legal advice.

## 17.2 Main App Flow

1. User opens app.
2. User chooses:
   - Start as Guest
   - Sign in / Create optional account
3. User creates or imports a plan.
4. User enters basic profile.
5. User enters market positions, cash accounts, manual assets, and liabilities.
6. User adds current and historical snapshots.
7. User creates a Saved Path.
8. User enters expenses/income.
9. User enters Social Security directly or uses calculator.
10. User runs FIRE projection.
11. User runs Monte Carlo.
12. User compares Saved Paths.
13. User exports plan or saves to account.

## 17.3 Add/Edit Holding Flow

When user enters a stock holding, they should be able to choose:

```text
This is my current holding
This is my holding as of a past date
```

Fields:
- Ticker
- Quantity
- Effective date
- Portfolio group
- Tax bucket
- Include in FIRE
- Notes

## 17.4 Historical Holdings View

For each market position, show a timeline:

| Effective Date | Quantity | Notes |
|---|---:|---|
| 2024-06-01 | 100 | Initial backfill |
| 2025-06-01 | 50 | Updated holding |

## 17.5 Required Warnings

Financial disclaimer:

```text
Household FIRE Planner provides planning estimates only. It is not investment, tax, legal, or financial advice.
```

Monte Carlo warning:

```text
Monte Carlo results are based on sampled historical market paths and assumptions you provide. They are not a guarantee of future results.
```

Data storage warning for guest mode:

```text
Guest plans are saved on this device. Export a backup if you want to protect against browser data loss or move your plan to another device.
```

Conservative allocation warning:

```text
This path uses 50% or more in Bond Equivalent and Cash / T-Bills. This may reduce volatility but may also lower long-term growth.
```

Social Security disclaimer:

```text
This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record and may differ from your official Social Security estimate.
```

---

## 18. UI Pages to Build

### Public

```text
/
```

Landing page.

```text
/app
```

App entry.

### App

```text
/app/freedom-map
/app/portfolio-lab
/app/fire-path
/app/saved-paths
/app/path-comparison
/app/family-plan
/app/social-security-guide
/app/wealth-records
/app/settings
/app/roadmap
```

Optional auth pages:

```text
/login
/signup
```

---

## 19. Suggested File Structure

```text
src/
  app/
    page.tsx
    app/
      layout.tsx
      freedom-map/page.tsx
      portfolio-lab/page.tsx
      fire-path/page.tsx
      saved-paths/page.tsx
      path-comparison/page.tsx
      family-plan/page.tsx
      social-security-guide/page.tsx
      wealth-records/page.tsx
      settings/page.tsx
      roadmap/page.tsx
  components/
    layout/
    forms/
    charts/
    planning/
    portfolio/
    ui/
  lib/
    calculations/
      deterministic.ts
      monte-carlo.ts
      tax.ts
      timing.ts
      inflation.ts
      net-worth.ts
      social-security.ts
    data/
      historical-returns.ts
      ssa/
      sample-plan.ts
    market-data/
      prices.ts
      price-cache.ts
    storage/
      local-store.ts
      supabase-sync.ts
    validation/
      plan-schema.ts
  types/
    plan.ts
    calculations.ts
    market-data.ts
  tests/
    calculations/
```

---

## 20. Development Order for Codex

Build in this order.

### Step 1 — Scaffold

- Next.js TypeScript app
- Tailwind
- shadcn/ui
- Recharts
- zod
- react-hook-form
- date-fns
- Dexie
- Supabase client

### Step 2 — Schema and Local Storage

- PlanDocument types
- zod schema
- sample plan
- IndexedDB persistence
- JSON export/import

### Step 3 — Basic App Shell

- Landing page
- App navigation
- Guest/account mode messaging
- Settings
- Plan selector

### Step 4 — Historical Net Worth Engine

- MarketPosition with quantitySnapshots[]
- CashAccount with balanceSnapshots[]
- ManualAsset with valuationSnapshots[]
- LiabilityAccount with balanceSnapshots[]
- calculateNetWorthAsOf(plan, date)
- generateNetWorthSeries(plan, startDate, endDate, granularity)
- historical date drilldown
- cache invalidation from edited effective date forward

### Step 5 — Assets, Holdings, and EOD Prices

- Asset/liability forms
- Stock holding form
- Historical quantity timeline
- Portfolio groups
- Price cache table
- `/api/prices`
- EOD price fetch
- Historical price lookup
- Manual price fallback
- Basic Portfolio Lab

### Step 6 — FIRE Engine

- Expenses
- Income
- Planning events
- Relative dates
- Simple FIRE number
- Deterministic projection
- Tax modes

### Step 7 — Social Security Guide

- Direct entry
- Formula calculator
- AIME
- PIA
- Claiming adjustment
- Today/future dollars
- Unofficial-estimate warning

### Step 8 — Monte Carlo

- Static historical data
- 12-month block bootstrap
- S&P 500 / Bond Equivalent / Cash allocation
- Sampled inflation
- Annual rebalancing
- Success metrics

### Step 9 — Saved Paths and Path Comparison

- Create/duplicate/rename/archive paths
- Compare many paths side by side
- Show deterministic and Monte Carlo outputs

### Step 10 — Optional Accounts

- Supabase Auth
- `plan_documents`
- RLS
- Cloud save/load/sync

### Step 11 — Polish and Tests

- Charts
- Empty states
- Warnings
- Mobile layout
- Calculation tests

---

## 21. Testing Requirements

Add tests for:

- Monthly/annual conversions
- Net worth calculation
- Stock market value calculation
- Latest snapshot on/before date
- Historical quantity change behavior
- Historical cash balance behavior
- Historical liability balance behavior
- Manual asset valuation behavior
- Price override behavior
- Historical price lookup fallback
- Price cache normalization
- Simple FIRE number
- Tax gross-up
- Family horizon
- Exact date timing
- Relative date timing
- Conservative allocation warning
- Social Security AIME
- Social Security PIA
- Early claiming reduction
- Delayed claiming credit
- Monte Carlo result shape
- Export/import round trip

---

## 22. Acceptance Criteria

MVP is complete when:

1. User can open public website.
2. User can use app without account.
3. User can optionally create account.
4. User can save locally.
5. Account user can save/load cloud plan.
6. User can export/import plan JSON.
7. User can enter stock quantity as of a past date.
8. User can enter a later quantity for the same ticker.
9. App uses the correct quantity for each historical date.
10. User can enter cash balance snapshots by date.
11. User can enter manual asset valuation snapshots by date.
12. User can enter liability balance snapshots by date.
13. App can calculate net worth as of any date with available inputs.
14. App can chart net worth over time.
15. App can show which quantities/prices/valuations were used for a selected date.
16. Editing an old snapshot updates future historical net-worth calculations.
17. User can fetch EOD prices.
18. User can manually override stock prices.
19. User can view basic Portfolio Lab.
20. User can create Saved Paths.
21. User can enter expenses and income.
22. User can use exact and relative dates.
23. User can enter Social Security directly.
24. User can use basic Social Security formula calculator.
25. User can run deterministic FIRE projection.
26. User can see Simple FIRE Age Estimate, Deterministic FIRE Age Estimate, and Monte Carlo FIRE Age Estimate.
27. User can choose one of two MVP FIRE Rule Modes for each Saved Path: Withdrawal-Rate FIRE or Income-Only FIRE.
28. User can view a Roadmap / Next Development section that documents Principal Preservation FIRE and Hybrid FIRE as future features.
29. User can run Monte Carlo.
30. User can compare many paths side by side.
31. Required warnings/disclaimers and legal guardrail language appear.
32. Initial build requires no paid service except optional domain purchase.

---

## 23. Explicit Later Roadmap and In-Product Next Development Section

The app must include a user-visible section called:

```text
Roadmap
```

or:

```text
Next Development
```

Recommended placement:

```text
Settings → Roadmap
```

or a footer link:

```text
Next Development
```

Purpose:

```text
Show users what features are planned next, what is not included in the MVP, and what is intentionally deferred.
```

This helps set expectations and reduces confusion when users ask why a feature is not available yet.

### 23.1 Roadmap Page MVP Requirements

The Roadmap / Next Development section must show:

```text
Current MVP features
Next planned features
Later planned features
Not currently planned / out of scope
```

The page should be static content in MVP.

### 23.2 Current MVP Features

Show these as current / included:

```text
Guest mode
Optional account cloud sync
Effective-dated historical holdings
Historical net-worth chart
End-of-day stock pricing
Basic Portfolio Lab
FIRE Path
Saved Paths
Path Comparison
Withdrawal-Rate FIRE
Income-Only FIRE
Direct Social Security entry
Basic Social Security formula calculator
Simple and account-level tax model
Historical Monte Carlo
```

### 23.3 Next Development

Show these as next planned features:

```text
Principal Preservation FIRE
Hybrid FIRE
Full buy/sell transaction ledger
Cost basis
Realized/unrealized gains
Tax lots
Dividend tracking
Reinvestment tracking
Stock split tracking
CSV import/export
Improved Portfolio Lab analytics
App-estimated portfolio income from holdings
More Social Security scenarios
```

### 23.4 Later Development

Show these as later planned features:

```text
Spousal/survivor Social Security
WEP/GPO
Tax optimization
Roth conversion planning
Required minimum distribution planning
Time-weighted return
Money-weighted return
Performance attribution
Brokerage/bank integrations
Paid market data plan if needed
```

### 23.5 Out of Scope for MVP

Show these as not included in MVP:

```text
Trading
Personalized investment advice
Real-time market data
Brokerage account linking
Bank account linking
Exact tax filing calculations
Guaranteed retirement recommendations
```

### 23.6 Roadmap Legal Copy

The Roadmap page must include:

```text
Roadmap items are planned features and may change. Household FIRE Planner provides planning estimates only and is not investment, tax, legal, or financial advice.
```


## 24. Codex Build Prompt

Copy this into Codex.

```text
You are helping me build Household FIRE Planner, an account-optional FIRE planning and wealth tracking web app.

Hard constraints:
- I am building this myself with Codex.
- Initial cash build budget must stay under $150.
- Use free tiers and open-source packages.
- Do not add paid services without asking.
- No brokerage/bank integrations.
- No real-time stock prices.
- End-of-day stock pricing is required.
- Historical net-worth tracking is required.
- Optional accounts are required.
- Guest mode is required.
- No investment advice language.
- Legal guardrails must be implemented in product copy.
- The app must say planning estimates only, not investment, tax, legal, or financial advice.
- The app must not recommend trades, securities, allocations, or retirement decisions.
- Earliest FIRE age must be labeled as an estimate under user assumptions, not a recommendation.

Tech stack:
- Next.js with TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- zod
- react-hook-form
- date-fns
- Dexie.js
- Supabase Auth/Postgres

MVP priorities:
1. Guest mode with IndexedDB.
2. Optional Supabase account/cloud sync.
3. PlanDocument JSON schema.
4. Effective-dated historical records:
   - MarketPosition with quantitySnapshots[]
   - CashAccount with balanceSnapshots[]
   - ManualAsset with valuationSnapshots[]
   - LiabilityAccount with balanceSnapshots[]
5. Historical net-worth engine:
   - calculateNetWorthAsOf(plan, date)
   - generateNetWorthSeries(plan, startDate, endDate, granularity)
   - historical date drilldown
   - cache invalidation from edited effective date forward
6. End-of-day stock price integration with daily cache and manual fallback.
7. Basic Portfolio Lab.
8. FIRE Path deterministic calculator.
9. Saved Paths.
10. Expenses/income with exact and relative dates.
11. Individual and Family Planning.
12. Social Security direct entry.
13. Basic Social Security formula calculator using manual earnings input.
14. Simple and account-level tax models.
15. FIRE Rule Modes for MVP:
   - Withdrawal-Rate FIRE
   - Income-Only FIRE
   Principal Preservation FIRE and Hybrid FIRE must be documented on the Roadmap page, not implemented in MVP.
16. Earliest FIRE age estimates:
   - Simple FIRE Age Estimate
   - Deterministic FIRE Age Estimate
   - Monte Carlo FIRE Age Estimate
17. Historical Monte Carlo with S&P 500 Stocks / Bond Equivalent / Cash.
18. Path Comparison.

Historical holdings requirement:
If user enters:
- AAPL 100 shares effective 2024-06-01
- AAPL 50 shares effective 2025-06-01

Then the app should use:
- 100 shares for dates from 2024-06-01 through 2025-05-31
- 50 shares for dates from 2025-06-01 forward

This is not a full transaction ledger. Do not require buy/sell transactions for MVP.

Social Security calculator:
- No SSN.
- No SSA login.
- Manual earnings input only.
- Compute AIME.
- Compute PIA.
- Apply early/delayed claiming adjustment.
- Show unofficial estimate disclaimer.
- Store only the result unless user explicitly saves earnings details.

End-of-day stock prices:
- User enters ticker and shares.
- App fetches latest EOD close from a free API.
- Cache by ticker/date.
- Display source/date.
- Allow manual price override.
- Work even if API fails.
- Do not expose API keys in client code.

FIRE Rule Modes:
- Each Saved Path must have a fireRuleMode.
- MVP supported modes: withdrawal_rate and income_only only.
- Withdrawal-Rate FIRE passes when portfolio never falls below $0.
- Income-Only FIRE passes when passive/guaranteed income covers expenses without planned principal withdrawals.
- Do not implement Principal Preservation FIRE or Hybrid FIRE in MVP.
- Document Principal Preservation FIRE and Hybrid FIRE on the Roadmap / Next Development page.
- Do not claim Income-Only FIRE guarantees principal market value will never decline.

Earliest FIRE age logic:
- Calculate three outputs: Simple FIRE Age Estimate, Deterministic FIRE Age Estimate, and Monte Carlo FIRE Age Estimate.
- Simple FIRE Age estimates when selected FIRE assets reach annual spending gap / withdrawal rate.
- Deterministic FIRE Age is the earliest candidate retirement date where fixed-assumption projection never runs out before the planning horizon.
- Monte Carlo FIRE Age is the earliest candidate retirement date where success rate meets or exceeds the selected threshold, default 90%.
- Search candidate retirement dates from today to planning horizon; first yearly, then monthly around first passing year.
- For Family Planning, horizon is the later of the two life expectancies.

Important language:
- Say "planning estimate", not guarantee.
- Say "Your plan survived in X% of simulated historical market paths", not "You have X% chance of success."
- Include "not investment, tax, legal, or financial advice" disclaimer.

Please start by generating:
1. Project setup commands.
2. File structure.
3. PlanDocument TypeScript types.
4. zod validation schema.
5. IndexedDB persistence functions.
6. Supabase schema for plan_documents and price_cache.
7. Sample plan data that includes:
   - AAPL 100 shares effective 2024-06-01
   - AAPL 50 shares effective 2025-06-01
   - Cash balance snapshots
   - Home valuation snapshots
   - Mortgage balance snapshots
8. Core calculateNetWorthAsOf function.
9. A task checklist for implementing EOD prices and the Social Security calculator.
Then wait for my review before building UI pages.
```
