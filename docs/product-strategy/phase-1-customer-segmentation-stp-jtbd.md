# Household FIRE Planner Phase 1 Customer Segmentation, STP, and JTBD

Status: Draft customer analysis for founder review

This file contains the customer-group analysis only. The structured product-design flow lives separately in:

```text
docs/product-strategy/product-design-flow.md
```

This document pauses at customer-group understanding and scoring. It does not choose the beachhead customer yet, and it does not define final positioning or feature prioritization.

## 1. Updated Pain Point

One major pain Household FIRE Planner may solve is multi-account investment fragmentation.

Many people do not have one simple portfolio. They may have:

- Several personal taxable brokerage accounts
- Roth IRA accounts
- Traditional IRA accounts
- 401(k) accounts
- Brokerage-link 401(k) accounts
- HSA accounts
- Spouse or partner accounts of each type
- Cash, home equity, debt, and other assets

As markets move, total net worth can change dramatically. Portfolio allocation can drift across accounts without the user noticing. A household may have a different allocation in each account, and the combined household allocation may not match what they think they own.

The hard questions are not only:

- "When can I reach FIRE?"
- "What is my net worth?"

They are also:

- "What do we own across every account?"
- "Which accounts and assets count toward FIRE?"
- "What is taxable, tax-deferred, tax-free, or HSA?"
- "What belongs to me versus my spouse?"
- "How did market movement change our FIRE position?"
- "Has our allocation drifted?"
- "Which planning decision should we revisit?"

## 2. Is This Value Added?

Yes, this looks value added.

The new pain point changes the opportunity. Household FIRE Planner is not just a simple FIRE calculator. It can become a FIRE-aware portfolio clarity tool for people whose financial life is split across many accounts.

The value is strongest if Household FIRE Planner helps users bridge three things:

- Account structure: taxable, Roth, 401(k), HSA, spouse accounts, cash, home, liabilities
- Portfolio reality: current holdings, balances, allocation, market fluctuation, EOD refresh
- FIRE planning: what counts toward FIRE, spending gap, target assets, and planning assumptions

This is a more differentiated problem than "calculate my FIRE number." Many tools can calculate a FIRE number. Fewer tools make account-level portfolio complexity understandable in a FIRE planning context.

Important caveat: some existing tools do cover parts of this problem.

- Empower emphasizes connected financial accounts, net worth, retirement planning, and investment views.
- Monarch supports connected investment accounts, manual holdings, net worth, portfolio performance, and allocation.
- Kubera focuses on all-in-one net worth and modern asset tracking.
- ProjectionLab is strong on planning, account types, long-term scenarios, and no direct account linking.

The opportunity for Household FIRE Planner is not "no one does any of this." The opportunity is a more specific wedge:

```text
FIRE-aware multi-account portfolio clarity without requiring brokerage linking.
```

Reference points for later competitor analysis:

