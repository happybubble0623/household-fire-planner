# Household FIRE Planner Phase 1 Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Household FIRE Planner Phase 1 into a local-first two-tab tool with Path to FIRE first, Understand Portfolio second, EODHD button refresh, and CSV/XLSX portfolio import/export.

**Architecture:** Add a small Phase 1 domain model beside the broader PRD-era `PlanDocument` model. Keep calculations, portfolio parsing, storage, and EODHD fetching in focused library modules, then build a new Phase 1 workspace component that replaces the broad multi-route `PlanWorkspace` UI for Phase 1 routes. Keep Supabase and original PRD features in docs/future code, but remove them from Phase 1 navigation and UI.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Dexie/IndexedDB, Vitest, EODHD REST API, SheetJS `xlsx` for Excel import/export.

**Reference Spec:** `docs/superpowers/specs/2026-06-08-freedom-path-phase-1-design.md`

**External API Reference:** EODHD documents EOD requests as `https://eodhd.com/api/eod/AAPL.US?api_token=demo&fmt=json`, with `period=d`, `order=d`, `from`, and `to` parameters available.

**Repository Note:** This project folder is currently not inside a Git repository, so this plan omits commit steps. If the project is later moved into a Git repo, commit after each task.

---

## File Structure

- Create: `src/types/phase1.ts`
  - Owns Phase 1 workbook, portfolio item, FIRE input, FIRE output, and import/export types.
- Create: `src/lib/phase1/fire.ts`
  - Owns summary-level Simple FIRE, deterministic Withdrawal-Rate FIRE, and Income-Only FIRE calculations.
- Create: `src/lib/phase1/portfolio.ts`
  - Owns portfolio balance calculation, key stats, Include-in-FIRE totals, row defaults, and EOD price application.
- Create: `src/lib/phase1/default-workbook.ts`
  - Owns the empty/default Phase 1 workbook.
- Create: `src/lib/storage/phase1-store.ts`
  - Owns IndexedDB save/load for the Phase 1 workbook.
- Create: `src/lib/phase1/portfolio-file.ts`
  - Owns CSV/XLSX import/export parsing and serialization.
- Create: `src/lib/market-data/eodhd.ts`
  - Owns server-side EODHD fetch helpers.
- Modify: `src/types/market-data.ts`
  - Add EODHD source/status types.
- Modify: `src/app/api/prices/route.ts`
  - Switch from Alpha Vantage-first logic to provider-based EODHD logic.
- Create: `src/components/planning/phase1-workspace.tsx`
  - Owns the two-tab Phase 1 app UI and local autosave orchestration.
- Create: `src/components/planning/path-to-fire-panel.tsx`
  - Owns Path to FIRE form and outputs.
- Create: `src/components/planning/portfolio-panel.tsx`
  - Owns portfolio stats, table, import/export, EOD refresh, and add/edit section.
- Modify: `src/components/layout/app-shell.tsx`
  - Replace sidebar with top navigation containing only Path to FIRE and Understand Portfolio.
- Modify: `src/app/page.tsx`
  - Redirect/render Path to FIRE instead of a landing page.
- Modify: `src/app/app/page.tsx`
  - Redirect to `/app/fire-path`.
- Modify: `src/app/app/fire-path/page.tsx`
  - Render `Phase1Workspace` with the fire tab active.
- Modify: `src/app/app/portfolio-lab/page.tsx`
  - Render `Phase1Workspace` with the portfolio tab active and visible label Understand Portfolio.
- Test: `src/tests/phase1/fire.test.ts`
- Test: `src/tests/phase1/portfolio.test.ts`
- Test: `src/tests/phase1/portfolio-file.test.ts`
- Test: `src/tests/market-data/eodhd.test.ts`
- Test: `src/tests/storage/phase1-store.test.ts`

---

### Task 1: Add Phase 1 FIRE Model and Calculation Engine

**Files:**
- Create: `src/types/phase1.ts`
- Create: `src/lib/phase1/fire.ts`
- Test: `src/tests/phase1/fire.test.ts`

- [ ] **Step 1: Write failing FIRE calculation tests**

Create `src/tests/phase1/fire.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import type { Phase1FireInputs } from "@/types/phase1";

const baseInputs: Phase1FireInputs = {
  currentAge: 40,
  lifeExpectancy: 90,
  fireRuleMode: "withdrawal_rate",
  currentFireAssets: 500_000,
  annualExpenses: 120_000,
  annualPassiveGuaranteedIncome: 20_000,
  passiveGuaranteedIncomeInflationAdjusted: true,
  annualSavingsBeforeFire: 50_000,
  expectedAnnualPortfolioReturnPercent: 6,
  inflationRatePercent: 3,
  withdrawalRatePercent: 4,
  taxMode: "simple",
  simpleEffectiveTaxRatePercent: 10
};

describe("calculatePhase1Fire", () => {
  it("calculates a tax-adjusted withdrawal-rate FIRE number from spending gap", () => {
    const result = calculatePhase1Fire(baseInputs);

    expect(result.withdrawalRate.annualPortfolioFundedSpendingGap).toBe(100_000);
    expect(result.withdrawalRate.taxAdjustedAnnualSpendingGap).toBeCloseTo(111_111.11, 2);
    expect(result.withdrawalRate.simpleFireNumber).toBeCloseTo(2_777_777.78, 2);
    expect(result.withdrawalRate.fireGap).toBeCloseTo(2_277_777.78, 2);
    expect(result.withdrawalRate.estimatedYearsToFire).toBeGreaterThan(0);
    expect(result.withdrawalRate.estimatedFireAge).toBeGreaterThan(40);
  });

  it("returns zero years to FIRE when current assets already meet the FIRE number", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      currentFireAssets: 3_000_000
    });

    expect(result.withdrawalRate.estimatedYearsToFire).toBe(0);
    expect(result.withdrawalRate.estimatedFireAge).toBe(40);
    expect(result.withdrawalRate.fireGap).toBe(0);
  });

  it("checks income-only coverage through life expectancy", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_only",
      annualExpenses: 80_000,
      annualPassiveGuaranteedIncome: 90_000,
      passiveGuaranteedIncomeInflationAdjusted: true
    });

    expect(result.incomeOnly.incomeCoverageRatio).toBeCloseTo(1.125, 3);
    expect(result.incomeOnly.passes).toBe(true);
    expect(result.incomeOnly.estimatedFireAge).toBe(40);
  });

  it("reports income-only failure when expenses outgrow non-inflating income", () => {
    const result = calculatePhase1Fire({
      ...baseInputs,
      fireRuleMode: "income_only",
      annualExpenses: 80_000,
      annualPassiveGuaranteedIncome: 85_000,
      passiveGuaranteedIncomeInflationAdjusted: false,
      inflationRatePercent: 4
    });

    expect(result.incomeOnly.passes).toBe(false);
    expect(result.incomeOnly.firstFailureAge).toBeGreaterThan(40);
  });

  it("validates age, withdrawal rate, and tax rate", () => {
    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        lifeExpectancy: 40
      })
    ).toThrow("Current age must be less than life expectancy.");

    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        withdrawalRatePercent: 0
      })
    ).toThrow("Withdrawal rate must be greater than 0.");

    expect(() =>
      calculatePhase1Fire({
        ...baseInputs,
        simpleEffectiveTaxRatePercent: 100
      })
    ).toThrow("Simple effective tax rate must be less than 100%.");
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/tests/phase1/fire.test.ts
```

