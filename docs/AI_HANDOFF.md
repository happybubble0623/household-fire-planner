# Household FIRE Planner AI Handoff

Status: Living current-state handoff

Last updated: 2026-06-10

Purpose: Help another AI tool, device, or developer continue Household FIRE Planner without losing product context, setup details, current Phase 1 scope, or known constraints.

## Start Here

Read these files in this order when another AI agent or developer takes over:

1. `docs/AI_HANDOFF.md` - this onboarding guide and source-of-truth map.
2. `PRD.md` - canonical current Phase 1 product requirements.
3. `DESIGN.md` - canonical current visual system and UX interaction rules.
4. `ARCHITECTURE.md` - canonical current technical contract, data model, service boundaries, and development constraints.
5. Current source code and tests under `src/`.
6. `docs/product-strategy/founder-codex-interaction-log.md` - founder decisions, corrections, reversals, and product thinking.
7. `docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md` - customer and JTBD reasoning.
8. `docs/product-strategy/product-design-flow.md` - founder's product-design process.
9. `docs/superpowers/specs/2026-06-08-freedom-path-phase-1-design.md` - historical Phase 1 spec; useful context, but superseded by root docs when conflicts exist.
10. `docs/superpowers/specs/2026-06-08-portfolio-collections-design.md` - historical approved collection concept; current implementation is in source/root docs.
11. `freedom_path_full_codex_handoff_prd_v1_7.md` - original full PRD and future backlog only.

The original PRD is not the current Phase 1 scope by itself. Treat it as the broader product vision and backlog. The root `PRD.md`, `DESIGN.md`, `ARCHITECTURE.md`, current source code, tests, and interaction log supersede it for current development.

## Documentation Map

Use this table to avoid picking up stale instructions.

| File | Current role | Use for other AI handoff? | Notes |
| --- | --- | --- | --- |
| `docs/AI_HANDOFF.md` | Handoff index and current setup guide | Yes, read first | Explains which docs are canonical and which are historical. |
| `PRD.md` | Current product requirements | Yes | Product positioning, pain points, current MVP, blacklist, acceptance criteria. |
| `DESIGN.md` | Current design system | Yes | Colors, component rules, interactions, states, visual QA. |
| `ARCHITECTURE.md` | Current technical contract | Yes | Tech stack, data model, service layer, AI reference mechanism, development constraints. |
| `README.md` | Quick start | Yes | Short setup and verification commands. |
| `docs/product-strategy/founder-codex-interaction-log.md` | Founder decision record | Yes, for reasoning | Use to understand challenges, reversals, and why current scope changed. Keep updated. |
| `docs/product-strategy/product-design-flow.md` | Founder process documentation | Mostly for founder | Documents product-development workflow and frameworks. Not an implementation contract. |
| `docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md` | Customer-analysis documentation | Yes, for positioning | Useful for product decisions, not a code spec. |
| `docs/product-strategy/founder-provided-product-development-workflow.md` | Founder-provided workflow reference | Mostly for founder | Source note from screenshots/process guidance. |
| `docs/superpowers/specs/*.md` | Historical specs | Caution | Useful context, but root docs supersede stale details. |
| `docs/superpowers/plans/*.md` | Historical implementation plans | Caution | Do not execute old tasks blindly; many are already done or superseded. |
| `freedom_path_full_codex_handoff_prd_v1_7.md` | Original broad PRD/future backlog | Caution | Contains old MVP assumptions such as historical records and Monte Carlo that are not Phase 1 now. |

If documents conflict, use this precedence:

1. Current source code and passing tests for implemented behavior.
2. `PRD.md`, `DESIGN.md`, and `ARCHITECTURE.md` for intended current behavior.
3. This handoff file for setup and transfer context.
4. Founder interaction log for decision history.
5. Historical specs/plans/original PRD as background only.

## Handoff Package Versus Founder Documentation

For another AI agent or developer taking over implementation, the required handoff package is:

- `docs/AI_HANDOFF.md`
- `PRD.md`
- `DESIGN.md`
- `ARCHITECTURE.md`
- `README.md`
- current `src/` code and tests
- config files listed in `Setup On Another Device`