- [Empower financial tools](https://www.empower.com/tools)
- [Empower Personal Dashboard overview](https://support-personalwealth.empower.com/hc/en-us/articles/201169740-Dashboard-Overview)
- [Monarch investment account support](https://help.monarchmoney.com/hc/en-us/articles/41855507661076-Investments-in-Monarch)
- [Monarch account connection guide](https://help.monarchmoney.com/hc/en-us/articles/360048393352-Guide-to-Connecting-Your-Accounts)
- [Kubera net worth tracker positioning](https://help.kubera.com/article/19-kubera-is-different-from-mint-ynab-personalcapital)
- [ProjectionLab account-linking position](https://projectionlab.com/help/can-i-link-accounts)

## 3. How This Changes The Earlier Analysis

The analysis changes in three ways:

1. Multi-account complexity should become a primary segmentation dimension, not a minor portfolio feature.
2. Household/family account structure becomes more important, even if full family planning is not Phase 1.
3. The strongest first customer may be someone who already tracks FIRE in spreadsheets because their accounts are too fragmented for generic tools to explain clearly.

The best early segment may be a blend of:

- DIY FIRE spreadsheet users
- Multi-account self-directed investors
- Privacy-first users who do not want brokerage sync
- Couples or households with separate retirement accounts

## 4. Analysis Scope

Phase 1 is still intentionally narrow:

- No account login required
- Local IndexedDB autosave
- Path to FIRE first
- Understand Portfolio second
- Latest/current portfolio only
- CSV/XLSX import/export
- Manual EOD price refresh
- No historical records, saved paths, Monte Carlo, Social Security, advanced tax modeling, or cloud sync in the Phase 1 UI

This creates a strategy tension:

- The new multi-account pain is very valuable.
- The current Phase 1 data model may need at least lightweight account grouping later to fully solve it.

For now, customer scoring should ask:

```text
Can Phase 1 prove enough of this problem with current portfolio rows, tax bucket, Include in FIRE, and custom group?
```

## 5. Customer Selection Scorecard

Scores are hypotheses, not final truth.

Scoring scale:

- 1 = weak fit
- 3 = medium fit
- 5 = strong fit

Criteria:

- Pain intensity: how strongly and often the group feels the problem
- Account complexity fit: how much the new multi-account pain applies
- Phase 1 fit: how well the current Phase 1 scope can help them
- Reachability: how easy it is to find, talk to, or recruit them
- Differentiation: how clearly Household FIRE Planner can stand out from alternatives
- Trust and compliance simplicity: higher means lower trust/compliance friction
- Expansion potential: whether the group can support future product depth

Maximum score: 35

## 6. Possible Customer Groups

### 6.1 Multi-Account FIRE Households

STP view:

- Segment: households with taxable, Roth, 401(k), HSA, spouse accounts, and multiple brokers
- Targeting attractiveness: very high
- Positioning implication: account-level clarity for household FIRE planning

JTBD:

```text
When our investments are spread across many household accounts, I want one clear FIRE-aware view of what we own, so we can understand whether we are on track and what changed after market movement.
```

What they care about:

- Account-level organization
- Household-level total net worth
- Owner/spouse distinction
- Tax bucket clarity
- FIRE inclusion/exclusion
- Allocation drift
- Manual import/export
- Trustworthy current values

Phase 1 concern:

- Current Phase 1 has tax bucket and custom group, but not a dedicated account owner/account name model. This segment may need lightweight account grouping soon.

### 6.2 DIY FIRE Spreadsheet Power Users

STP view:

- Segment: people already tracking FIRE manually in spreadsheets
- Targeting attractiveness: very high
- Positioning implication: spreadsheet-like control with less manual maintenance

JTBD:

```text
When my portfolio, accounts, prices, or assumptions change, I want to update my FIRE picture quickly, so I can avoid rebuilding and debugging my spreadsheet.
```

What they care about:

- Transparent formulas
- CSV/XLSX import/export
- Manual control
- No data lock-in
- Account/tax-bucket flexibility
- Assumption clarity

Phase 1 concern:

- They may expect spreadsheet-level flexibility and may notice any missing column, grouping, or formula limitation.

### 6.3 Self-Directed Investors With Tax-Bucket Complexity

STP view:

- Segment: investors with taxable, traditional, Roth, HSA, and 401(k) brokerage-link accounts
- Targeting attractiveness: high
- Positioning implication: connect portfolio structure to FIRE planning assumptions

JTBD:

```text
When my investments sit in different tax buckets, I want to understand what counts toward FIRE and where it sits, so I can make more realistic planning decisions.
```

What they care about:

- Tax bucket
- Account type
- Asset location
- FIRE asset inclusion
- Portfolio allocation across tax buckets
- Simple but accurate summaries

Phase 1 concern:

- Advanced tax optimization is out of scope, so Phase 1 should avoid promising tax strategy.

### 6.4 Stock/ETF/Mutual-Fund Heavy Self-Directed Investors

STP view:

- Segment: investors with many market holdings across several accounts
- Targeting attractiveness: high
- Positioning implication: current holdings and EOD price refresh without brokerage linking

JTBD:

```text
When I hold many tickers across accounts, I want current values updated with less manual work, so I can see my real investable base and allocation.
```

What they care about:

- EOD price refresh
- Symbol search accuracy
- CSV/XLSX import
- Units and balances
- Allocation views
- Account grouping
- Historical performance
- Backtesting
- Benchmark comparison
- Allocation drift over time

Phase 1 concern:

- This group may expect historical returns, contribution-adjusted performance, benchmark comparison, allocation drift over time, and portfolio backtesting. Phase 1 can serve current-portfolio clarity, but should avoid positioning itself as a historical performance-analysis or backtesting tool.
- They may also want automatic account sync, intraday prices, or deeper performance analytics.

### 6.5 Privacy-First No-Account Portfolio Consolidators

STP view:

- Segment: people who avoid linking brokerage, bank, or cloud accounts
- Targeting attractiveness: high
- Positioning implication: local-first investment clarity without handing over credentials

JTBD:

```text
When I consolidate my financial picture, I want to keep sensitive account data under my control, so I can plan without connecting brokerage or bank accounts.
```

What they care about:

- No required account
- Local storage
- Export backup
- Manual import
- No brokerage credentials
- Clear privacy posture

Phase 1 concern:

- Local-first storage requires strong backup/export habits.

### 6.6 High-Income Accumulation-Stage FIRE Aspirants

STP view:

- Segment: high earners saving aggressively across retirement and taxable accounts
- Targeting attractiveness: high
- Positioning implication: turn complex savings and portfolio growth into a clearer FIRE path

JTBD:

```text
When I am saving aggressively across many accounts, I want to see how savings, expenses, and portfolio values affect my FIRE timeline, so I can make better tradeoffs today.
```

What they care about:

- Savings rate
- Current FIRE assets
- Tax bucket mix
- Account contributions
- FIRE age estimate
- Scenario comparison

Phase 1 concern:

- Scenario comparison and account contribution modeling are not yet in Phase 1.

### 6.7 Near-FIRE Optimizers

STP view:

- Segment: users within roughly 5-10 years of possible FIRE
- Targeting attractiveness: medium-high
- Positioning implication: test whether current assets across accounts can support the next life stage

JTBD:

```text
When I am close to financial independence, I want to know whether my combined accounts can support my spending through life expectancy, so I can decide whether to keep working, save more, or adjust assumptions.
```

What they care about:

- Portfolio survival
- Inflation
- Tax buckets
- Passive income
- Account accessibility
- Conservative wording
- Monte Carlo

Phase 1 concern:

- This group may need Monte Carlo, advanced tax modeling, Social Security, and sequence-risk analysis soon.

### 6.8 Couples / Family FIRE Planners

STP view:

- Segment: couples with separate retirement accounts and shared financial independence goals
- Targeting attractiveness: medium-high
- Positioning implication: household-level FIRE clarity across both partners' accounts

JTBD:

```text
When my spouse and I each have separate accounts, I want a combined planning view, so we can make household decisions from the same financial picture.
```

What they care about:

- Owner/spouse account grouping
- Household net worth
- Shared FIRE assets
- Different account types
- Shared assumptions
- Family planning horizon

Phase 1 concern:

- Full Family Plan is future scope, but lightweight owner/account grouping could still be valuable.

### 6.9 Multi-Asset Household Net-Worth Trackers

STP view:

- Segment: users tracking investments, cash, home, debt, and other assets
- Targeting attractiveness: medium-high
- Positioning implication: distinguish total net worth from FIRE-relevant assets

JTBD:

```text
When my wealth is spread across assets and liabilities, I want to separate total net worth from FIRE assets, so I do not overestimate retirement readiness.
```

What they care about:

- Asset/liability table
- Total net worth
- Included in FIRE
- Home equity treatment
- Debt treatment
- Custom groups

Phase 1 concern:

- They may expect historical net-worth charts and account sync.

### 6.10 Coast FIRE / Barista FIRE Planners

STP view:

- Segment: people considering reduced work, partial income, or income-supported FIRE
- Targeting attractiveness: medium
- Positioning implication: compare portfolio-funded FIRE with income-supported paths

JTBD:

```text
When I am considering reduced work or partial income, I want to see how income changes my FIRE timeline, so I can decide whether full retirement is necessary.
```

What they care about:

- Passive or guaranteed income
- Part-time income
- Income-only FIRE
- Spending gap
- Flexible assumptions

Phase 1 concern:

- Phase 1 has summary income only and no saved path comparison.

### 6.11 Beginner FIRE Learners

STP view:

- Segment: people new to FIRE concepts
- Targeting attractiveness: medium
- Positioning implication: simple FIRE education with portfolio awareness

JTBD:

```text
When I am learning about FIRE, I want to understand how expenses, savings, assets, and withdrawal rate connect, so I can know what actions matter most.
```

What they care about:

- Clear explanations
- Low complexity
- Simple inputs
- Confidence
- Education

Phase 1 concern:

- Multi-account portfolio modeling may overwhelm beginners.

### 6.12 Real Estate Heavy Investors

STP view:

- Segment: users with home equity, rental properties, and mortgages
- Targeting attractiveness: medium-low for Phase 1
- Positioning implication: avoid confusing illiquid real estate wealth with spendable FIRE assets

JTBD:

```text
When real estate is a major part of my wealth, I want to separate property value, debt, rental income, and liquid FIRE assets, so I can make realistic planning decisions.
```

What they care about:

- Property values
- Mortgage balances
- Rental income
- Liquidity
- Include/exclude from FIRE

Phase 1 concern:

- Phase 1 supports direct balances but not rental income schedules or property-specific cash flow.

### 6.13 Crypto / Options / Active Trading Investors

STP view:

- Segment: users with crypto, options, and actively traded positions
- Targeting attractiveness: low for Phase 1
- Positioning implication: decide how volatile assets should affect FIRE readiness

JTBD:

```text
When volatile assets are part of my net worth, I want to decide how much should count toward FIRE, so I do not make long-term plans from unreliable values.
```

What they care about:

- Current prices
- Volatility
- Options contracts
- Manual overrides
- Risk treatment

Phase 1 concern:

- Options are explicitly deferred. Crypto can be supported as a market holding, but advanced risk modeling is not in Phase 1.

### 6.14 Budgeting App Users Who Want FIRE Planning

STP view:

- Segment: users of budgeting or net-worth tools who want a FIRE-specific planning layer
- Targeting attractiveness: medium-low
- Positioning implication: translate tracked finances into a FIRE path

JTBD:

```text
When I already track accounts elsewhere, I want a FIRE-specific planning view, so I can translate my current finances into a retirement timeline.
```

What they care about:

- Account sync
- Spending trends
- Budget categories
- Net worth
- Automatic updates

Phase 1 concern:

- They may expect Monarch, Empower, or YNAB-style account automation and budgeting depth.

### 6.15 Traditional Near-Retirement Households

STP view:

- Segment: people nearing traditional retirement age, often 55-65
- Targeting attractiveness: medium-low for Phase 1
- Positioning implication: simplified retirement readiness estimates

JTBD:

```text
When retirement is approaching, I want to know whether my savings, income, Social Security, and taxes can support my spending, so I can retire with confidence.
```

What they care about:

- Social Security
- Taxes
- Healthcare
- Spouse planning
- Required minimum distributions
- Advisor-level confidence

Phase 1 concern:

- Phase 1 does not include many of this segment's must-have planning features.

### 6.16 Small Business Owners / Private Equity Heavy Users

STP view:

- Segment: people with business equity, private investments, or uneven income
- Targeting attractiveness: low-medium for Phase 1
- Positioning implication: separate liquid FIRE assets from illiquid paper wealth

JTBD:

```text
When much of my net worth is illiquid or hard to value, I want to separate planning assets from paper wealth, so I can make more realistic FIRE decisions.
```

What they care about:

- Custom assets
- Liquidity
- Conservative valuations
- Manual control
- Scenario planning

Phase 1 concern:

- This group needs stronger custom modeling and scenario work.

### 6.17 Debt-Heavy Financial Reset Users

STP view:

- Segment: users focused first on debt payoff and financial stability
- Targeting attractiveness: low for Phase 1
- Positioning implication: show how liabilities affect long-term financial freedom

JTBD:

```text
When debt blocks my financial goals, I want to understand how liabilities affect my future options, so I can plan toward stability and eventual independence.
```

What they care about:

- Debt payoff
- Budgeting
- Cash flow
- Interest rates
- Behavior support

Phase 1 concern:

- This is more debt planning and budgeting than FIRE planning.

### 6.18 Financial Coaches / Advisors

STP view:

- Segment: professionals helping others plan financial independence
- Targeting attractiveness: low for Phase 1
- Positioning implication: client-friendly FIRE scenario workspace

JTBD:

```text
When I work with a client, I want to model FIRE assumptions clearly, so I can explain tradeoffs and document planning conversations.
```

What they care about:

- Client management
- Reports
- Compliance
- Shared access
- Data security
- Professional polish

Phase 1 concern:

- Higher legal/compliance burden and multi-client features are out of scope.

## 7. Scoring Summary

| Customer group | Pain | Account complexity | Phase 1 fit | Reach | Differentiation | Trust simplicity | Expansion | Total / 35 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Multi-account FIRE households | 5 | 5 | 4 | 4 | 5 | 4 | 5 | 32 |
| DIY FIRE spreadsheet power users | 5 | 4 | 5 | 4 | 5 | 4 | 5 | 32 |
| Self-directed investors with tax-bucket complexity | 5 | 5 | 4 | 4 | 5 | 3 | 5 | 31 |
| Privacy-first no-account portfolio consolidators | 4 | 4 | 5 | 3 | 5 | 5 | 4 | 30 |
| High-income accumulation-stage FIRE aspirants | 4 | 4 | 4 | 4 | 4 | 4 | 5 | 29 |
| Stock/ETF/mutual-fund heavy self-directed investors | 5 | 4 | 3 | 4 | 4 | 4 | 5 | 29 |
| Near-FIRE optimizers | 5 | 4 | 3 | 3 | 4 | 3 | 5 | 27 |
| Couples / family FIRE planners | 4 | 5 | 3 | 3 | 4 | 3 | 5 | 27 |
| Multi-asset household net-worth trackers | 4 | 4 | 4 | 3 | 3 | 4 | 5 | 27 |
| Coast FIRE / Barista FIRE planners | 4 | 3 | 3 | 3 | 4 | 4 | 4 | 25 |
| Beginner FIRE learners | 3 | 1 | 4 | 4 | 3 | 5 | 3 | 23 |
| Traditional near-retirement households | 5 | 4 | 2 | 3 | 2 | 2 | 5 | 23 |
| Real estate heavy investors | 4 | 3 | 2 | 3 | 3 | 3 | 4 | 22 |
| Budgeting app users who want FIRE planning | 3 | 3 | 2 | 4 | 2 | 4 | 4 | 22 |
| Small business owners / private equity heavy users | 4 | 3 | 2 | 2 | 4 | 3 | 4 | 22 |
| Crypto / options / active trading investors | 4 | 3 | 2 | 3 | 3 | 2 | 4 | 21 |
| Financial coaches / advisors | 4 | 4 | 1 | 2 | 3 | 1 | 5 | 20 |
| Debt-heavy financial reset users | 4 | 2 | 1 | 3 | 2 | 4 | 3 | 19 |

## 8. Early Interpretation

The new pain point meaningfully changes the ranking.

The strongest Phase 1-aligned groups now appear to be:

1. Multi-account FIRE households
2. DIY FIRE spreadsheet power users
3. Self-directed investors with tax-bucket complexity
4. Privacy-first no-account portfolio consolidators
5. High-income accumulation-stage FIRE aspirants

The most promising wedge may not be "FIRE calculator." It may be:

```text
FIRE-aware portfolio clarity for people whose accounts are fragmented across brokers, tax buckets, and household members.
```

This wedge is stronger because it connects a real operational pain to the FIRE planning problem:

- Users already have the data, but it is scattered.
- Market fluctuation changes the answer often.
- Allocation and FIRE readiness can drift without obvious warning.
- Generic net-worth tools may not explain what counts toward FIRE.
- Generic FIRE calculators may not understand account structure.

Stock/ETF/mutual-fund heavy self-directed investors remain valuable, but they are less clean as a Phase 1 beachhead because they may expect backward-looking performance analysis and backtesting. They are better treated as a supporting segment unless Household FIRE Planner intentionally expands toward historical performance and portfolio-analysis features.

## 9. Strategic Implications For Phase 1

This does not mean Phase 1 must become a full account aggregation app.

It does mean the product strategy should consider account structure as a core concept.

Possible Phase 1 or Phase 1.5 implications to evaluate later:

- Add Account Name as a first-class field, not only Custom Group
- Add Account Owner, such as Self, Spouse, Joint, or Household
- Add Account Type, such as Taxable Brokerage, Roth IRA, Traditional IRA, 401(k), Brokerage Link 401(k), HSA, Cash, Home, Liability, Other
- Keep Tax Bucket separate from Account Type
- Show totals by account, account type, tax bucket, owner, and Include in FIRE
- Show allocation across the whole household, not only rows
- Preserve manual import/export as the primary entry path
- Keep brokerage sync deferred unless the product strategy changes

These are not implementation decisions yet. They are strategic implications for the next product-design step.

## 10. Groups That May Be Better For Later

These groups remain less ideal for Phase 1:

- Traditional near-retirement households, because they need Social Security, taxes, healthcare, and Monte Carlo
- Advisors/coaches, because they create compliance and multi-client needs
- Active options traders, because options pricing and risk modeling are deferred
- Debt-heavy users, because their primary problem is budgeting/debt payoff
- Real estate-heavy investors, unless real estate cash flow becomes a core product direction

## 11. Review Questions Before Choosing A Beachhead

Please review the updated customer groups and scoring before moving to beachhead selection.

Questions to answer next:

1. Is the multi-account household pain the main pain you want Household FIRE Planner to solve first?
2. Should the first target be individual investors with many accounts, or households/couples with spouse accounts?
3. Do you want account structure to become a first-class product concept, or stay inside Custom Group for Phase 1?
4. Which account types are most important for the first version: taxable, Roth, 401(k), brokerage-link 401(k), HSA, cash, home, liability?
5. Are you more interested in solving current net-worth/allocation clarity, FIRE timing, or the bridge between both?
6. Which customer group do you personally understand well enough to interview first?

After you decide, the next step is to choose one beachhead customer, then work on positioning and feature prioritization.

