# Household FIRE Planner Architecture

Status: Canonical current Phase 1 technical contract  
Last updated: 2026-06-10  
Audience: AI/code agents and developers making changes

## Current Technical Stack

Runtime:

- Next.js `16.2.7`
- React `19.2.7`
- TypeScript `6.0.3`
- Tailwind CSS `4.3.0`

Core libraries:

- Dexie `4.4.3` for browser IndexedDB local storage.
- XLSX `0.18.5` for CSV/XLSX portfolio import/export.
- Recharts `3.8.1` for charts.
- Lucide React `1.17.0` for icons.
- Supabase JS `2.107.0` exists but is future/cloud code for Phase 1.
- Zod exists for legacy/broader plan validation.

Verification:

- Vitest `4.1.8`
- Testing Library React
- ESLint `9.39.4`
- Next build

Commands:

```bash
npm install
npm run dev
npm test -- --run
npm run lint
npm run build
```

## Directory Structure

Important current files:

```text
src/app/
  app/fire-path/page.tsx
  app/fire-path/withdrawal-rate/page.tsx
  app/fire-path/principal-preserving/page.tsx
  app/fire-path/income-stream/page.tsx
  app/fire-path/passive-income/page.tsx
  app/fire-path/tools/*/page.tsx
  app/portfolio-lab/page.tsx
  api/prices/route.ts
  api/symbols/route.ts
  globals.css

src/components/
  layout/app-shell.tsx
  planning/phase1-workspace.tsx
  planning/path-to-fire-panel.tsx
  planning/fire-strategy-panel.tsx
  planning/portfolio-panel.tsx
  planning/portfolio-collections-panel.tsx
  planning/planning-tool-panel.tsx
  ui/button.tsx
  ui/card.tsx
  ui/info-popover.tsx

src/lib/
  phase1/default-workbook.ts
  phase1/workbook.ts
  phase1/fire.ts
  phase1/portfolio.ts
  phase1/collections.ts
  phase1/portfolio-file.ts
  storage/phase1-store.ts
  market-data/eodhd.ts
  market-data/prices.ts
  market-data/price-cache.ts
  calculations/social-security.ts

src/types/
  phase1.ts
  market-data.ts
  plan.ts

docs/
  AI_HANDOFF.md
  product-strategy/
  superpowers/

supabase/
  schema.sql
```

Legacy/broader files still exist:

- `src/components/planning/plan-workspace.tsx`
- `src/types/plan.ts`
- `src/lib/storage/supabase-sync.ts`
- `src/lib/storage/local-store.ts`
- `src/lib/storage/plan-io.ts`
- `src/lib/calculations/*`
- `src/lib/data/historical-returns.ts`
- `freedom_path_full_codex_handoff_prd_v1_7.md`

Do not treat those as current Phase 1 UX unless the root docs say so.

## Route Contract

Visible Phase 1 routes:

- `/app/fire-path`
- `/app/portfolio-lab`

FIRE mode routes:

- `/app/fire-path/withdrawal-rate`
  - User-facing mode: `Portfolio Drawdown FIRE`.
  - Route name is legacy.
- `/app/fire-path/principal-preserving`
  - User-facing mode: `Principal-Preserving FIRE`.
- `/app/fire-path/income-stream`
  - User-facing mode: `Income Stream FIRE`.
- `/app/fire-path/passive-income`
  - Legacy compatibility route.
  - Must render the same mode as `income-stream`.

Tool routes:

- `/app/fire-path/tools/social-security`
- `/app/fire-path/tools/mortgage`
- `/app/fire-path/tools/investment`

Legacy/future routes redirect to `/app/fire-path` or equivalent. Do not re-add them to visible navigation without founder approval.

## Data Model

Current canonical Phase 1 model lives in `src/types/phase1.ts`.

### Phase1Workbook

```ts
type Phase1Workbook = {
  id: "phase1-default";
  schemaVersion: "phase1.6";
  updatedAt: string;
  fireInputs: Phase1FireInputs;
  portfolioItems: Phase1PortfolioItem[];
  portfolioCollections: Phase1PortfolioCollection[];
  portfolioCollectionMemberships: Phase1PortfolioCollectionMembership[];
  lastEodRefreshAt?: string;
  lastImportExportStatus?: string;
};
```