For the founder's own product-thinking record, use:

- `docs/product-strategy/founder-codex-interaction-log.md`
- `docs/product-strategy/product-design-flow.md`
- `docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md`
- `docs/product-strategy/founder-provided-product-development-workflow.md`

The founder documentation is important context, especially when the founder challenged an AI assumption or changed direction, but it is not a direct implementation contract when it conflicts with the root canonical docs.

## Product Direction

Current target audience:

```text
Motivated FIRE learners with multi-account household portfolios who need to understand household-level FIRE readiness across taxable, retirement, HSA, spouse, cash, home, and liability accounts without brokerage linking, who know the basics but need help turning scattered accounts, future income, inflation, taxes, and allocation drift into better planning decisions.
```

Current positioning:

```text
A guided FIRE planning workspace that starts simple, then gets more accurate as users add their real household accounts.
```

Phase 1 principles:

- Local-first and account-free.
- Simple top navigation only.
- Path to FIRE first.
- Understand Portfolio second.
- Account structure is a first-class concept.
- Portfolio clarity should connect to FIRE timing.
- No brokerage or bank linking.
- Manual EOD price refresh only, controlled by the user.
- Planning estimates only. Do not present financial, tax, legal, or investment advice.

## Current App Surface

Visible top navigation:

- `/app/fire-path` - Path to FIRE.
- `/app/portfolio-lab` - Understand Portfolio.

Path to FIRE pages:

- `/app/fire-path` - Home workspace with mode cards and tool links.
- `/app/fire-path/withdrawal-rate` - user-facing `Portfolio Drawdown FIRE`. The route name is old, but the product concept is drawdown/survival through life expectancy.
- `/app/fire-path/principal-preserving` - `Principal-Preserving FIRE`.
- `/app/fire-path/income-stream` - `Income Stream FIRE`.
- `/app/fire-path/passive-income` - legacy compatibility route that now opens `Income Stream FIRE`.
- `/app/fire-path/tools/social-security` - Social Security worker-benefit estimator.
- `/app/fire-path/tools/mortgage` - mortgage calculator.
- `/app/fire-path/tools/investment` - investment calculator.

Navigation behavior: FIRE mode cards and calculator/tool cards on `/app/fire-path` should open in a new browser tab/window so users can keep the main workspace available.

Legacy or future routes still exist in code but should not be treated as Phase 1 navigation:

- `/app/settings`
- `/app/freedom-map`
- `/app/family-plan`
- `/app/path-comparison`
- `/app/roadmap`
- `/app/saved-paths`
- `/app/social-security-guide`
- `/app/wealth-records`
- `/login`
- `/signup`

## Current Feature State

### Local Workbook

- Phase 1 data is stored in browser IndexedDB through Dexie.
- Database name: `freedom-path-phase1`.
- Workbook schema version: `phase1.7`.
- Autosave is per browser and per device.

Important transfer note:

Local IndexedDB user data is not part of the source code. Moving the project folder to another device transfers the app, not the browser's saved workbook. Today, users can export/import the portfolio table as CSV/XLSX, but there is not yet a full Phase 1 workbook export/import for all FIRE inputs and collections. Add full workbook JSON export/import before claiming user-data transfer is seamless.

### Path to FIRE

Current modes:

- `Portfolio Drawdown FIRE`: estimates the earliest age where FIRE assets can fund inflation-adjusted retirement spending through life expectancy.
- `Principal-Preserving FIRE`: finds the earliest age where income streams plus cash-generating investment return can cover expenses while keeping assets at or above the FIRE-age principal floor through life expectancy. The FIRE age is an output, not a user input.
- `Income Stream FIRE`: checks whether recurring income streams alone cover retirement expenses from a planned FIRE age.

Current calculation behavior:

- Annual expenses are the main spending input.
- Annual expenses grow with inflation only when `Retirement expenses are inflation adjusted` is enabled. The default is enabled.
- `Expense Categories (Optional)` is a collapsed progressive-accuracy section above `Income Sources (Optional)` in the right-side assumptions stack. When `Use expense categories instead of the simple annual expense amount` is off, saved expense rows are ignored and the simple annual expense amount is used. When it is on, expense rows replace the simple annual expense amount to avoid double counting.
- Expense category rows support category type, annual amount, start age, optional end age, and per-category inflation adjustment. Active category rows are summed by year and feed all FIRE modes through the normal annual-expense helper.
- Income Stream FIRE uses `passiveIncomeFireAge` as the planned FIRE age, labeled `Income Stream FIRE age` in the UI. Principal-Preserving FIRE no longer reads `passiveIncomeFireAge`; it computes the earliest qualifying age itself. The field still exists in the workbook for Income Stream FIRE and legacy compatibility.
- Return fields are mode-specific (labels chosen so each mode only shows what matters):
  - Portfolio Drawdown FIRE: one field, `expectedAnnualPortfolioReturnPercent`, UI label `Expected total return` (price gains + yield). You spend by selling, so the appreciation/yield split is not shown here. `expectedCashGeneratingReturnPercent` is unused in this mode.
  - Principal-Preserving FIRE: two non-overlapping fields. `expectedAnnualPortfolioReturnPercent` is appreciation only (UI label `Asset appreciation (not spent)`), and `expectedCashGeneratingReturnPercent` is the spendable cash yield (UI label `Spendable investment return`).
  - Income Stream FIRE: no return fields.
- Principal-Preserving after-FIRE behavior: appreciation now grows the unspent principal each year, while income + cash yield fund spending. The mode passes only while assets stay at or above the FIRE-age principal floor. Pre-FIRE accumulation grows at appreciation + yield (both reinvested).
- Principal-Preserving FIRE searches each candidate age from the current age forward (mirroring the Portfolio Drawdown earliest-age search). For each candidate age it projects assets to that age using expected annual portfolio return plus savings and timed income (that projected balance becomes the principal floor), then tests every year through life expectancy: spendable income equals income streams plus cash-generating return, and assets must never fall below the floor. The first age that survives is the result. If no age qualifies, the result is `Not reached` and the projection shows the retire-now scenario for diagnostics (first principal dip age, shortfall).
- Result fields added: `estimatedFireYear` and `estimatedYearsToFire` on `Phase1PrincipalPreservingResult`; `estimatedFireAge` is null when not reached.
- Income Stream FIRE is intentionally simpler: it ignores current assets, annual savings, expected portfolio return, and portfolio depletion. It compares income streams against annual retirement expenses each year from the planned FIRE age through life expectancy.
- Withdrawal rate is not a required input in the main drawdown mode. If it remains in stored data, treat it as legacy/future quick-tool state.
- Implied withdrawal rate is an output: first-year portfolio draw divided by assets at FIRE.
- `Annual passive/guaranteed income after FIRE` remains the default simple-mode income input.
- Passive/guaranteed income grows with inflation only when the user enables that toggle.
- `Income Sources (Optional)` is a collapsed progressive-accuracy section. When `Use income sources instead of the simple passive income amount` is off, saved source rows are ignored and the simple passive-income amount is used. When it is on, source rows replace the simple passive-income amount to avoid double counting.
- Income source rows support source type, owner, annual amount, start age, optional end age, and per-source inflation adjustment. Social Security rows use start age only; there is no separate claiming-age field in this section. Users should use the Social Security calculator link to estimate the amount before entering it.
- In Portfolio Drawdown FIRE, active detailed income sources are also added to pre-FIRE cash flow when their start age is before the estimated FIRE age. This lets income that starts before FIRE, such as Social Security at 62 when FIRE is projected later, increase assets before the FIRE year. The simple passive-income bucket is not added before FIRE because it has no start-age timing and could double count annual savings.
- In Income Stream FIRE, detailed income sources are only used at/after the planned Income Stream FIRE age. Pre-FIRE assets and savings are not shown because this mode is only about income-stream coverage.
- `Use Portfolio FIRE Assets` is available on Portfolio Drawdown FIRE and Principal-Preserving FIRE. It is intentionally hidden from Income Stream FIRE.
- Return fields should allow values below 3%, including small positive values. Current tests cover `1.5%`.
- Simple tax mode is available in all three modes (Option B): it grosses up the full spending need by `expenses / (1 - tax rate)`, so all sources (income, yield, withdrawals) are pre-tax. It is a blunt estimate that taxes all income equally.
- FIRE drawdown assets are liquid investments only. Home/real estate is excluded from the drawdown pool. An optional one-time home sale (`homeSaleAge`, `homeSaleProceeds`, default 0/0) adds proceeds to liquid assets at the sale age in Portfolio Drawdown and Principal-Preserving modes; Income Stream ignores it.
- Drawdown projection table columns: Starting assets, Investment return, Income / savings, Expenses, Assets withdrawn, Ending assets. Principal-Preserving shows the principal floor in the result card only and red-tints a dip row only in the not-reached scenario.
- New row fields on `Phase1ProjectionRow`: `investmentReturn`, `assetsWithdrawn`, `homeSaleInflow`.
- Projection rows use actual calendar years from the current year.

