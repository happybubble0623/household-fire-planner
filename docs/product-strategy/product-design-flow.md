# Household FIRE Planner Product Design Flow

Status: Draft framework for founder review

Last updated: 2026-06-08

This file explains the product-design process for Household FIRE Planner and where each framework belongs. The customer-group analysis lives separately in:

```text
docs/product-strategy/phase-1-customer-segmentation-stp-jtbd.md
```

This file now also incorporates the founder-provided product-development workflow screenshots, adapted to Household FIRE Planner.

## 1. Starting Problem Area

People want to know when they can reach FIRE, better understand and track their portfolio, and use that information to make wiser financial planning decisions.

The problem is especially painful when a person or household has many accounts:

- Personal taxable brokerage accounts
- Roth IRA accounts
- Traditional IRA accounts
- 401(k) accounts
- Brokerage-link 401(k) accounts
- HSA accounts
- Cash accounts
- Spouse or partner accounts
- Home, debt, and other non-market assets

When markets move, total net worth and asset allocation can change quickly. For a household, the user may not only ask "What is my net worth?" They may ask:

- What do we own across all accounts?
- Which assets count toward FIRE?
- What is taxable, tax-deferred, tax-free, or HSA?
- How much is in my accounts versus my spouse's accounts?
- How has market movement changed our FIRE position?
- Has our allocation drifted?
- What decisions should we revisit?

## 2. Recommended End-To-End Flow

Household FIRE Planner should use this sequence before major implementation decisions:

1. Define the problem area.
2. Brainstorm product positioning and PRD questions.
3. List possible customer groups.
4. Use STP to segment, evaluate, and describe possible targets.
5. Use JTBD to understand what each group is trying to accomplish.
6. Score customer groups against pain, Phase 1 fit, differentiation, and product opportunity.
7. Pause and choose one beachhead customer.
8. Define positioning for that beachhead.
9. Do competitor and workaround analysis.
10. Prioritize features using RICE, MoSCoW, or Kano.
11. Create or update the PRD draft.
12. Create visual design direction and UI prototype.
13. Use the UI prototype to revise the PRD where needed.
14. Create stable development docs: PRD, DESIGN, ARCHITECTURE.
15. Generate a TODO list from the docs.
16. Build one scoped task at a time.
17. Test each completed module before moving on.
18. Deploy only after the core workflow passes.
19. Update README and architecture docs based on the final code.
20. Revisit STP, JTBD, positioning, and feature priority based on real user evidence.

## 3. Stage 1: Product Positioning And PRD Draft

This stage applies strongly to Household FIRE Planner.

Before asking a coding agent to build, use AI as a brainstorming partner around these questions:

- What problem does Household FIRE Planner solve?
- Who is the target user?
- How does the user solve this problem today?
- What is insufficient about current workarounds?
- Who are the competitors?
- Where is Household FIRE Planner differentiated?
- What is the USP?
- What competitor or product examples should be benchmarked?
- What should the MVP include?
- What should the MVP explicitly not include?
- What release form makes sense: web app, browser extension, mobile app, internal tool, or another format?
- Are API cost, server cost, AI cost, and time cost controllable?
- Is the technical path feasible?

For Household FIRE Planner, the current answers should be treated as hypotheses:

- Problem: multi-account FIRE households struggle to connect portfolio clarity with FIRE timing.
- Primary user: individual investors or households with many investment accounts, including spouse accounts.
- Current workaround: spreadsheets, brokerage dashboards, retirement calculators, budgeting/net-worth tools, or manual summaries.
- Differentiation: FIRE-aware portfolio clarity without requiring brokerage linking.
- MVP release form: local-first web app.
- Cost control: manual EOD price refresh, no automatic refresh, no cloud sync in Phase 1.
- MVP not-doing list: brokerage connections, Supabase account sync, historical records, Monte Carlo, Social Security, advanced tax modeling, options pricing, and backtesting.

The PRD draft should include:

- Product positioning
- Target user
- User pain points
- MVP scope
- Page list
- Core user journey
- Technical approach
- Main risks
- Acceptance criteria

## 4. Stage 2: Visual Design And UI Prototype

This stage applies to Household FIRE Planner before the next large UI rebuild.

The goal is not decoration. The goal is to make the product easier to understand before code changes begin.

Recommended process:

1. Collect UI references from products with the right feel.
2. Identify design keywords from those references.
3. Create a lightweight UI prototype or mockup.
4. Use the prototype to test whether the workflow makes sense.
5. Revise the PRD if the visual flow reveals missing logic.

For Household FIRE Planner, visual references should be chosen carefully:

- Useful references: simple financial dashboards, clear planning tools, portfolio trackers, spreadsheet-like power tools, and calm SaaS utility products.
- Less useful references: marketing-heavy landing pages, decorative fintech hero pages, overly playful consumer apps, or dense broker trading terminals.

The design direction should emphasize:

- Simple top navigation
- Path to FIRE first
- Understand Portfolio second
- Account structure as a first-class concept
- Clear portfolio tables
- Transparent formulas
- Easy import/export
- Large, clear buttons for real actions
- Quiet, trustworthy visuals
- Strong empty/loading/error states

The visual prototype should help answer:

- Does the first screen motivate a new user?
- Does the user understand why portfolio entry matters?
- Can the user see the bridge between current portfolio clarity and FIRE timing?
- Is the portfolio table too complex?
- Are Account Owner, Account Type, Tax Treatment, Include in FIRE, and Collections visually distinct enough?

## 5. Stage 3: SDD Docs To Fix Development Boundaries

This stage applies strongly to Household FIRE Planner.

Before another implementation cycle, the project should maintain a small set of canonical docs. The exact file names can be adjusted to match the repo, but the content boundaries should stay clear.

### PRD.md

Purpose: product definition.

Should contain:

- Product positioning
- Target customer
- User pain points
- Core user journeys
- MVP feature list
- Explicit not-doing list
- Acceptance criteria

Household FIRE Planner example:

- Phase 1 should stay local-first.
- The beachhead is multi-account FIRE households.
- The core bridge is portfolio clarity plus FIRE timing.
- Supabase/cloud sync is future enhancement, not Phase 1.

### DESIGN.md

Purpose: visual and interaction rules.

Should contain:

- Visual tone
- Main color palette or Tailwind color guidance
- Typography and spacing guidance
- Component reuse rules
- Top navigation structure
- Form behavior
- Table behavior
- Button hierarchy
- Empty, loading, validation, and error states

Household FIRE Planner example:

- Keep UI simple.
- Avoid too many tabs.
- Put the two main sections in top navigation.
- Do not hide important actions in tiny controls.
- Import/export should be available but visually secondary.

### ARCHITECTURE.md

Purpose: development constraints.

Should contain:

- Tech stack
- Directory structure
- Data model
- Service-layer contracts
- Market-data provider assumptions
- Storage model
- Security/privacy assumptions
- Non-advice language constraints
- Logic that must not break
- Acceptance standards

Household FIRE Planner example:

- Next.js app.
- Local IndexedDB autosave for Phase 1.
- EODHD for manual EOD refresh.
- Supabase schema documented for future sync but not exposed in Phase 1 UI.
- Market data refresh must be user-triggered to control cost.
- Price source and price date should be tracked.
- FIRE calculation formulas should remain transparent.
- The app should not claim to provide personalized financial, tax, or investment advice.

### TODO.md

Purpose: execution order.

Should contain:

- One task per line or section.
- Clear dependency order.
- Acceptance check for each task.
- Testing needed for each task.
- Explicit "do not touch" areas if relevant.

The TODO should be generated only after PRD, DESIGN, and ARCHITECTURE are clear enough.

## 6. Stage 4: Formal Development And Testing

This stage applies to Household FIRE Planner, but with an important guardrail: do not use destructive git commands without explicit founder approval.

Recommended execution rules:

- The coding agent should read the docs first.
- Generate or update TODO.md before coding.
- Work on one scoped task at a time.
- Each task should have a clear goal, allowed edit scope, protected logic, and acceptance criteria.
- Do not silently expand MVP scope during implementation.
- If a small new requirement appears, handle it in the current task only if it does not change the product boundary.
- If a large requirement appears, update PRD.md and ARCHITECTURE.md first, then update TODO.md.
- After each completed module, test the main flow, loading state, empty state, and error state.
- Commit only after the module passes its acceptance check.

For Household FIRE Planner, module tests should cover:

- Path to FIRE calculation
- Manual input validation
- Portfolio add/edit/delete
- CSV/XLSX import/export
- Manual EOD refresh behavior
- Empty portfolio state
- Market-data failure state
- IndexedDB persistence
- Top-navigation flow

If code becomes badly broken:

- First diagnose the smallest failing area.
- Prefer a focused fix.
- If a revert is needed, ask the founder before using destructive commands.
- Do not use `git reset --hard` unless the founder clearly approves it.

## 7. Stage 5: Deployment And Closed-Loop Delivery

This stage applies later, after the Phase 1 workflow is stable.

Before deployment:

- Run tests.
- Run lint/build.
- Confirm the main workflow in the browser.
- Verify import/export with sample files.
- Verify market refresh behavior with the configured API key.
- Confirm that no secret API keys are exposed to the browser.

Deployment path:

- Push code to GitHub.
- Deploy through Vercel or a similar platform.
- Keep environment variables out of the repo.
- Document setup in README.md.
- Update ARCHITECTURE.md to match the final code structure.

README.md should include:

- What Household FIRE Planner is
- Current Phase 1 scope
- What is intentionally deferred
- Local setup
- Environment variables
- Data storage behavior
- Import/export format
- Market data provider setup
- Testing commands

## 8. Where STP Fits

STP is used after the broad problem is clear and before feature prioritization.

### Segmentation

Break the broad market into meaningful customer groups.

For Household FIRE Planner, segmentation should consider:

- FIRE maturity: beginner, accumulation-stage, near-FIRE, retired
- Portfolio complexity: simple accounts, many accounts, multi-asset household, real estate-heavy, crypto/options-heavy
- Household complexity: individual, couple, family planning
- Data preference: brokerage-linked, spreadsheet/manual, privacy-first/no-account
- Planning need: FIRE timing, portfolio allocation, net worth tracking, tax-bucket awareness, scenario planning

### Targeting

Choose which group is most attractive and realistic to serve first.

Good first targets usually have:

- strong pain
- an existing workaround
- reachable users
- similar needs across the group
- a problem Phase 1 can solve without becoming too broad
- potential to expand into later product depth

### Positioning

After choosing the target, define how Household FIRE Planner should be remembered by that group.

Positioning comes later because the right message depends on the chosen customer. For example:

- For spreadsheet FIRE users, the message may be about replacing manual maintenance.
- For privacy-first users, the message may be about no required account or brokerage linking.
- For multi-account households, the message may be about account-level clarity and FIRE-aware portfolio understanding.

## 9. Where JTBD Fits

JTBD is used inside each segment to understand the user's real job, not just their demographic profile.

Useful format:

```text
When [situation], I want to [action], so I can [desired outcome].
```

For Household FIRE Planner, JTBD should reveal whether the user is mainly trying to:

- calculate FIRE timing
- understand portfolio allocation
- consolidate account-level holdings
- distinguish taxable, tax-deferred, tax-free, and HSA assets
- make household-level planning decisions
- reduce spreadsheet maintenance
- avoid brokerage linking
- evaluate future tradeoffs

## 10. How To Use The Frameworks Together

Use the founder-provided workflow to control the overall process.

Use STP to decide **who** Household FIRE Planner is for first.

Use JTBD to decide **what job** that customer needs done.

Use competitor analysis to decide **where Household FIRE Planner should not fight** and where it can stand out.

Use positioning to decide **what the chosen customer should remember**.

Use RICE, MoSCoW, or Kano to decide **what to build first**.

Use PRD, DESIGN, ARCHITECTURE, and TODO docs to prevent implementation drift.

Use browser testing and real-user feedback to decide whether the MVP is working.

## 11. Current Household FIRE Planner Application

The founder has already made several important product decisions:

- Primary beachhead: multi-account FIRE households.
- Supporting segments: DIY FIRE spreadsheet power users, self-directed investors with tax-bucket complexity, privacy-first no-account portfolio consolidators, stock/ETF/mutual-fund-heavy investors, and high-income accumulation-stage FIRE aspirants.
- Product center: bridge current portfolio clarity with FIRE timing.
- Phase 1 release form: simple local-first web app.
- Phase 1 structure: Path to FIRE first, Understand Portfolio second.
- Account structure should be first-class.
- Portfolio is current/latest only in Phase 1.
- Historical performance, backtesting, cloud sync, brokerage sync, Social Security, Monte Carlo, and advanced tax modeling are future enhancements.

The next process improvement is to make the docs match this maturity:

1. Keep the customer analysis in `phase-1-customer-segmentation-stp-jtbd.md`.
2. Convert the current Phase 1 scope into a clean PRD-style source of truth.
3. Create a DESIGN.md-style source of truth before the next UI rebuild.
4. Create an ARCHITECTURE.md-style source of truth before the next development cycle.
5. Generate TODO.md only after the above docs are aligned.

## 12. Pause Point

The current pause point is no longer "which customer group should be first?"

The founder has chosen:

```text
Primary beachhead customer: Multi-account FIRE households
```

The next decisions are:

- What exact Phase 1 product promise should this beachhead remember?
- Which features prove that promise with the least complexity?
- What belongs in PRD.md, DESIGN.md, ARCHITECTURE.md, and TODO.md before implementation continues?