Expected: FAIL because `@/lib/phase1/fire` and `@/types/phase1` do not exist.

- [ ] **Step 3: Add Phase 1 types**

Create `src/types/phase1.ts` with:

```ts
export type Phase1AssetType =
  | "stock"
  | "etf"
  | "mutual_fund"
  | "crypto"
  | "option"
  | "cash"
  | "home"
  | "liability"
  | "other_asset";

export type Phase1FireRuleMode = "withdrawal_rate" | "income_only";
export type Phase1TaxMode = "none" | "simple";
export type Phase1PriceStatus = "manual" | "refreshed" | "unsupported" | "failed";

export type Phase1PortfolioItem = {
  id: string;
  type: Phase1AssetType;
  name: string;
  symbol?: string;
  taxBucket: string;
  includedInFire: boolean;
  unitPrice?: number;
  units?: number;
  balance: number;
  customGroup?: string;
  priceStatus?: Phase1PriceStatus;
  priceDate?: string;
  priceWarning?: string;
};

export type Phase1FireInputs = {
  currentAge: number;
  lifeExpectancy: number;
  fireRuleMode: Phase1FireRuleMode;
  currentFireAssets: number;
  annualExpenses: number;
  annualPassiveGuaranteedIncome: number;
  passiveGuaranteedIncomeInflationAdjusted: boolean;
  annualSavingsBeforeFire: number;
  expectedAnnualPortfolioReturnPercent: number;
  inflationRatePercent: number;
  withdrawalRatePercent: number;
  taxMode: Phase1TaxMode;
  simpleEffectiveTaxRatePercent: number;
};

export type Phase1WithdrawalRateResult = {
  annualPortfolioFundedSpendingGap: number;
  taxAdjustedAnnualSpendingGap: number;
  simpleFireNumber: number;
  fireGap: number;
  estimatedYearsToFire: number;
  estimatedFireAge: number;
  deterministicPasses: boolean;
  endingBalanceAtLifeExpectancy: number;
  firstFailureAge?: number;
};

export type Phase1IncomeOnlyResult = {
  incomeCoverageRatio: number;
  annualPassiveGuaranteedIncome: number;
  annualExpenses: number;
  passes: boolean;
  estimatedFireAge: number | null;
  shortfallOrSurplus: number;
  firstFailureAge?: number;
};

export type Phase1FireResult = {
  mode: Phase1FireRuleMode;
  withdrawalRate: Phase1WithdrawalRateResult;
  incomeOnly: Phase1IncomeOnlyResult;
};

export type Phase1Workbook = {
  id: "phase1-default";
  schemaVersion: "phase1.1";
  updatedAt: string;
  fireInputs: Phase1FireInputs;
  portfolioItems: Phase1PortfolioItem[];
  lastEodRefreshAt?: string;
  lastImportExportStatus?: string;
};

export type PortfolioImportRowError = {
  rowNumber: number;
  message: string;
};

export type PortfolioImportResult = {
  items: Phase1PortfolioItem[];
  errors: PortfolioImportRowError[];
};
```

- [ ] **Step 4: Implement FIRE calculations**

Create `src/lib/phase1/fire.ts` with:

```ts
import type {
  Phase1FireInputs,
  Phase1FireResult,
  Phase1IncomeOnlyResult,
  Phase1WithdrawalRateResult
} from "@/types/phase1";

function percent(value: number) {
  return value / 100;
}

function assertFiniteNonNegative(label: string, value: number) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative number.`);
  }
}

export function validatePhase1FireInputs(inputs: Phase1FireInputs) {
  if (inputs.currentAge >= inputs.lifeExpectancy) {
    throw new Error("Current age must be less than life expectancy.");
  }

  if (inputs.withdrawalRatePercent <= 0) {
    throw new Error("Withdrawal rate must be greater than 0.");
  }

  if (inputs.taxMode === "simple" && inputs.simpleEffectiveTaxRatePercent >= 100) {
    throw new Error("Simple effective tax rate must be less than 100%.");
  }

  assertFiniteNonNegative("Current age", inputs.currentAge);
  assertFiniteNonNegative("Life expectancy", inputs.lifeExpectancy);
  assertFiniteNonNegative("Current FIRE assets", inputs.currentFireAssets);
  assertFiniteNonNegative("Annual expenses", inputs.annualExpenses);
  assertFiniteNonNegative("Annual passive or guaranteed income", inputs.annualPassiveGuaranteedIncome);
  assertFiniteNonNegative("Annual savings before FIRE", inputs.annualSavingsBeforeFire);
}

export function calculatePhase1Fire(inputs: Phase1FireInputs): Phase1FireResult {
  validatePhase1FireInputs(inputs);

  return {
    mode: inputs.fireRuleMode,
    withdrawalRate: calculateWithdrawalRateFire(inputs),
    incomeOnly: calculateIncomeOnlyFire(inputs)
  };
}

export function calculateTaxAdjustedGap(inputs: Phase1FireInputs) {
  const gap = Math.max(0, inputs.annualExpenses - inputs.annualPassiveGuaranteedIncome);

  if (inputs.taxMode === "none") {
    return {
      annualPortfolioFundedSpendingGap: gap,
      taxAdjustedAnnualSpendingGap: gap
    };
  }

  const taxRate = percent(inputs.simpleEffectiveTaxRatePercent);
  return {
    annualPortfolioFundedSpendingGap: gap,
    taxAdjustedAnnualSpendingGap: taxRate <= 0 ? gap : gap / (1 - taxRate)
  };
}