Rules:

- Normalize all loaded workbooks through `normalizePhase1Workbook`.
- Any schema change must bump the schema version and add defaults/migration behavior.
- Keep the workbook local-first unless the founder explicitly reintroduces cloud sync.

### FIRE Inputs

Current fields:

- `currentAge`
- `lifeExpectancy`
- `passiveIncomeFireAge` (used by Income Stream FIRE as the planned FIRE age; ignored by Principal-Preserving FIRE, which computes the earliest qualifying age as an output)
- `fireRuleMode`
- `currentFireAssets`
- `annualExpenses`
- `expensesInflationAdjusted`
- `useExpenseCategoriesOverride`
- `expenseCategories`
- `annualPassiveGuaranteedIncome`
- `passiveGuaranteedIncomeInflationAdjusted`
- `useIncomeSourcesOverride`
- `incomeSources`
- `annualSavingsBeforeFire`
- `expectedAnnualPortfolioReturnPercent` (total return in Portfolio Drawdown FIRE; in Principal-Preserving FIRE it is the non-cash appreciation portion only, labeled `Expected appreciation return`)
- `expectedCashGeneratingReturnPercent` (cash yield from dividends, interest, and distributions; in Principal-Preserving FIRE the total return is this plus the appreciation portion)
- `inflationRatePercent`
- `withdrawalRatePercent`
- `taxMode`
- `simpleEffectiveTaxRatePercent`

Important:

- `withdrawalRatePercent` is legacy/future quick-tool state and is not a required input in Portfolio Drawdown FIRE.
- Expense categories replace simple annual expenses only when `useExpenseCategoriesOverride` is true.
- Income sources replace simple passive income only when `useIncomeSourcesOverride` is true.

### Portfolio Item

Current fields:

- `id`
- `type`
- `name`
- `symbol`
- `accountOwner`
- `accountName`
- `accountType`
- `taxBucket`
- `includedInFire`
- `unitPrice`
- `units`
- `balance`
- `customGroup`
- `priceStatus`
- `priceDate`
- `priceWarning`

Current asset types:

- `stock`
- `etf`
- `mutual_fund`
- `crypto`
- `bond`
- `option`
- `cash`
- `home`
- `liability`
- `other_asset`

Rules:

- `accountName` is a legacy compatibility field in the data/file model, not a visible Phase 1 product concept. Do not add an Account Name input unless the founder explicitly changes the product decision.
- `customGroup` is legacy compatibility state. Collections are the current first-class grouping model.
- Home and liability account owner should resolve to `Household shared`.
- Liability balances are stored/displayed as negative balances.
- Market-priced types are stock, ETF, mutual fund, crypto, and bond.
- Market-priced holdings use `unitPrice * units` when both exist.
- Plan-only/no-public-ticker holdings can use direct balance entry.
- Options remain deferred despite the type existing.

### Portfolio Collections

Models:

- `Phase1PortfolioCollection`
- `Phase1PortfolioCollectionMembership`

Rules:

- Collections are allocation groups, not notes.
- Holdings can belong to multiple collections.
- Memberships must be deduped by `collectionId:portfolioItemId`.
- Collection summary must handle zero denominators safely.

## Storage Layer

Current Phase 1 storage:

- File: `src/lib/storage/phase1-store.ts`
- Database: `freedom-path-phase1`
- Dexie store: `workbooks`
- Default workbook id: `phase1-default`

Behavior:

- `ensurePhase1Workbook()` loads the default workbook or creates one.
- `savePhase1Workbook()` normalizes, timestamps, and writes the workbook.
- `Phase1Workspace` autosaves after changes with a debounce.

Do not claim seamless device transfer. IndexedDB does not move with source files. Full workbook export/import is still a gap.

## Service Layer Conventions

### FIRE Calculations

File: `src/lib/phase1/fire.ts`

Rules:

- Keep formulas pure and deterministic.
- Validate inputs before calculating.
- Use `calculateExpensesForYear` for all annual expense needs.
- Use `calculatePassiveIncomeForYear` for passive/guaranteed income after FIRE.
- Use `calculatePreFireIncomeForYear` only for detailed income sources with timing before FIRE.
- Projection rows must use actual calendar years from `new Date().getFullYear()`.

Do not:

- Reintroduce withdrawal rate as a required drawdown input.
- Double-count simple expenses with expense categories.
- Double-count simple passive income with income sources.
- Let Income Stream FIRE imply asset survival.
- Let Principal-Preserving FIRE pass when assets dip below the principal floor.
- Reintroduce a user-set FIRE age input for Principal-Preserving FIRE; it computes the earliest qualifying age as an output.

### Portfolio Domain

File: `src/lib/phase1/portfolio.ts`

Rules:

- Centralize balance normalization and included-in-FIRE summary.
- Price refresh should update `unitPrice`, `balance`, `priceStatus`, `priceDate`, and `priceWarning`.
- Unsupported or failed prices should preserve manual workflow.

### Portfolio File Import/Export

File: `src/lib/phase1/portfolio-file.ts`

Rules:

- Support CSV and XLSX.
- Use one set of headers:
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
- Optional legacy `account_name` is still accepted/exported for backwards compatibility, but it is not a current visible Phase 1 product field.
- Accept legacy `custom_group` and migrate it into collections.
- Return row-specific errors with real spreadsheet row numbers.

### Market Data

Files:

- `src/app/api/symbols/route.ts`
- `src/app/api/prices/route.ts`
- `src/lib/market-data/eodhd.ts`
- `src/lib/market-data/price-cache.ts`

Environment:

```bash
EODHD_API_KEY=your_eodhd_key_here
MARKET_DATA_PROVIDER=eodhd
```

Rules:

- Refresh is manual only.
- Do not add background/automatic refresh.
- Unsupported option prices return unsupported/manual workflow.
- Missing API key returns manual-required behavior, not a crash.

### Supabase

Files:

- `src/lib/storage/supabase-sync.ts`
- `supabase/schema.sql`

Current status:

- Not part of visible Phase 1 UX.
- Auth/account flow is deferred.
- Existing schema has RLS for `plan_documents` and readable `price_cache`.

Rules before reintroducing:

- Confirm current product decision with founder.
- Use publishable/anon key only on client.
- Keep service-role/secret keys server-only.
- Verify RLS policies before storing real user data.
- Decide whether cloud sync stores `Phase1Workbook` or older `PlanDocument`; do not mix silently.

## AI Reference Mechanism

There is no in-app AI feature in Phase 1.

For AI/code agents continuing the project, use this documentation priority:

1. `docs/AI_HANDOFF.md` - start here; explains what is current vs historical.
2. `PRD.md` - current product scope and acceptance criteria.
3. `DESIGN.md` - visual and interaction contract.
4. `ARCHITECTURE.md` - technical constraints and code map.
5. Current source code and tests.
6. `docs/product-strategy/founder-codex-interaction-log.md` - founder decisions and corrections.
7. `docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md` - customer reasoning.
8. `docs/product-strategy/product-design-flow.md` - founder's product design process.
9. Historical specs/plans in `docs/superpowers/` and `freedom_path_full_codex_handoff_prd_v1_7.md`.

If documents conflict:

- Current source and tests prove implemented behavior.
- Root canonical docs define intended current Phase 1 behavior.
- The founder interaction log explains why decisions changed.
- The original v1.7 PRD is future backlog, not current MVP scope.

Any AI agent must update `docs/product-strategy/founder-codex-interaction-log.md` when the founder challenges an assumption, reverses direction, or introduces a product decision that should survive the chat.

## Development Constraints

### Scope Constraints

- Keep Phase 1 local-first and account-free.
- Keep top navigation to two tabs.
- Keep Path to FIRE first and Understand Portfolio second.
- Keep account structure as a first-class product concept.
- Keep account owner, account type, and tax treatment as the account structure. Do not reintroduce account name as a visible field without founder approval.
- Keep portfolio-to-FIRE connection through `Use Portfolio FIRE Assets`.
- Keep calculations educational/planning-only.

### UX Constraints

- Do not add a sidebar.
- Do not add many tabs.
- Do not add public marketing page.
- Keep import/export low prominence.
- Keep manual refresh user-controlled.
- Keep optional detail sections collapsed by default.
- Keep buttons easy to click.
- Keep long tables scrollable.
- Numeric fields must allow clearing and re-entry.

### Code Constraints

