# Household FIRE Planner MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Household FIRE Planner MVP website from the PRD inside the `Household FIRE Planner` folder.

**Architecture:** Next.js App Router renders a public landing page and authenticated-optional app area. A versioned `PlanDocument` is the source of truth, with IndexedDB local persistence, JSON import/export, optional Supabase sync, calculation modules for net worth/FIRE/Social Security/Monte Carlo, and reusable page components for the MVP workflows.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Recharts, zod, react-hook-form, date-fns, Dexie, Supabase JS, Vitest.

---

### Task 1: Core Foundation

**Files:**
- Create: `src/types/plan.ts`
- Create: `src/types/calculations.ts`
- Create: `src/types/market-data.ts`
- Create: `src/lib/validation/plan-schema.ts`
- Create: `src/lib/data/sample-plan.ts`
- Create: `src/lib/storage/plan-io.ts`
- Create: `src/lib/storage/local-store.ts`
- Create: `supabase/schema.sql`
- Test: `src/tests/calculations/net-worth.test.ts`
- Test: `src/tests/storage/export-import.test.ts`

- [x] **Step 1: Write failing tests for effective-dated snapshots, net worth, and JSON round trip**

Run: `npm test`
Expected before implementation: FAIL with unresolved `@/lib/...` modules.

- [ ] **Step 2: Implement model, schema, sample plan, storage, and net worth calculation**

Run: `npm test`
Expected after implementation: tests for net worth and import/export pass.

### Task 2: Planning Engines

**Files:**
- Create: `src/lib/calculations/fire.ts`
- Create: `src/lib/calculations/social-security.ts`
- Create: `src/lib/calculations/monte-carlo.ts`
- Test: `src/tests/calculations/fire.test.ts`
- Test: `src/tests/calculations/social-security.test.ts`

- [x] **Step 1: Write failing tests for simple FIRE number, tax gross-up, FIRE mode branching, and Social Security math**

Run: `npm test`
Expected before implementation: FAIL with unresolved planning modules.

- [ ] **Step 2: Implement the calculation helpers and deterministic candidate evaluation**

Run: `npm test`
Expected after implementation: calculation tests pass.

### Task 3: Website Shell and MVP Pages

**Files:**
- Create: `src/app/page.tsx`
- Create: `src/app/app/layout.tsx`
- Create: `src/app/app/freedom-map/page.tsx`
- Create: `src/app/app/portfolio-lab/page.tsx`
- Create: `src/app/app/fire-path/page.tsx`
- Create: `src/app/app/saved-paths/page.tsx`
- Create: `src/app/app/path-comparison/page.tsx`
- Create: `src/app/app/family-plan/page.tsx`
- Create: `src/app/app/social-security-guide/page.tsx`
- Create: `src/app/app/wealth-records/page.tsx`
- Create: `src/app/app/settings/page.tsx`
- Create: `src/app/app/roadmap/page.tsx`
- Create: `src/components/layout/app-shell.tsx`
- Create: `src/components/planning/freedom-path-app.tsx`

- [ ] **Step 1: Build the public landing page with required product language**

Run: `npm run build`
Expected: public route builds and includes no advice language.

- [ ] **Step 2: Build the app shell and required app routes**

Run: `npm run build`
Expected: every route from the PRD builds.

### Task 4: Interactive MVP Workflows

**Files:**
- Create: `src/components/planning/plan-workspace.tsx`
- Create: `src/components/forms/plan-forms.tsx`
- Create: `src/components/charts/net-worth-chart.tsx`
- Create: `src/components/charts/portfolio-chart.tsx`
- Create: `src/app/api/prices/route.ts`

- [ ] **Step 1: Add local plan state, import/export, guest warning, and plan save/load**

Run: `npm test && npm run build`
Expected: tests pass and local-first app builds.

- [ ] **Step 2: Add forms for market positions, cash, manual assets, liabilities, expenses, income, Saved Paths, and Social Security**

Run: `npm test && npm run build`
Expected: forms build, preserve effective-dated records, and use only MVP FIRE modes.

- [ ] **Step 3: Add EOD price fallback API, manual override copy, FIRE projection outputs, Monte Carlo output, Path Comparison, and Roadmap content**

Run: `npm test && npm run build`
Expected: all required MVP pages are present and build.

### Task 5: Verification

**Files:**
- Modify: source files as needed after test/build/browser failures.

- [ ] **Step 1: Run automated checks**

Run: `npm test`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 2: Open the local site in a browser**

Run: `npm run dev`
Expected: local server starts.

Verify: landing page, app shell, Freedom Map, Portfolio Lab, FIRE Path, Social Security Guide, Path Comparison, Settings, and Roadmap render without overlap on desktop and mobile.