function calculateWithdrawalRateFire(inputs: Phase1FireInputs): Phase1WithdrawalRateResult {
  const { annualPortfolioFundedSpendingGap, taxAdjustedAnnualSpendingGap } =
    calculateTaxAdjustedGap(inputs);
  const simpleFireNumber = taxAdjustedAnnualSpendingGap / percent(inputs.withdrawalRatePercent);
  const fireGap = Math.max(0, simpleFireNumber - inputs.currentFireAssets);
  const estimatedYearsToFire = estimateYearsToTarget({
    currentAssets: inputs.currentFireAssets,
    targetAssets: simpleFireNumber,
    annualSavings: inputs.annualSavingsBeforeFire,
    annualReturn: percent(inputs.expectedAnnualPortfolioReturnPercent),
    maxYears: Math.ceil(inputs.lifeExpectancy - inputs.currentAge)
  });
  const estimatedFireAge = inputs.currentAge + estimatedYearsToFire;
  const survival = projectWithdrawalSurvival(inputs, estimatedYearsToFire);

  return {
    annualPortfolioFundedSpendingGap,
    taxAdjustedAnnualSpendingGap,
    simpleFireNumber,
    fireGap,
    estimatedYearsToFire,
    estimatedFireAge,
    deterministicPasses: survival.passes,
    endingBalanceAtLifeExpectancy: survival.endingBalance,
    firstFailureAge: survival.firstFailureAge
  };
}

function estimateYearsToTarget(options: {
  currentAssets: number;
  targetAssets: number;
  annualSavings: number;
  annualReturn: number;
  maxYears: number;
}) {
  if (options.currentAssets >= options.targetAssets) return 0;

  let assets = options.currentAssets;
  for (let year = 1; year <= options.maxYears; year += 1) {
    assets = assets * (1 + options.annualReturn) + options.annualSavings;
    if (assets >= options.targetAssets) return year;
  }

  return options.maxYears;
}

function projectWithdrawalSurvival(inputs: Phase1FireInputs, yearsToFire: number) {
  const annualReturn = percent(inputs.expectedAnnualPortfolioReturnPercent);
  const inflation = percent(inputs.inflationRatePercent);
  const taxRate = inputs.taxMode === "simple" ? percent(inputs.simpleEffectiveTaxRatePercent) : 0;
  let assets = inputs.currentFireAssets;

  for (let year = 1; year <= yearsToFire; year += 1) {
    assets = assets * (1 + annualReturn) + inputs.annualSavingsBeforeFire;
  }

  let annualExpenses = inputs.annualExpenses;
  let annualIncome = inputs.annualPassiveGuaranteedIncome;
  const yearsInRetirement = Math.ceil(inputs.lifeExpectancy - (inputs.currentAge + yearsToFire));

  for (let retirementYear = 0; retirementYear <= yearsInRetirement; retirementYear += 1) {
    const afterTaxGap = Math.max(0, annualExpenses - annualIncome);
    const withdrawal = taxRate > 0 ? afterTaxGap / (1 - taxRate) : afterTaxGap;
    assets -= withdrawal;

    if (assets < 0) {
      return {
        passes: false,
        endingBalance: assets,
        firstFailureAge: inputs.currentAge + yearsToFire + retirementYear
      };
    }

    assets *= 1 + annualReturn;
    annualExpenses *= 1 + inflation;
    if (inputs.passiveGuaranteedIncomeInflationAdjusted) {
      annualIncome *= 1 + inflation;
    }
  }

  return {
    passes: true,
    endingBalance: assets
  };
}

function calculateIncomeOnlyFire(inputs: Phase1FireInputs): Phase1IncomeOnlyResult {
  const ratio =
    inputs.annualExpenses === 0
      ? 1
      : inputs.annualPassiveGuaranteedIncome / inputs.annualExpenses;
  let annualExpenses = inputs.annualExpenses;
  let annualIncome = inputs.annualPassiveGuaranteedIncome;
  const inflation = percent(inputs.inflationRatePercent);
  const yearsToCheck = Math.ceil(inputs.lifeExpectancy - inputs.currentAge);

  for (let year = 0; year <= yearsToCheck; year += 1) {
    if (annualIncome < annualExpenses) {
      return {
        incomeCoverageRatio: ratio,
        annualPassiveGuaranteedIncome: inputs.annualPassiveGuaranteedIncome,
        annualExpenses: inputs.annualExpenses,
        passes: false,
        estimatedFireAge: null,
        shortfallOrSurplus: inputs.annualPassiveGuaranteedIncome - inputs.annualExpenses,
        firstFailureAge: inputs.currentAge + year
      };
    }

    annualExpenses *= 1 + inflation;
    if (inputs.passiveGuaranteedIncomeInflationAdjusted) {
      annualIncome *= 1 + inflation;
    }
  }

  return {
    incomeCoverageRatio: ratio,
    annualPassiveGuaranteedIncome: inputs.annualPassiveGuaranteedIncome,
    annualExpenses: inputs.annualExpenses,
    passes: true,
    estimatedFireAge: inputs.currentAge,
    shortfallOrSurplus: inputs.annualPassiveGuaranteedIncome - inputs.annualExpenses
  };
}
```

- [ ] **Step 5: Run FIRE tests**

Run:

```bash
npm test -- src/tests/phase1/fire.test.ts
```

Expected: PASS.

---

### Task 2: Add Phase 1 Portfolio Domain Logic

**Files:**
- Create: `src/lib/phase1/portfolio.ts`
- Test: `src/tests/phase1/portfolio.test.ts`

- [ ] **Step 1: Write failing portfolio tests**

Create `src/tests/phase1/portfolio.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  calculatePortfolioItemBalance,
  getDefaultIncludedInFire,
  summarizePhase1Portfolio
} from "@/lib/phase1/portfolio";
import type { Phase1PortfolioItem } from "@/types/phase1";