### Understand Portfolio

Current model:

- One current/latest portfolio only.
- Historical dated records and backtesting are out of Phase 1.
- Holdings support account owner, account type, tax treatment, Include in FIRE, unit price, units, balance, and collections.
- Account owner options are intended to stay simple: `User 1`, `User 2`, `Joint`, `Child`.
- Home and liabilities should be household shared rather than owner-specific.
- Account owner, account type, and tax treatment are the first-class account fields in Phase 1.
- Do not reintroduce a visible `Account name` input. The current data model and import/export layer still carry optional `accountName` / `account_name` only for legacy compatibility.
- Market holding types include stock, ETF, mutual fund/trust, crypto, and bond/fixed income.
- Options pricing is deferred.
- Collective investment trusts or no-public-ticker holdings can be entered manually as plan-only market holdings.
- Detailed holdings and focused allocation views use fixed-height scrollable areas to prevent long tables from overwhelming the page.

Portfolio workflow:

- Import/export supports CSV and XLSX.
- One import icon/menu and one export icon/menu are preferred.
- EODHD-backed symbol search and EOD price refresh are available when env vars are configured.
- Price refresh is manual by button. Do not add automatic refresh without a product decision.
- Successful market-data caveats should stay quiet and not repeat on every row.

Collections:

- Collections let users group selected holdings across accounts.
- Collections should support allocation views, not just tags or notes.
- Approved direction: a user can create a collection, select rows, add them to the collection, then analyze the collection's holdings/risk exposure.

### Planning Tools

Mortgage and investment calculators are simple helper tools.

Social Security calculator current scope:

- Unofficial worker-benefit estimate only.
- Compares age 62, full retirement age, and age 70.
- Uses SSA-style AIME/PIA formula behavior with 2026 bend points in current code.
- Applies historical taxable wage caps and historical Social Security credit thresholds for 1978-2026.
- Requires 40 credits for eligibility and caps credits at 4 per year.
- Shows `Not eligible` if the worker does not have enough credits.
- Does not yet model spouse, divorced-spouse, survivor, WEP/GPO, Medicare, taxes, or official SSA record import.

## Code Map

Core app shell and routes:

- `src/components/layout/app-shell.tsx`
- `src/components/planning/phase1-workspace.tsx`
- `src/app/app/fire-path/page.tsx`
- `src/app/app/portfolio-lab/page.tsx`
- `src/app/app/fire-path/withdrawal-rate/page.tsx`
- `src/app/app/fire-path/passive-income/page.tsx`
- `src/app/app/fire-path/tools/*/page.tsx`

Main UI components:

- `src/components/planning/path-to-fire-panel.tsx`
- `src/components/planning/fire-strategy-panel.tsx`
- `src/components/planning/portfolio-panel.tsx`
- `src/components/planning/portfolio-collections-panel.tsx`
- `src/components/planning/planning-tool-panel.tsx`
- `src/components/ui/info-popover.tsx`

Phase 1 domain logic:

- `src/types/phase1.ts`
- `src/lib/phase1/default-workbook.ts`
- `src/lib/phase1/workbook.ts`
- `src/lib/phase1/fire.ts`
- `src/lib/phase1/portfolio.ts`
- `src/lib/phase1/collections.ts`
- `src/lib/phase1/portfolio-file.ts`
- `src/lib/storage/phase1-store.ts`