- Prefer existing Phase 1 modules over older broad `PlanDocument` modules.
- Keep pure domain logic in `src/lib/phase1/*`.
- Keep UI orchestration in `src/components/planning/*`.
- Avoid adding global state libraries.
- Avoid large unrelated refactors.
- Do not edit generated folders: `node_modules/`, `.next/`, `.playwright-cli/`.
- Do not commit `.env.local`.
- Use `apply_patch` for manual edits.

### Financial-Language Constraints

- Use `planning estimate`, `assumption`, `projection`, `may`, `can`.
- Avoid `should buy`, `recommend allocation`, `guaranteed`, `safe`, `advice`.
- Keep disclaimers concise and visible where relevant.

## Logic That Must Not Be Broken

FIRE:

- Current age must be less than life expectancy.
- Current age and life expectancy must be whole years.
- Planned FIRE age must be a whole year.
- Planned FIRE age must be less than or equal to life expectancy for Income Stream mode. Principal-Preserving mode no longer validates `passiveIncomeFireAge` because it computes the earliest qualifying age itself.
- Expected annual portfolio return can be below 3, including small positive values and zero.
- Expense categories replace simple annual expenses only when enabled.
- Income sources replace simple passive income only when enabled.
- Portfolio Drawdown FIRE tests survival through life expectancy.
- Principal-Preserving FIRE searches candidate FIRE ages from the current age forward and returns the earliest age that protects the FIRE-age principal floor through life expectancy; if none qualify it returns `Not reached` and reports the retire-now scenario for diagnostics.
- Income Stream FIRE only tests income coverage and does not model portfolio depletion.

Portfolio:

- Include in FIRE defaults to yes.
- Home and liability are household shared.
- Account name is legacy-only and should not reappear in the Phase 1 UI.
- Liability balance is negative.
- Market-priced holdings need units unless plan-only/no-public-ticker.
- Collective investment trusts can be entered manually.
- Collections dedupe memberships.
- Collection percentages guard against divide-by-zero.

Market data:

- EODHD refresh is manual.
- Missing API key must not crash the app.
- Options automated pricing is unsupported/deferred.

Storage:

- Always normalize older workbooks.
- Do not break `phase1.6` migration defaults.
- Do not claim local IndexedDB data transfers between devices automatically.

## Verification Gates

Before claiming completion after code changes:

```bash
npm test -- --run
npm run lint
npm run build
```

Targeted tests to consider:

- FIRE logic: `src/tests/phase1/fire.test.ts`
- Portfolio import/export: `src/tests/phase1/portfolio-file.test.ts`
- Portfolio UI: `src/tests/components/portfolio-panel.test.tsx`
- Path/FIRE UI: `src/tests/components/path-to-fire-panel.test.tsx`
- Storage migration: `src/tests/storage/phase1-store.test.ts`
- Market data: `src/tests/market-data/*.test.ts`
- Social Security: `src/tests/calculations/social-security.test.ts`

Frontend smoke test checklist:

- `/app/fire-path` loads.
- FIRE cards open new tabs/windows.
- Portfolio Drawdown FIRE loads and has no required withdrawal-rate input.
- Expense Categories and Income Sources are collapsed by default.
- Expense Categories appears above Income Sources.
- When expanded, Expense Categories and Income Sources stack in a single column (no two-column inner grid) so they fit the narrow right-hand column without overflowing.
- Numeric fields can be cleared and re-entered.
- Principal-Preserving FIRE shows the appreciation return and the cash-generating return as two non-overlapping fields (appreciation + cash-generating = total).
- Income Stream FIRE hides asset-survival controls.
- Portfolio Lab add/edit/delete works.
- Portfolio table sort/select/filter works.
- Collections can be created, assigned, viewed, edited, and deleted.
- CSV/XLSX import/export works.
- Manual EOD refresh handles configured and unconfigured API states.

## Known Missing Work To Track

If another AI agent is asked to continue:

- Full Phase 1 workbook JSON export/import is still missing.
- Legacy compatibility fields `accountName` and `customGroup` remain in the model/import layer. They should only be removed after a migration/backward-compatibility decision.
- Documentation has been consolidated, but old planning docs remain for history.
- Supabase code exists but is not current Phase 1 UX.
- Original PRD contains many future ideas that are not current Phase 1.
- Browser smoke tests are manual; there is no committed Playwright E2E suite.