describe("Phase 1 portfolio helpers", () => {
  it("calculates market balance from unit price and units", () => {
    expect(
      calculatePortfolioItemBalance({
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 300,
        units: 10,
        balance: 0
      })
    ).toBe(3000);
  });

  it("keeps direct balance assets simple and liabilities negative", () => {
    const home: Phase1PortfolioItem = {
      id: "home",
      type: "home",
      name: "Home",
      taxBucket: "Real Estate",
      includedInFire: false,
      balance: 600_000
    };
    const mortgage: Phase1PortfolioItem = {
      id: "mortgage",
      type: "liability",
      name: "Mortgage",
      taxBucket: "Other",
      includedInFire: false,
      balance: 300_000
    };

    expect(calculatePortfolioItemBalance(home)).toBe(600_000);
    expect(calculatePortfolioItemBalance(mortgage)).toBe(-300_000);
  });

  it("summarizes assets, liabilities, net balance, and FIRE included balance", () => {
    const summary = summarizePhase1Portfolio([
      {
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        taxBucket: "Taxable",
        includedInFire: true,
        unitPrice: 300,
        units: 10,
        balance: 0
      },
      {
        id: "cash",
        type: "cash",
        name: "Emergency Fund",
        taxBucket: "Cash",
        includedInFire: true,
        balance: 20_000
      },
      {
        id: "mortgage",
        type: "liability",
        name: "Mortgage",
        taxBucket: "Other",
        includedInFire: false,
        balance: -100_000
      }
    ]);

    expect(summary.totalAssets).toBe(23_000);
    expect(summary.totalLiabilities).toBe(-100_000);
    expect(summary.totalNetBalance).toBe(-77_000);
    expect(summary.includedInFire).toBe(23_000);
  });

  it("sets Phase 1 Include in FIRE defaults by asset type", () => {
    expect(getDefaultIncludedInFire("stock")).toBe(true);
    expect(getDefaultIncludedInFire("cash")).toBe(true);
    expect(getDefaultIncludedInFire("home")).toBe(false);
    expect(getDefaultIncludedInFire("liability")).toBe(false);
    expect(getDefaultIncludedInFire("other_asset")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run:

```bash
npm test -- src/tests/phase1/portfolio.test.ts
```

Expected: FAIL because `@/lib/phase1/portfolio` does not exist.

- [ ] **Step 3: Implement portfolio helpers**

Create `src/lib/phase1/portfolio.ts`:

```ts
import type { FetchedMarketPrice } from "@/types/market-data";
import type { Phase1AssetType, Phase1PortfolioItem } from "@/types/phase1";

export const marketPricedTypes = new Set<Phase1AssetType>([
  "stock",
  "etf",
  "mutual_fund",
  "crypto",
  "option"
]);

export function isMarketPricedType(type: Phase1AssetType) {
  return marketPricedTypes.has(type);
}

export function getDefaultIncludedInFire(type: Phase1AssetType) {
  return type === "stock" || type === "etf" || type === "mutual_fund" || type === "crypto" || type === "option" || type === "cash";
}

export function calculatePortfolioItemBalance(item: Phase1PortfolioItem) {
  if (isMarketPricedType(item.type)) {
    return (item.unitPrice ?? 0) * (item.units ?? 0);
  }

  if (item.type === "liability") {
    return -Math.abs(item.balance);
  }

  return item.balance;
}

export function normalizePortfolioItemBalance(item: Phase1PortfolioItem): Phase1PortfolioItem {
  return {
    ...item,
    balance: calculatePortfolioItemBalance(item)
  };
}

export function summarizePhase1Portfolio(items: Phase1PortfolioItem[]) {
  const normalized = items.map(normalizePortfolioItemBalance);
  const totalAssets = normalized
    .filter((item) => item.type !== "liability")
    .reduce((sum, item) => sum + item.balance, 0);
  const totalLiabilities = normalized
    .filter((item) => item.type === "liability")
    .reduce((sum, item) => sum + item.balance, 0);
  const includedInFire = normalized
    .filter((item) => item.includedInFire)
    .reduce((sum, item) => sum + item.balance, 0);

  return {
    totalAssets,
    totalLiabilities,
    totalNetBalance: totalAssets + totalLiabilities,
    includedInFire,
    itemCount: normalized.length
  };
}

export function applyFetchedPricesToPhase1Portfolio(
  items: Phase1PortfolioItem[],
  prices: FetchedMarketPrice[]
) {
  const bySymbol = new Map(prices.map((price) => [price.symbol.toUpperCase(), price]));

  return items.map((item) => {
    if (!item.symbol || !isMarketPricedType(item.type)) return item;

    const fetched = bySymbol.get(item.symbol.toUpperCase()) ?? bySymbol.get(`${item.symbol.toUpperCase()}.US`);

    if (!fetched || fetched.closePrice === null || fetched.closePrice <= 0) {
      return {
        ...item,
        priceStatus: "failed" as const,
        priceWarning: fetched?.warning ?? "No refreshed price was returned."
      };
    }

    return normalizePortfolioItemBalance({
      ...item,
      unitPrice: fetched.closePrice,
      priceStatus: "refreshed",
      priceDate: fetched.priceDate,
      priceWarning: fetched.warning
    });
  });
}
```

- [ ] **Step 4: Run portfolio tests**

Run:

```bash
npm test -- src/tests/phase1/portfolio.test.ts
```

Expected: PASS.

---

### Task 3: Add CSV/XLSX Portfolio Import and Export

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/phase1/portfolio-file.ts`
- Test: `src/tests/phase1/portfolio-file.test.ts`

- [ ] **Step 1: Install XLSX support**

Run:

```bash
npm install xlsx
```

Expected: `package.json` and `package-lock.json` update with `xlsx`.

- [ ] **Step 2: Write failing import/export tests**

Create `src/tests/phase1/portfolio-file.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  exportPortfolioCsv,
  parsePortfolioCsv,
  portfolioItemsToRows
} from "@/lib/phase1/portfolio-file";

describe("portfolio file import/export", () => {
  it("parses CSV rows with tolerant headers and liability normalization", () => {
    const csv = [
      "Type,Name,Symbol,Tax Bucket,Include In FIRE,Unit Price,Units,Balance,Custom Group",
      "ETF,Vanguard Total Stock,VTI,Taxable,yes,300,10,,Core",
      "Liability,Mortgage,,Other,no,,,250000,Home"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      type: "etf",
      name: "Vanguard Total Stock",
      symbol: "VTI",
      includedInFire: true,
      balance: 3000,
      customGroup: "Core"
    });
    expect(result.items[1]).toMatchObject({
      type: "liability",
      balance: -250000,
      includedInFire: false
    });
  });

  it("reports invalid rows while preserving valid rows", () => {
    const csv = [
      "type,name,include_in_fire,balance",
      "cash,Emergency Fund,yes,10000",
      "home,,no,600000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.items).toHaveLength(1);
    expect(result.errors).toEqual([{ rowNumber: 3, message: "Name is required." }]);
  });

  it("exports stable CSV columns that can be reimported", () => {
    const csv = exportPortfolioCsv([
      {
        id: "cash",
        type: "cash",
        name: "Emergency Fund",
        taxBucket: "Cash",
        includedInFire: true,
        balance: 10000,
        customGroup: "Cash"
      }
    ]);

    expect(csv.split("\n")[0]).toBe(
      "type,name,symbol,tax_bucket,include_in_fire,unit_price,units,balance,custom_group"
    );
    expect(parsePortfolioCsv(csv).items[0].balance).toBe(10000);
  });

  it("maps portfolio items to export rows", () => {
    expect(
      portfolioItemsToRows([
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "VTI",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 300,
          units: 10,
          balance: 3000,
          customGroup: "Core"
        }
      ])
    ).toEqual([
      {
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        tax_bucket: "Taxable",
        include_in_fire: "yes",
        unit_price: 300,
        units: 10,
        balance: 3000,
        custom_group: "Core"
      }
    ]);
  });
});
```

- [ ] **Step 3: Run the failing test**

Run:

```bash
npm test -- src/tests/phase1/portfolio-file.test.ts
```

Expected: FAIL because `@/lib/phase1/portfolio-file` does not exist.

- [ ] **Step 4: Implement CSV/XLSX helpers**

Create `src/lib/phase1/portfolio-file.ts`:

```ts
import * as XLSX from "xlsx";
import { calculatePortfolioItemBalance, getDefaultIncludedInFire, isMarketPricedType } from "@/lib/phase1/portfolio";
import type { Phase1AssetType, Phase1PortfolioItem, PortfolioImportResult } from "@/types/phase1";

const headers = [
  "type",
  "name",
  "symbol",
  "tax_bucket",
  "include_in_fire",
  "unit_price",
  "units",
  "balance",
  "custom_group"
] as const;

type PortfolioExportRow = Record<(typeof headers)[number], string | number>;
type ImportRecord = Record<string, string>;

const typeAliases: Record<string, Phase1AssetType> = {
  stock: "stock",
  stocks: "stock",
  etf: "etf",
  "mutual fund": "mutual_fund",
  mutual_fund: "mutual_fund",
  mutualfund: "mutual_fund",
  crypto: "crypto",
  cryptocurrency: "crypto",
  option: "option",
  options: "option",
  cash: "cash",
  home: "home",
  house: "home",
  liability: "liability",
  debt: "liability",
  other: "other_asset",
  "other asset": "other_asset",
  other_asset: "other_asset"
};

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function parseBoolean(value: string | undefined, fallback: boolean) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (["yes", "true", "1", "y"].includes(normalized)) return true;
  if (["no", "false", "0", "n"].includes(normalized)) return false;
  return fallback;
}

function parseNumber(value: string | undefined) {
  if (!value) return undefined;
  const cleaned = value.replace(/[$,]/g, "").trim();
  if (!cleaned) return undefined;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function recordsFromWorksheet(worksheet: XLSX.WorkSheet): ImportRecord[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
    raw: false
  });

  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [normalizeHeader(key), String(value ?? "").trim()])
    )
  );
}