Market data:

- `src/app/api/prices/route.ts`
- `src/app/api/symbols/route.ts`
- `src/lib/market-data/eodhd.ts`
- `src/lib/market-data/prices.ts`
- `src/lib/market-data/price-cache.ts`

Future/cloud code that is not Phase 1 UX:

- `src/lib/storage/supabase-sync.ts`
- `supabase/schema.sql`
- auth/settings routes and components.

## Environment Variables

Do not commit `.env.local`.

Required for EODHD price refresh and symbol search:

```bash
EODHD_API_KEY=your_eodhd_key_here
MARKET_DATA_PROVIDER=eodhd
```

Optional/future Supabase variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_publishable_or_anon_key_here
```

Supabase is not required for current Phase 1 local-first usage. If Supabase is reintroduced, confirm row-level security policies before real data is stored.

## Setup On Another Device

Preferred transfer method: use source control when available. This folder is currently treated as a local project folder, so a ZIP transfer is also acceptable.

Copy/include:

- `README.md`
- `PRD.md`
- `DESIGN.md`
- `ARCHITECTURE.md`
- `src/`
- `public/`
- `docs/`
- `supabase/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- `tsconfig.json`
- `eslint.config.mjs`
- `postcss.config.mjs`
- `vitest.config.ts`
- `vitest.setup.ts`
- `freedom_path_full_codex_handoff_prd_v1_7.md`
- `.gitignore`

Do not copy/include:

- `node_modules/`
- `.next/`
- `.env`
- `.env.local`
- `.env.*.local`
- `.DS_Store`
- `coverage/`
- `out/`
- `dist/`
- `tsconfig.tsbuildinfo`

New-device setup:

```bash
cd "/path/to/Household FIRE Planner"
npm install
cat > .env.local <<'EOF'
EODHD_API_KEY=your_eodhd_key_here
MARKET_DATA_PROVIDER=eodhd
EOF
npm run dev
```

Open the local URL printed by Next.js, usually:

```text
http://localhost:3000/app/fire-path
```

If port 3000 is busy, Next.js will print a different port such as 3001.

## Verification Commands

Run these before claiming the app is ready after code changes:

```bash
npm test -- --run
npm run lint
npm run build
```

For frontend behavior changes, also open the app in a browser and smoke-test:

- Path to FIRE home loads.
- Portfolio Drawdown FIRE page opens.
- Principal-Preserving FIRE page opens.
- Income Stream FIRE page opens.
- FIRE mode cards and tool links open in new windows/tabs.
- Social Security calculator shows eligible and ineligible cases correctly.
- Understand Portfolio allows add/edit/delete holdings.
- Import/export CSV and XLSX still work.
- Manual EOD refresh handles success and fallback.
- Portfolio filters, collections, and allocation views still respond.

## Known Gaps And Future Enhancements

Do not accidentally pull these into Phase 1 without founder approval:

- Brokerage/bank linking.
- Supabase account/cloud sync.
- Historical net-worth records.
- Backtesting.
- Monte Carlo.
- Advanced tax modeling.
- Full household income stream modeling beyond the current optional source rows.
- Full household Social Security spouse/survivor modeling.
- Options pricing.
- Public landing/marketing page.
- Paid subscriptions or launch GTM.

Current handoff-critical gap:

- Add full Phase 1 workbook export/import so users can move all local data between devices, not only portfolio rows.
- Decide later whether to remove legacy `accountName/account_name` and `customGroup/custom_group` from the model/file format, or keep them permanently for backwards compatibility.

## Maintenance Rule

Keep this file updated whenever any of these change:

- Product scope or target customer.
- Visible routes/navigation.
- Calculation methodology.
- Portfolio data model or import/export columns.
- Environment variables or external services.
- Setup or verification commands.
- Known gaps or deferred features.

Also update `docs/product-strategy/founder-codex-interaction-log.md` when the founder challenges an assumption, changes direction, or makes a decision that should survive beyond one chat thread.
