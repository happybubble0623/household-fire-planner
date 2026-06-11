# Household FIRE Planner Portfolio Collections Design

Status: Approved design direction

Approved by founder: 2026-06-08

## Purpose

Portfolio Collections let users create their own analysis groups across accounts.

This solves a specific founder use case:

```text
I may want to select a few specific stocks from different accounts and manage them as a group to see allocation percentage for those specific stocks.
```

Collections are not the same as Account Owner, Account Type, Tax Treatment, or Include in FIRE. They are user-defined views for asking, "How big is this selected group, where is it held, and how much of my FIRE picture does it represent?"

## Approved Direction

Use manual collections first.

Manual collections mean:

- The user creates a collection name.
- The user optionally adds a short purpose.
- The user selects holdings from the portfolio table.
- A holding can belong to more than one collection.
- The app calculates collection totals and allocation percentages.
- The app does not automatically create rule-based collections in the first version.

This is preferred over keeping `Custom Group` as a plain text note because the founder needs analysis behavior, not only tagging.

## Concept Separation

Keep these concepts separate:

| Concept | Meaning | Example |
|---|---|---|
| Account Owner | Who owns the account | User 1, User 2, Joint, Child |
| Account Type | Legal/account wrapper | Taxable Investment Account, Roth IRA, Traditional 401(k), HSA |
| Tax Treatment | Tax handling used for planning context | Taxable, Tax-Deferred / Pre-tax, Roth / After-tax, HSA, Not Applicable |
| Include in FIRE | Whether the row contributes to FIRE assets | Yes / No |
| Collection | User-defined analysis group | High Risk, Bridge Fund, FIRE Core |

Collections should never replace first-class account structure.

## Approved UI Flow

The approved mockup used a three-step flow.

### Step 1: Create Collection

The user can create a collection from suggested examples or type their own.

Fields:

- Collection Name
- Purpose
- Optional target range

Suggested collection examples:

- FIRE Core
- Bridge Fund
- High Risk / Speculative
- Rebalance Watch
- Income / Dividend
- Custom Goal

The default implementation should not require target ranges. Target ranges can be optional because they move closer to rebalancing guidance.

### Step 2: Add Holdings Across Accounts

The user selects holdings from the existing portfolio table.

The selection table should show enough context to avoid mistakes:

- Holding name or symbol
- Account
- Tax bucket
- Balance

The user should be able to select holdings from different accounts and add them to the same collection.

### Step 3: Analyze Collection In Portfolio Overview

The collection management section should stay lightweight. It should show collection name, purpose, edit/delete actions, and assigned-row count.

Collection allocation should be reviewed through the shared Portfolio Overview chart instead of a separate collection-specific view.

Example:

```text
Analyze by: Collection
Focus: High Risk / Speculative
Allocation view: Market Holding Risk Exposure or Holdings
```

## Table Behavior

The portfolio table should keep the main row structure simple.

Preferred table behavior:

- Show a `Collections` column with compact labels.
- Allow multiple collection labels per row.
- Support row selection plus an `Add to Collection` action.
- Avoid turning the main table into a complex group-management screen.
- Use Portfolio Overview, not a separate collection detail list, to review collection allocation and specific holding percentages.

Example:

```text
Holding   Account Context           Tax Treatment       Balance   Collections
VTI       User 1 | Roth IRA         Roth / After-tax    $42,000   FIRE Core
BTC       Joint | Crypto Account / Wallet  Taxable      $18,000   High Risk
MSFT      User 2 | Taxable Investment Account  Taxable  $25,000   FIRE Core, Rebalance Watch
```

## Data Shape

The collection feature should be modeled as first-class data, not only a string field on each portfolio row.

Conceptual shape:

```ts
type PortfolioCollection = {
  id: string;
  name: string;
  purpose?: string;
  targetMinPercent?: number;
  targetMaxPercent?: number;
  createdAt: string;
  updatedAt: string;
};

type PortfolioCollectionMembership = {
  collectionId: string;
  portfolioItemId: string;
};
```

This keeps collections flexible because one holding can appear in multiple collections.

## Calculations

For each collection, calculate:

- `collectionBalance`: sum of balances for included holdings
- `percentOfNetWorth`: collection balance divided by total net worth
- `percentOfFireAssets`: collection balance divided by included FIRE assets
- `holdingMixPercent`: each holding balance divided by collection balance

Liabilities should be handled carefully:

- If a liability is included in a collection, its negative balance should affect the collection total.
- The UI should make this clear so users do not confuse a liability with a positive asset.

## Phase Boundary

Approved for product direction, but implementation should remain scoped.

Include in first implementation:

- Create/edit/delete collections
- Add/remove holdings manually
- Show collection labels in the portfolio table
- Show collection total and allocation percentages
- Persist locally with the existing local-first storage model
- Include collections in CSV/XLSX export/import if feasible without making import brittle

Defer:

- Rule-based smart collections
- Automatic collection suggestions
- Historical collection allocation over time
- Rebalancing recommendations
- Investment advice language
- Brokerage-linked grouping
- Complex nested collections

## Acceptance Criteria

- User can create a collection with a custom name.
- User can select holdings across accounts and add them to the collection.
- User can see which collections each holding belongs to.
- User can view the collection total and allocation percentages.
- User can edit or delete a collection.
- Deleting a collection does not delete the underlying portfolio holdings.
- One holding can belong to multiple collections.
- The UI distinguishes Account Owner, Account Type, Tax Treatment, Include in FIRE, and Collection.
- The feature does not require cloud sync or account login.

## Implementation Note

Do not implement from the temporary visual mockup alone.

Implementation should follow this written spec plus the current Phase 1 app constraints. If the implementation changes the data model, import/export, or portfolio table columns, update the relevant Phase 1 design and architecture docs first.

## Implementation Notes

- Collections are stored in `Phase1Workbook.portfolioCollections`.
- Memberships are stored in `Phase1Workbook.portfolioCollectionMemberships`.
- Portfolio rows can include optional `accountOwner`, `accountName`, and `accountType` metadata, but Phase 1 manual entry hides Account Name to reduce input burden.
- Collection holding summaries display Account Owner, Account Type, and Tax Treatment so users can understand where selected holdings sit without using collections as account labels.
- Collection names are validated as unique case-insensitively in the Phase 1 UI.
- CSV/XLSX export writes collection names in a semicolon-separated `collections` column.
- CSV/XLSX import accepts the legacy `custom_group` column and migrates it into collections when `collections` is blank or missing.
- Workspace load and update paths normalize workbooks so older local data receives collection arrays and legacy `customGroup` migration safely.