function itemFromRecord(record: ImportRecord, rowNumber: number) {
  const rawType = (record.type ?? "").trim().toLowerCase();
  const type = typeAliases[rawType];
  const name = (record.name ?? "").trim();
  const errors: string[] = [];

  if (!type) errors.push("Type is required and must be supported.");
  if (!name) errors.push("Name is required.");

  if (errors.length > 0 || !type) {
    return { item: null, error: { rowNumber, message: errors[0] } };
  }

  const unitPrice = parseNumber(record.unit_price);
  const units = parseNumber(record.units);
  const importedBalance = parseNumber(record.balance);
  const includedInFire = parseBoolean(record.include_in_fire, getDefaultIncludedInFire(type));

  if (isMarketPricedType(type) && (unitPrice === undefined || units === undefined) && importedBalance === undefined) {
    return {
      item: null,
      error: {
        rowNumber,
        message: "Market-priced rows require unit_price and units, or balance."
      }
    };
  }

  if (!isMarketPricedType(type) && importedBalance === undefined) {
    return {
      item: null,
      error: {
        rowNumber,
        message: "Direct-balance rows require balance."
      }
    };
  }

  const item: Phase1PortfolioItem = {
    id: `item-${Date.now()}-${rowNumber}`,
    type,
    name,
    symbol: record.symbol?.trim() || undefined,
    taxBucket: record.tax_bucket?.trim() || "Other",
    includedInFire,
    unitPrice,
    units,
    balance: importedBalance ?? 0,
    customGroup: record.custom_group?.trim() || undefined,
    priceStatus: unitPrice !== undefined ? "manual" : undefined
  };

  return {
    item: {
      ...item,
      balance: calculatePortfolioItemBalance(item)
    },
    error: null
  };
}

export function parsePortfolioCsv(csv: string): PortfolioImportResult {
  const workbook = XLSX.read(csv, { type: "string" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return parsePortfolioWorksheet(firstSheet);
}

function parsePortfolioWorksheet(worksheet: XLSX.WorkSheet): PortfolioImportResult {
  const items: Phase1PortfolioItem[] = [];
  const errors: PortfolioImportResult["errors"] = [];

  recordsFromWorksheet(worksheet).forEach((record, index) => {
    const parsed = itemFromRecord(record, index + 2);
    if (parsed.item) items.push(parsed.item);
    if (parsed.error) errors.push(parsed.error);
  });

  return { items, errors };
}

export function parsePortfolioXlsx(buffer: ArrayBuffer): PortfolioImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  return parsePortfolioWorksheet(firstSheet);
}

export function portfolioItemsToRows(items: Phase1PortfolioItem[]): PortfolioExportRow[] {
  return items.map((item) => ({
    type: item.type,
    name: item.name,
    symbol: item.symbol ?? "",
    tax_bucket: item.taxBucket,
    include_in_fire: item.includedInFire ? "yes" : "no",
    unit_price: item.unitPrice ?? "",
    units: item.units ?? "",
    balance: calculatePortfolioItemBalance(item),
    custom_group: item.customGroup ?? ""
  }));
}

export function exportPortfolioCsv(items: Phase1PortfolioItem[]) {
  const rows = portfolioItemsToRows(items);
  const body = rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","));
  return [headers.join(","), ...body].join("\n");
}

export function exportPortfolioXlsx(items: Phase1PortfolioItem[]) {
  const worksheet = XLSX.utils.json_to_sheet(portfolioItemsToRows(items), { header: [...headers] });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Portfolio");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
```

- [ ] **Step 5: Run file tests**

Run:

```bash
npm test -- src/tests/phase1/portfolio-file.test.ts
```

Expected: PASS.

---

### Task 4: Add Phase 1 Local IndexedDB Workbook Store

**Files:**
- Create: `src/lib/phase1/default-workbook.ts`
- Create: `src/lib/storage/phase1-store.ts`
- Test: `src/tests/storage/phase1-store.test.ts`

- [ ] **Step 1: Create default workbook**

Create `src/lib/phase1/default-workbook.ts`:

```ts
import type { Phase1Workbook } from "@/types/phase1";

export const defaultPhase1Workbook: Phase1Workbook = {
  id: "phase1-default",
  schemaVersion: "phase1.1",
  updatedAt: new Date("2026-06-08T00:00:00.000Z").toISOString(),
  fireInputs: {
    currentAge: 40,
    lifeExpectancy: 90,
    fireRuleMode: "withdrawal_rate",
    currentFireAssets: 0,
    annualExpenses: 100_000,
    annualPassiveGuaranteedIncome: 0,
    passiveGuaranteedIncomeInflationAdjusted: true,
    annualSavingsBeforeFire: 50_000,
    expectedAnnualPortfolioReturnPercent: 6,
    inflationRatePercent: 3,
    withdrawalRatePercent: 4,
    taxMode: "none",
    simpleEffectiveTaxRatePercent: 0
  },
  portfolioItems: []
};
```

- [ ] **Step 2: Implement Phase 1 store**

Create `src/lib/storage/phase1-store.ts`:

```ts
import Dexie, { type Table } from "dexie";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type { Phase1Workbook } from "@/types/phase1";

type StoredPhase1Workbook = {
  id: string;
  updatedAt: string;
  data: Phase1Workbook;
};

class Phase1Db extends Dexie {
  workbooks!: Table<StoredPhase1Workbook, string>;

  constructor() {
    super("freedom-path-phase1");
    this.version(1).stores({
      workbooks: "id, updatedAt"
    });
  }
}

let db: Phase1Db | null = null;

export function getPhase1Db() {
  if (!db) db = new Phase1Db();
  return db;
}

export async function savePhase1Workbook(workbook: Phase1Workbook) {
  const updated: Phase1Workbook = {
    ...workbook,
    updatedAt: new Date().toISOString()
  };

  await getPhase1Db().workbooks.put({
    id: updated.id,
    updatedAt: updated.updatedAt,
    data: updated
  });

  return updated;
}

export async function loadPhase1Workbook() {
  const stored = await getPhase1Db().workbooks.get(defaultPhase1Workbook.id);
  return stored?.data ?? null;
}

export async function ensurePhase1Workbook() {
  const stored = await loadPhase1Workbook();
  if (stored) return stored;
  return savePhase1Workbook(defaultPhase1Workbook);
}
```

- [ ] **Step 3: Write focused store smoke test**

Create `src/tests/storage/phase1-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";

describe("defaultPhase1Workbook", () => {
  it("starts with path-first inputs and no portfolio rows", () => {
    expect(defaultPhase1Workbook.id).toBe("phase1-default");
    expect(defaultPhase1Workbook.fireInputs.fireRuleMode).toBe("withdrawal_rate");
    expect(defaultPhase1Workbook.portfolioItems).toEqual([]);
  });
});
```

- [ ] **Step 4: Run store smoke test**

Run:

```bash
npm test -- src/tests/storage/phase1-store.test.ts
```

Expected: PASS.

---

### Task 5: Add EODHD Market Data Provider

**Files:**
- Modify: `src/types/market-data.ts`
- Create: `src/lib/market-data/eodhd.ts`
- Modify: `src/app/api/prices/route.ts`
- Test: `src/tests/market-data/eodhd.test.ts`

- [ ] **Step 1: Extend fetched price source types**

Modify `src/types/market-data.ts` so `FetchedMarketPrice["source"]` includes EODHD and unsupported states:

```ts
export type FetchedMarketPrice = {
  symbol: string;
  priceDate: string;
  closePrice: number | null;
  source: "alpha_vantage_eod" | "eodhd_eod" | "manual_required" | "unsupported";
  warning?: string;
};
```

- [ ] **Step 2: Write EODHD helper tests**

Create `src/tests/market-data/eodhd.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeEodhdSymbol, parseEodhdLatestPrice } from "@/lib/market-data/eodhd";

describe("EODHD helpers", () => {
  it("adds .US to plain US stock and ETF symbols", () => {
    expect(normalizeEodhdSymbol("vti", "etf")).toBe("VTI.US");
    expect(normalizeEodhdSymbol("AAPL", "stock")).toBe("AAPL.US");
  });

  it("keeps explicit EODHD symbols unchanged", () => {
    expect(normalizeEodhdSymbol("BTC-USD.CC", "crypto")).toBe("BTC-USD.CC");
    expect(normalizeEodhdSymbol("VTI.US", "etf")).toBe("VTI.US");
  });

  it("parses the newest EODHD close from descending results", () => {
    expect(
      parseEodhdLatestPrice("VTI", [
        { date: "2026-06-05", close: 301.25 },
        { date: "2026-06-04", close: 300.1 }
      ])
    ).toEqual({
      symbol: "VTI",
      priceDate: "2026-06-05",
      closePrice: 301.25,
      source: "eodhd_eod",
      warning: "Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values."
    });
  });
});
```

- [ ] **Step 3: Implement EODHD provider**

Create `src/lib/market-data/eodhd.ts`:

```ts
import type { Phase1AssetType } from "@/types/phase1";
import type { FetchedMarketPrice } from "@/types/market-data";

type EodhdRow = {
  date?: string;
  close?: number;
  adjusted_close?: number;
};

const warning =
  "Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values.";

export function normalizeEodhdSymbol(symbol: string, assetType: Phase1AssetType = "stock") {
  const cleaned = symbol.trim().toUpperCase();
  if (!cleaned) return cleaned;
  if (cleaned.includes(".")) return cleaned;
  if (assetType === "crypto") return cleaned;
  return `${cleaned}.US`;
}

export function parseEodhdLatestPrice(symbol: string, rows: EodhdRow[]): FetchedMarketPrice {
  const latest = rows.find((row) => row.date && Number(row.adjusted_close ?? row.close) > 0);

  if (!latest?.date) {
    return {
      symbol,
      priceDate: new Date().toISOString().slice(0, 10),
      closePrice: null,
      source: "manual_required",
      warning: "EODHD returned no usable close price."
    };
  }

  return {
    symbol,
    priceDate: latest.date,
    closePrice: Number(latest.adjusted_close ?? latest.close),
    source: "eodhd_eod",
    warning
  };
}

export async function fetchEodhdLatestPrice(
  symbol: string,
  apiKey: string,
  assetType: Phase1AssetType = "stock"
): Promise<FetchedMarketPrice> {
  if (assetType === "option") {
    return {
      symbol,
      priceDate: new Date().toISOString().slice(0, 10),
      closePrice: null,
      source: "unsupported",
      warning: "Options EOD refresh is optional in Phase 1. Enter option prices manually."
    };
  }

  const eodhdSymbol = normalizeEodhdSymbol(symbol, assetType);
  const url = new URL(`https://eodhd.com/api/eod/${encodeURIComponent(eodhdSymbol)}`);
  url.searchParams.set("api_token", apiKey);
  url.searchParams.set("fmt", "json");
  url.searchParams.set("period", "d");
  url.searchParams.set("order", "d");

  try {
    const response = await fetch(url, { next: { revalidate: 60 * 60 * 12 } });
    if (!response.ok) throw new Error(`EODHD request failed with ${response.status}.`);
    const payload = (await response.json()) as EodhdRow[] | { message?: string };
    if (!Array.isArray(payload)) throw new Error("EODHD returned a non-list response.");
    return parseEodhdLatestPrice(symbol.toUpperCase(), payload);
  } catch (error) {
    return {
      symbol,
      priceDate: new Date().toISOString().slice(0, 10),
      closePrice: null,
      source: "manual_required",
      warning: error instanceof Error ? error.message : "Could not fetch latest EODHD price."
    };
  }
}
```

- [ ] **Step 4: Replace price route provider logic**

Modify `src/app/api/prices/route.ts` so it:

- accepts `symbols=AAPL,VTI`
- accepts optional `assetTypes=AAPL:stock,VTI:etf,BTC-USD.CC:crypto`
- uses `MARKET_DATA_PROVIDER=eodhd`
- reads `EODHD_API_KEY`
- deduplicates symbols
- returns manual-required rows when the key is missing

Core route body:

```ts
const provider = process.env.MARKET_DATA_PROVIDER ?? "eodhd";
const eodhdKey = process.env.EODHD_API_KEY;

if (provider === "eodhd" && eodhdKey) {
  const prices = await Promise.all(
    symbols.map((symbol) => fetchEodhdLatestPrice(symbol, eodhdKey, assetTypeBySymbol.get(symbol) ?? "stock"))
  );
  return NextResponse.json({ prices, warning: buildPriceWarning(prices) });
}
```

- [ ] **Step 5: Run EODHD tests**

Run:

```bash
npm test -- src/tests/market-data/eodhd.test.ts
```

Expected: PASS.

---

### Task 6: Build the Phase 1 Top Navigation and Routes

**Files:**
- Modify: `src/components/layout/app-shell.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/app/page.tsx`
- Modify: `src/app/app/fire-path/page.tsx`
- Modify: `src/app/app/portfolio-lab/page.tsx`
- Create: `src/components/planning/phase1-workspace.tsx`

- [ ] **Step 1: Replace sidebar shell with top navigation**

Modify `src/components/layout/app-shell.tsx` to render:

- top bar
- Household FIRE Planner label
- `Path to FIRE` link to `/app/fire-path`
- `Understand Portfolio` link to `/app/portfolio-lab`
- no sidebar
- no settings/login/cloud links

Use button/link classes with at least `px-4 py-3` so touch targets are easy to click.

- [ ] **Step 2: Remove landing page behavior**

Modify `src/app/page.tsx` to redirect to `/app/fire-path`:

```ts
import { redirect } from "next/navigation";

export default function HomePage() {
  redirect("/app/fire-path");
}
```

Modify `src/app/app/page.tsx` to do the same:

```ts
import { redirect } from "next/navigation";

export default function AppPage() {
  redirect("/app/fire-path");
}
```

- [ ] **Step 3: Create Phase 1 workspace skeleton**

Create `src/components/planning/phase1-workspace.tsx` with:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { calculatePhase1Fire } from "@/lib/phase1/fire";
import { summarizePhase1Portfolio } from "@/lib/phase1/portfolio";
import { ensurePhase1Workbook, savePhase1Workbook } from "@/lib/storage/phase1-store";
import type { Phase1Workbook } from "@/types/phase1";
import { PathToFirePanel } from "@/components/planning/path-to-fire-panel";
import { PortfolioPanel } from "@/components/planning/portfolio-panel";

type Phase1WorkspaceProps = {
  activeTab: "fire" | "portfolio";
};

export function Phase1Workspace({ activeTab }: Phase1WorkspaceProps) {
  const [workbook, setWorkbook] = useState<Phase1Workbook>(defaultPhase1Workbook);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("Local mode is active.");
  const portfolioSummary = useMemo(
    () => summarizePhase1Portfolio(workbook.portfolioItems),
    [workbook.portfolioItems]
  );
  const fireResult = useMemo(
    () => calculatePhase1Fire(workbook.fireInputs),
    [workbook.fireInputs]
  );

  useEffect(() => {
    let active = true;
    ensurePhase1Workbook()
      .then((stored) => {
        if (!active) return;
        setWorkbook(stored);
        setReady(true);
      })
      .catch(() => setStatus("IndexedDB is unavailable. Changes are running in memory."));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => {
      savePhase1Workbook(workbook)
        .then(() => setStatus("Changes autosaved locally."))
        .catch(() => setStatus("Autosave failed. Export a CSV/XLSX backup if needed."));
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [ready, workbook]);

  return activeTab === "fire" ? (
    <PathToFirePanel
      workbook={workbook}
      result={fireResult}
      portfolioSummary={portfolioSummary}
      status={status}
      onChange={setWorkbook}
    />
  ) : (
    <PortfolioPanel workbook={workbook} summary={portfolioSummary} status={status} onChange={setWorkbook} />
  );
}
```

- [ ] **Step 4: Wire route pages to the new workspace**

Modify `src/app/app/fire-path/page.tsx`:

```tsx
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export default function FirePathPage() {
  return <Phase1Workspace activeTab="fire" />;
}
```

Modify `src/app/app/portfolio-lab/page.tsx`:

```tsx
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export default function PortfolioLabPage() {
  return <Phase1Workspace activeTab="portfolio" />;
}
```

- [ ] **Step 5: Run build**

Run:

```bash
npm run build
```

Expected: build may fail until the panel components are created in Task 7. Continue to Task 7 before final verification.

---

### Task 7: Build Path to FIRE and Understand Portfolio Panels

**Files:**
- Create: `src/components/planning/path-to-fire-panel.tsx`
- Create: `src/components/planning/portfolio-panel.tsx`

- [ ] **Step 1: Build Path to FIRE panel**

Create `src/components/planning/path-to-fire-panel.tsx` with:

- input form for all `Phase1FireInputs`
- radio/segmented control for `fireRuleMode`
- button `Use Portfolio FIRE Assets`
- output cards for Simple FIRE number, FIRE gap, estimated years, estimated FIRE age, deterministic pass/fail
- planning disclaimer copy
- large clickable buttons, minimum `py-3`

Required update pattern:

```tsx
onChange({
  ...workbook,
  fireInputs: {
    ...workbook.fireInputs,
    [field]: nextValue
  }
});
```

Required portfolio button behavior:

```tsx
onClick={() =>
  onChange({
    ...workbook,
    fireInputs: {
      ...workbook.fireInputs,
      currentFireAssets: portfolioSummary.includedInFire
    }
  })
}
```

- [ ] **Step 2: Build Understand Portfolio panel**

Create `src/components/planning/portfolio-panel.tsx` with:

- top stats for total net balance, total assets, total liabilities, Included in FIRE, last EOD refresh
- table columns: Type, Name/Symbol, Tax Bucket, Include in FIRE, Unit Price, Units, Balance, Custom Group
- CSV import button
- XLSX import button
- CSV export button
- XLSX export button
- Refresh EOD Prices button
- one bottom add/edit section with type-sensitive inputs

Required EOD refresh behavior:

```ts
const marketItems = workbook.portfolioItems
  .filter((item) => item.symbol && isMarketPricedType(item.type))
  .map((item) => ({
    symbol: item.symbol!.toUpperCase(),
    type: item.type
  }));
const symbols = [...new Set(marketItems.map((item) => item.symbol))];
const assetTypes = marketItems
  .filter((item, index, rows) => rows.findIndex((row) => row.symbol === item.symbol) === index)
  .map((item) => `${item.symbol}:${item.type}`)
  .join(",");

const response = await fetch(
  `/api/prices?symbols=${encodeURIComponent(symbols.join(","))}&assetTypes=${encodeURIComponent(assetTypes)}`
);
const payload = (await response.json()) as { prices: FetchedMarketPrice[]; warning: string };
const nextItems = applyFetchedPricesToPhase1Portfolio(workbook.portfolioItems, payload.prices);
```

Required file import behavior:

```ts
const result = file.name.endsWith(".xlsx")
  ? parsePortfolioXlsx(await file.arrayBuffer())
  : parsePortfolioCsv(await file.text());

onChange({
  ...workbook,
  portfolioItems: [...workbook.portfolioItems, ...result.items],
  lastImportExportStatus: `${result.items.length} rows imported. ${result.errors.length} rows need review.`
});
```

Required export behavior:

```ts
const blob = new Blob([exportPortfolioCsv(workbook.portfolioItems)], { type: "text/csv;charset=utf-8" });
```

For XLSX:

```ts
const arrayBuffer = exportPortfolioXlsx(workbook.portfolioItems);
const blob = new Blob([arrayBuffer], {
  type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
});
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS or actionable TypeScript errors in the new panel props/imports.

---

### Task 8: Remove Phase 1 Account/UI Leakage and Keep Future Docs

**Files:**
- Modify as needed: `src/components/layout/app-shell.tsx`
- Modify as needed: `src/components/planning/phase1-workspace.tsx`
- Leave existing future routes in place unless build requires changes.

- [ ] **Step 1: Search for visible account/cloud labels in Phase 1 routes**

Run:

```bash
rg -n "Optional Account|Save Cloud|Load Cloud|Supabase|Settings|Saved Paths|Social Security|Family Plan|Wealth Records|Roadmap" src/app src/components
```

Expected: matches may exist in old future routes, but not in `app-shell.tsx`, `phase1-workspace.tsx`, `path-to-fire-panel.tsx`, or `portfolio-panel.tsx`.

- [ ] **Step 2: Remove remaining Phase 1 UI leakage**

If the search finds any of those labels in Phase 1 files, remove them from the Phase 1 UI and leave them only in docs/future routes.

- [ ] **Step 3: Run lint/build**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS.

---

### Task 9: Full Verification

**Files:**
- Modify any source files needed after failures.

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run lint
npm run build
```

Expected: all PASS.

- [ ] **Step 2: Start dev server**

Run:

```bash
npm run dev
```

Expected: local server starts on `http://localhost:3000` or the next available port.

- [ ] **Step 3: Browser verification**

Open the printed local URL and verify:

- `/` goes directly to Path to FIRE.
- Top navigation shows only Path to FIRE and Understand Portfolio.
- No sidebar appears.
- No landing page appears.
- No account/login/cloud-save UI appears.
- Path to FIRE accepts manual inputs and displays the approved outputs.
- Use Portfolio FIRE Assets copies the portfolio Included in FIRE total.
- Understand Portfolio can add market assets and direct-balance assets.
- Liabilities display negative balances in the same table.
- CSV import adds valid rows and reports invalid rows.
- XLSX import adds valid rows and reports invalid rows.
- CSV export downloads current/latest portfolio rows.
- XLSX export downloads current/latest portfolio rows.
- Refresh EOD Prices shows loading and result feedback.
- Buttons are easy to click on desktop and mobile widths.

- [ ] **Step 4: Final status note**

Document any unsupported EODHD symbols observed during manual testing in the final response. Do not print `EODHD_API_KEY`.
