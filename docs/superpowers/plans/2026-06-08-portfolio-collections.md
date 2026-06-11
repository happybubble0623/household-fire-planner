# Portfolio Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add first-class manual Portfolio Collections so users can create analysis groups, select holdings across accounts, and see collection totals and allocation percentages.

**Architecture:** Collections are local-first Phase 1 workbook data, stored separately from portfolio rows as `portfolioCollections` and `portfolioCollectionMemberships`. Pure helpers calculate membership, labels, totals, and percentages; React components only coordinate form state and display. Import/export supports collections with semicolon-separated names and remains backward-compatible with the old `custom_group` CSV/XLSX column.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, React Testing Library, Dexie IndexedDB, `xlsx`, Tailwind CSS classes, lucide-react icons.

---

## Source Specs

- `docs/superpowers/specs/2026-06-08-portfolio-collections-design.md`
- `docs/superpowers/specs/2026-06-08-freedom-path-phase-1-design.md`
- `docs/product-strategy/product-design-flow.md`
- `docs/product-strategy/founder-codex-interaction-log.md`

## Current Code Surface

Existing Phase 1 files that matter:

- `src/types/phase1.ts`: Phase 1 workbook and portfolio item types.
- `src/lib/phase1/default-workbook.ts`: default local workbook.
- `src/lib/storage/phase1-store.ts`: IndexedDB load/save.
- `src/lib/phase1/portfolio.ts`: pure portfolio helpers.
- `src/lib/phase1/portfolio-file.ts`: CSV/XLSX import/export.
- `src/components/planning/phase1-workspace.tsx`: loads/saves workbook and passes props.
- `src/components/planning/portfolio-panel.tsx`: current portfolio UI.
- `src/tests/phase1/portfolio.test.ts`: pure portfolio helper tests.
- `src/tests/phase1/portfolio-file.test.ts`: import/export tests.
- `src/tests/components/portfolio-panel.test.tsx`: portfolio UI tests.
- `src/tests/storage/phase1-store.test.ts`: default workbook/storage tests.

Important repository note:

- The current `Household FIRE Planner` folder and its parent workspace are not git repositories. Do not run commit commands unless a git repo is initialized later. Use file readback, tests, lint, and build for verification.

## Scope

Implement now:

- First-class collection data.
- Lightweight account metadata on portfolio rows because the approved workflow selects holdings across accounts.
- Create/edit/delete collections.
- Manually add/remove holdings from collections.
- Show collection labels in the portfolio table.
- Show collection total, percent of net worth, percent of FIRE assets, and holding mix.
- Local IndexedDB persistence through the existing workbook save flow.
- CSV/XLSX import/export for account metadata and collection names.
- Backward-compatible migration from existing `customGroup` values into collections.

Do not implement now:

- Rule-based smart collections.
- Automatic collection suggestions.
- Nested collections.
- Historical collection charts.
- Rebalancing recommendations.
- Brokerage sync.
- Cloud sync.
- Investment advice language.

## Data Decisions

Add optional account metadata directly to `Phase1PortfolioItem`:

```ts
accountOwner?: string;
accountName?: string;
accountType?: string;
```

This is intentionally not a full account-management model. It gives the UI enough context for "across accounts" collection selection while keeping Phase 1 simple.

Add first-class collection arrays to `Phase1Workbook`:

```ts
portfolioCollections: Phase1PortfolioCollection[];
portfolioCollectionMemberships: Phase1PortfolioCollectionMembership[];
```

Keep `customGroup?: string` on `Phase1PortfolioItem` for backward compatibility and migration only. The UI should move from "Custom Group" to "Collections."

## Task 1: Types, Defaults, And Workbook Migration

**Files:**

- Modify: `src/types/phase1.ts`
- Modify: `src/lib/phase1/default-workbook.ts`
- Create: `src/lib/phase1/workbook.ts`
- Modify: `src/lib/storage/phase1-store.ts`
- Modify: `src/tests/storage/phase1-store.test.ts`

- [ ] **Step 1: Write tests for default collection arrays and custom-group migration**

Add these tests to `src/tests/storage/phase1-store.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import type { Phase1Workbook } from "@/types/phase1";

describe("defaultPhase1Workbook", () => {
  it("starts with path-first inputs, no portfolio rows, and empty collections", () => {
    expect(defaultPhase1Workbook.id).toBe("phase1-default");
    expect(defaultPhase1Workbook.schemaVersion).toBe("phase1.2");
    expect(defaultPhase1Workbook.fireInputs.fireRuleMode).toBe("withdrawal_rate");
    expect(defaultPhase1Workbook.portfolioItems).toEqual([]);
    expect(defaultPhase1Workbook.portfolioCollections).toEqual([]);
    expect(defaultPhase1Workbook.portfolioCollectionMemberships).toEqual([]);
  });

  it("normalizes older workbooks and migrates custom groups into collections", () => {
    const olderWorkbook = {
      ...defaultPhase1Workbook,
      schemaVersion: "phase1.1",
      portfolioCollections: undefined,
      portfolioCollectionMemberships: undefined,
      portfolioItems: [
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
          customGroup: "FIRE Core"
        },
        {
          id: "btc",
          type: "crypto",
          name: "Bitcoin",
          symbol: "BTC-USD.CC",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 100000,
          units: 0.1,
          balance: 10000,
          customGroup: "High Risk"
        }
      ]
    } as unknown as Phase1Workbook;

    const normalized = normalizePhase1Workbook(olderWorkbook);

    expect(normalized.schemaVersion).toBe("phase1.2");
    expect(normalized.portfolioCollections.map((collection) => collection.name)).toEqual([
      "FIRE Core",
      "High Risk"
    ]);
    expect(normalized.portfolioCollectionMemberships).toEqual([
      {
        collectionId: normalized.portfolioCollections[0].id,
        portfolioItemId: "vti"
      },
      {
        collectionId: normalized.portfolioCollections[1].id,
        portfolioItemId: "btc"
      }
    ]);
  });
});
```

- [ ] **Step 2: Run the storage test and verify it fails**

Run:

```bash
npm test -- src/tests/storage/phase1-store.test.ts
```

Expected:

```text
FAIL src/tests/storage/phase1-store.test.ts
```

Expected reason: `normalizePhase1Workbook` does not exist and `schemaVersion` is still `phase1.1`.

- [ ] **Step 3: Update Phase 1 types**

In `src/types/phase1.ts`, add:

```ts
export type Phase1PortfolioCollection = {
  id: string;
  name: string;
  purpose?: string;
  targetMinPercent?: number;
  targetMaxPercent?: number;
  createdAt: string;
  updatedAt: string;
};

export type Phase1PortfolioCollectionMembership = {
  collectionId: string;
  portfolioItemId: string;
};
```

Update `Phase1PortfolioItem`:

```ts
export type Phase1PortfolioItem = {
  id: string;
  type: Phase1AssetType;
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
  priceStatus?: Phase1PriceStatus;
  priceDate?: string;
  priceWarning?: string;
};
```

Update `Phase1Workbook`:

```ts
export type Phase1Workbook = {
  id: "phase1-default";
  schemaVersion: "phase1.2";
  updatedAt: string;
  fireInputs: Phase1FireInputs;
  portfolioItems: Phase1PortfolioItem[];
  portfolioCollections: Phase1PortfolioCollection[];
  portfolioCollectionMemberships: Phase1PortfolioCollectionMembership[];
  lastEodRefreshAt?: string;
  lastImportExportStatus?: string;
};
```

- [ ] **Step 4: Update default workbook**

In `src/lib/phase1/default-workbook.ts`, change:

```ts
schemaVersion: "phase1.2",
```

and add:

```ts
portfolioItems: [],
portfolioCollections: [],
portfolioCollectionMemberships: []
```

- [ ] **Step 5: Create workbook normalization helper**

Create `src/lib/phase1/workbook.ts`:

```ts
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type {
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1Workbook
} from "@/types/phase1";

type LegacyPhase1Workbook = Omit<
  Phase1Workbook,
  "schemaVersion" | "portfolioCollections" | "portfolioCollectionMemberships"
> & {
  schemaVersion?: string;
  portfolioCollections?: Phase1PortfolioCollection[];
  portfolioCollectionMemberships?: Phase1PortfolioCollectionMembership[];
};

export function normalizePhase1Workbook(workbook: Phase1Workbook | LegacyPhase1Workbook) {
  const baseWorkbook = {
    ...defaultPhase1Workbook,
    ...workbook,
    fireInputs: {
      ...defaultPhase1Workbook.fireInputs,
      ...workbook.fireInputs
    },
    portfolioItems: workbook.portfolioItems ?? [],
    portfolioCollections: workbook.portfolioCollections ?? [],
    portfolioCollectionMemberships: workbook.portfolioCollectionMemberships ?? []
  };

  const migrated = migrateCustomGroupsToCollections(baseWorkbook);

  return {
    ...migrated,
    schemaVersion: "phase1.2" as const
  };
}

function migrateCustomGroupsToCollections(workbook: LegacyPhase1Workbook): Phase1Workbook {
  const existingCollections = workbook.portfolioCollections ?? [];
  const existingMemberships = workbook.portfolioCollectionMemberships ?? [];
  const collectionByName = new Map(
    existingCollections.map((collection) => [normalizeCollectionName(collection.name), collection])
  );
  const memberships = [...existingMemberships];
  const collections = [...existingCollections];
  const now = workbook.updatedAt || new Date("2026-06-08T00:00:00.000Z").toISOString();

  for (const item of workbook.portfolioItems ?? []) {
    const customGroup = item.customGroup?.trim();
    if (!customGroup) continue;

    const normalizedName = normalizeCollectionName(customGroup);
    let collection = collectionByName.get(normalizedName);

    if (!collection) {
      collection = {
        id: createStableCollectionId(customGroup, collections.length),
        name: customGroup,
        createdAt: now,
        updatedAt: now
      };
      collections.push(collection);
      collectionByName.set(normalizedName, collection);
    }

    if (
      !memberships.some(
        (membership) =>
          membership.collectionId === collection!.id && membership.portfolioItemId === item.id
      )
    ) {
      memberships.push({
        collectionId: collection.id,
        portfolioItemId: item.id
      });
    }
  }

  return {
    ...defaultPhase1Workbook,
    ...workbook,
    schemaVersion: "phase1.2",
    fireInputs: {
      ...defaultPhase1Workbook.fireInputs,
      ...workbook.fireInputs
    },
    portfolioItems: workbook.portfolioItems ?? [],
    portfolioCollections: collections,
    portfolioCollectionMemberships: memberships
  };
}

function normalizeCollectionName(name: string) {
  return name.trim().toLowerCase();
}

function createStableCollectionId(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `collection-${slug || "custom"}-${index + 1}`;
}
```

- [ ] **Step 6: Normalize on IndexedDB load and initial save**

In `src/lib/storage/phase1-store.ts`, import:

```ts
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
```

Update `savePhase1Workbook` so it normalizes before stamping `updatedAt`:

```ts
const updatedWorkbook = {
  ...normalizePhase1Workbook(workbook),
  updatedAt: new Date().toISOString()
};
```

Update `loadPhase1Workbook`:

```ts
const stored = await getPhase1Db().workbooks.get(id);
return stored?.data ? normalizePhase1Workbook(stored.data) : null;
```

- [ ] **Step 7: Run the storage test and verify it passes**

Run:

```bash
npm test -- src/tests/storage/phase1-store.test.ts
```

Expected:

```text
PASS src/tests/storage/phase1-store.test.ts
```

## Task 2: Pure Collection Helpers

**Files:**

- Create: `src/lib/phase1/collections.ts`
- Create: `src/tests/phase1/collections.test.ts`

- [ ] **Step 1: Write failing collection helper tests**

Create `src/tests/phase1/collections.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  addItemsToCollection,
  deletePortfolioCollection,
  getCollectionLabelsForItem,
  removeItemFromCollection,
  summarizePortfolioCollections
} from "@/lib/phase1/collections";
import type {
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1PortfolioItem
} from "@/types/phase1";

const collections: Phase1PortfolioCollection[] = [
  {
    id: "core",
    name: "FIRE Core",
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z"
  },
  {
    id: "risk",
    name: "High Risk",
    createdAt: "2026-06-08T00:00:00.000Z",
    updatedAt: "2026-06-08T00:00:00.000Z"
  }
];

const items: Phase1PortfolioItem[] = [
  {
    id: "vti",
    type: "etf",
    name: "VTI",
    symbol: "VTI",
    accountName: "Fidelity Roth IRA",
    taxBucket: "Roth",
    includedInFire: true,
    unitPrice: 300,
    units: 10,
    balance: 3000
  },
  {
    id: "btc",
    type: "crypto",
    name: "Bitcoin",
    symbol: "BTC-USD.CC",
    accountName: "Coinbase",
    taxBucket: "Taxable",
    includedInFire: true,
    unitPrice: 100000,
    units: 0.1,
    balance: 10000
  },
  {
    id: "mortgage",
    type: "liability",
    name: "Mortgage",
    accountName: "Chase",
    taxBucket: "Other",
    includedInFire: true,
    balance: -2000
  }
];

describe("portfolio collections", () => {
  it("adds multiple items to a collection without duplicate memberships", () => {
    const existing: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "core", portfolioItemId: "vti" }
    ];

    expect(addItemsToCollection(existing, "core", ["vti", "btc"])).toEqual([
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "core", portfolioItemId: "btc" }
    ]);
  });

  it("removes one item from one collection only", () => {
    const existing: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "risk", portfolioItemId: "vti" }
    ];

    expect(removeItemFromCollection(existing, "core", "vti")).toEqual([
      { collectionId: "risk", portfolioItemId: "vti" }
    ]);
  });

  it("deletes a collection without deleting portfolio holdings", () => {
    const existing: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "risk", portfolioItemId: "btc" }
    ];

    expect(deletePortfolioCollection(collections, existing, "core")).toEqual({
      collections: [collections[1]],
      memberships: [{ collectionId: "risk", portfolioItemId: "btc" }]
    });
  });

  it("returns labels for each portfolio item", () => {
    const memberships: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "risk", portfolioItemId: "vti" }
    ];

    expect(getCollectionLabelsForItem("vti", collections, memberships)).toEqual([
      "FIRE Core",
      "High Risk"
    ]);
  });

  it("summarizes totals, FIRE percentage, net-worth percentage, and holding mix", () => {
    const memberships: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "risk", portfolioItemId: "btc" },
      { collectionId: "risk", portfolioItemId: "mortgage" }
    ];

    const summaries = summarizePortfolioCollections({
      items,
      collections,
      memberships
    });

    expect(summaries.find((summary) => summary.collection.id === "risk")).toMatchObject({
      collectionBalance: 8000,
      percentOfNetWorth: 72.72727272727273,
      percentOfFireAssets: 72.72727272727273,
      holdings: [
        expect.objectContaining({ itemId: "btc", mixPercent: 125 }),
        expect.objectContaining({ itemId: "mortgage", mixPercent: -25 })
      ]
    });
  });
});
```

- [ ] **Step 2: Run the collection helper test and verify it fails**

Run:

```bash
npm test -- src/tests/phase1/collections.test.ts
```

Expected:

```text
FAIL src/tests/phase1/collections.test.ts
```

Expected reason: `src/lib/phase1/collections.ts` does not exist.

- [ ] **Step 3: Implement pure collection helpers**

Create `src/lib/phase1/collections.ts`:

```ts
import { calculatePortfolioItemBalance } from "@/lib/phase1/portfolio";
import type {
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1PortfolioItem
} from "@/types/phase1";

export type PortfolioCollectionHoldingSummary = {
  itemId: string;
  name: string;
  symbol?: string;
  accountName?: string;
  taxBucket: string;
  balance: number;
  mixPercent: number;
};

export type PortfolioCollectionSummary = {
  collection: Phase1PortfolioCollection;
  collectionBalance: number;
  percentOfNetWorth: number;
  percentOfFireAssets: number;
  holdings: PortfolioCollectionHoldingSummary[];
};

type CollectionSummaryInput = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
};

export function addItemsToCollection(
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string,
  itemIds: string[]
) {
  const nextMemberships = [...memberships];

  for (const itemId of itemIds) {
    if (
      !nextMemberships.some(
        (membership) =>
          membership.collectionId === collectionId && membership.portfolioItemId === itemId
      )
    ) {
      nextMemberships.push({ collectionId, portfolioItemId: itemId });
    }
  }

  return nextMemberships;
}

export function removeItemFromCollection(
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string,
  itemId: string
) {
  return memberships.filter(
    (membership) =>
      !(membership.collectionId === collectionId && membership.portfolioItemId === itemId)
  );
}

export function deletePortfolioCollection(
  collections: Phase1PortfolioCollection[],
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string
) {
  return {
    collections: collections.filter((collection) => collection.id !== collectionId),
    memberships: memberships.filter((membership) => membership.collectionId !== collectionId)
  };
}

export function getCollectionLabelsForItem(
  itemId: string,
  collections: Phase1PortfolioCollection[],
  memberships: Phase1PortfolioCollectionMembership[]
) {
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));

  return memberships
    .filter((membership) => membership.portfolioItemId === itemId)
    .map((membership) => collectionById.get(membership.collectionId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function summarizePortfolioCollections({
  items,
  collections,
  memberships
}: CollectionSummaryInput): PortfolioCollectionSummary[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const totalNetWorth = items.reduce(
    (total, item) => total + calculatePortfolioItemBalance(item),
    0
  );
  const totalFireAssets = items.reduce(
    (total, item) =>
      item.includedInFire ? total + calculatePortfolioItemBalance(item) : total,
    0
  );

  return collections.map((collection) => {
    const collectionItems = memberships
      .filter((membership) => membership.collectionId === collection.id)
      .map((membership) => itemById.get(membership.portfolioItemId))
      .filter((item): item is Phase1PortfolioItem => Boolean(item));

    const collectionBalance = collectionItems.reduce(
      (total, item) => total + calculatePortfolioItemBalance(item),
      0
    );

    return {
      collection,
      collectionBalance,
      percentOfNetWorth: toPercent(collectionBalance, totalNetWorth),
      percentOfFireAssets: toPercent(collectionBalance, totalFireAssets),
      holdings: collectionItems.map((item) => {
        const balance = calculatePortfolioItemBalance(item);

        return {
          itemId: item.id,
          name: item.name,
          symbol: item.symbol,
          accountName: item.accountName,
          taxBucket: item.taxBucket,
          balance,
          mixPercent: toPercent(balance, collectionBalance)
        };
      })
    };
  });
}

function toPercent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}
```

- [ ] **Step 4: Run helper tests and verify they pass**

Run:

```bash
npm test -- src/tests/phase1/collections.test.ts src/tests/phase1/portfolio.test.ts
```

Expected:

```text
PASS src/tests/phase1/collections.test.ts
PASS src/tests/phase1/portfolio.test.ts
```

## Task 3: CSV/XLSX Import And Export With Account Metadata And Collections

**Files:**

- Modify: `src/lib/phase1/portfolio-file.ts`
- Modify: `src/tests/phase1/portfolio-file.test.ts`

- [ ] **Step 1: Add failing import/export tests**

Add these tests to `src/tests/phase1/portfolio-file.test.ts`:

```ts
it("exports account metadata and semicolon-separated collection names", () => {
  const csv = exportPortfolioCsv({
    items: [
      {
        id: "vti",
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        accountOwner: "Me",
        accountName: "Fidelity Roth IRA",
        accountType: "Roth IRA",
        taxBucket: "Roth",
        includedInFire: true,
        unitPrice: 300,
        units: 10,
        balance: 3000
      }
    ],
    collections: [
      {
        id: "core",
        name: "FIRE Core",
        createdAt: "2026-06-08T00:00:00.000Z",
        updatedAt: "2026-06-08T00:00:00.000Z"
      },
      {
        id: "watch",
        name: "Rebalance Watch",
        createdAt: "2026-06-08T00:00:00.000Z",
        updatedAt: "2026-06-08T00:00:00.000Z"
      }
    ],
    memberships: [
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "watch", portfolioItemId: "vti" }
    ]
  });

  expect(csv.split("\n")[0]).toBe(
    "type,name,symbol,account_owner,account_name,account_type,tax_bucket,include_in_fire,unit_price,units,balance,collections"
  );
  expect(csv).toContain("Me,Fidelity Roth IRA,Roth IRA,Roth");
  expect(csv).toContain("FIRE Core; Rebalance Watch");
});

it("imports collections and maps memberships to imported row ids", () => {
  const csv = [
    "type,name,symbol,account_owner,account_name,account_type,tax_bucket,include_in_fire,unit_price,units,balance,collections",
    "ETF,VTI,VTI,Me,Fidelity Roth IRA,Roth IRA,Roth,yes,300,10,,FIRE Core; Rebalance Watch",
    "Crypto,Bitcoin,BTC-USD.CC,Me,Coinbase,Taxable Brokerage,Taxable,yes,100000,0.1,,High Risk"
  ].join("\n");

  const result = parsePortfolioCsv(csv);

  expect(result.errors).toEqual([]);
  expect(result.items).toHaveLength(2);
  expect(result.items[0]).toMatchObject({
    accountOwner: "Me",
    accountName: "Fidelity Roth IRA",
    accountType: "Roth IRA"
  });
  expect(result.collections.map((collection) => collection.name)).toEqual([
    "FIRE Core",
    "Rebalance Watch",
    "High Risk"
  ]);
  expect(result.memberships).toEqual([
    { collectionId: result.collections[0].id, portfolioItemId: result.items[0].id },
    { collectionId: result.collections[1].id, portfolioItemId: result.items[0].id },
    { collectionId: result.collections[2].id, portfolioItemId: result.items[1].id }
  ]);
});

it("imports legacy custom_group values as collections when collections is blank", () => {
  const csv = [
    "type,name,include_in_fire,balance,custom_group",
    "cash,Emergency Fund,yes,10000,Bridge Fund"
  ].join("\n");

  const result = parsePortfolioCsv(csv);

  expect(result.items).toHaveLength(1);
  expect(result.collections.map((collection) => collection.name)).toEqual(["Bridge Fund"]);
  expect(result.memberships).toEqual([
    { collectionId: result.collections[0].id, portfolioItemId: result.items[0].id }
  ]);
});
```

- [ ] **Step 2: Run portfolio file tests and verify they fail**

Run:

```bash
npm test -- src/tests/phase1/portfolio-file.test.ts
```

Expected:

```text
FAIL src/tests/phase1/portfolio-file.test.ts
```

Expected reason: export functions still accept only items and import results do not include collections.

- [ ] **Step 3: Update import/export types**

In `src/types/phase1.ts`, update `PortfolioImportResult`:

```ts
export type PortfolioImportResult = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
  errors: PortfolioImportRowError[];
};
```

In `src/lib/phase1/portfolio-file.ts`, update imports to include:

```ts
Phase1PortfolioCollection,
Phase1PortfolioCollectionMembership
```

Add an export input type:

```ts
export type PortfolioFileExportInput = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
};
```

- [ ] **Step 4: Replace export headers**

In `src/lib/phase1/portfolio-file.ts`, replace `portfolioFileHeaders` with:

```ts
export const portfolioFileHeaders = [
  "type",
  "name",
  "symbol",
  "account_owner",
  "account_name",
  "account_type",
  "tax_bucket",
  "include_in_fire",
  "unit_price",
  "units",
  "balance",
  "collections"
] as const;

const acceptedPortfolioFileHeaders = [...portfolioFileHeaders, "custom_group"] as const;
type AcceptedPortfolioFileHeader = (typeof acceptedPortfolioFileHeaders)[number];
```

Update `RawPortfolioRow`:

```ts
type RawPortfolioRow = Partial<Record<AcceptedPortfolioFileHeader, string>>;
```

Update `isPortfolioFileHeader`:

```ts
function isPortfolioFileHeader(header: string): header is AcceptedPortfolioFileHeader {
  return acceptedPortfolioFileHeaders.includes(header as AcceptedPortfolioFileHeader);
}
```

- [ ] **Step 5: Update export functions**

Change export signatures:

```ts
export function exportPortfolioCsv(input: PortfolioFileExportInput): string {
  return XLSX.utils.sheet_to_csv(rowsToSheet(portfolioItemsToRows(input)), {
    FS: ",",
    RS: "\n"
  });
}

export function exportPortfolioXlsx(input: PortfolioFileExportInput): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(portfolioItemsToRows(input)), "Portfolio");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
```

Replace `portfolioItemsToRows`:

```ts
export function portfolioItemsToRows({
  items,
  collections,
  memberships
}: PortfolioFileExportInput): PortfolioExportRow[] {
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));

  return items.map((item) => ({
    type: item.type,
    name: item.name,
    symbol: item.symbol ?? "",
    account_owner: item.accountOwner ?? "",
    account_name: item.accountName ?? "",
    account_type: item.accountType ?? "",
    tax_bucket: item.taxBucket,
    include_in_fire: item.includedInFire ? "yes" : "no",
    unit_price: item.unitPrice ?? "",
    units: item.units ?? "",
    balance: item.type === "liability" ? -Math.abs(item.balance) : item.balance,
    collections: memberships
      .filter((membership) => membership.portfolioItemId === item.id)
      .map((membership) => collectionById.get(membership.collectionId)?.name)
      .filter((name): name is string => Boolean(name))
      .join("; ")
  }));
}
```

- [ ] **Step 6: Update parse result accumulator**

In `parseWorkbook`, initialize:

```ts
{
  items: [],
  collections: [],
  memberships: [],
  errors: []
}
```

After `parseRow`, when `parsed.item` exists, add parsed item and collection memberships:

```ts
if (parsed.item) {
  result.items.push(parsed.item);
  for (const collectionName of parsed.collectionNames) {
    const collection = findOrCreateImportedCollection(result.collections, collectionName);
    result.memberships.push({
      collectionId: collection.id,
      portfolioItemId: parsed.item.id
    });
  }
}
```

Update `parseRow` return type:

```ts
): { item?: Phase1PortfolioItem; collectionNames: string[]; message?: string } {
```

Every early return should include `collectionNames: []`.

In the successful return, add account fields and collection names:

```ts
const collectionNames = parseCollectionNames(row.collections || row.custom_group);

return {
  item: {
    id: createImportId(rowNumber, typeResult.type, name),
    type: typeResult.type,
    name,
    symbol: optionalString(row.symbol),
    accountOwner: optionalString(row.account_owner),
    accountName: optionalString(row.account_name),
    accountType: optionalString(row.account_type),
    taxBucket: optionalString(row.tax_bucket) ?? "Other",
    includedInFire: includeResult.value,
    unitPrice: unitPrice.value,
    units: units.value,
    balance,
    customGroup: optionalString(row.custom_group)
  },
  collectionNames
};
```

Add helpers:

```ts
function parseCollectionNames(value: string | undefined) {
  return [...new Set(
    (value ?? "")
      .split(";")
      .map((name) => name.trim())
      .filter(Boolean)
  )];
}

function findOrCreateImportedCollection(
  collections: Phase1PortfolioCollection[],
  name: string
) {
  const existing = collections.find(
    (collection) => collection.name.trim().toLowerCase() === name.trim().toLowerCase()
  );
  if (existing) return existing;

  const now = new Date("2026-06-08T00:00:00.000Z").toISOString();
  const collection = {
    id: createCollectionImportId(collections.length, name),
    name,
    createdAt: now,
    updatedAt: now
  };
  collections.push(collection);
  return collection;
}

function createCollectionImportId(index: number, name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `collection-import-${index + 1}-${slug || "collection"}`;
}
```

- [ ] **Step 7: Run import/export tests**

Before running, update existing `portfolio-file.test.ts` calls that still pass a bare item array. Replace calls like:

```ts
exportPortfolioCsv([
  {
    id: "cash",
    type: "cash",
    name: "Emergency Fund",
    taxBucket: "Cash",
    includedInFire: true,
    balance: 10000,
    customGroup: "Cash"
  }
])
```

with:

```ts
exportPortfolioCsv({
  items: [
    {
      id: "cash",
      type: "cash",
      name: "Emergency Fund",
      taxBucket: "Cash",
      includedInFire: true,
      balance: 10000
    }
  ],
  collections: [],
  memberships: []
})
```

Replace calls like:

```ts
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
```

with:

```ts
portfolioItemsToRows({
  items: [
    {
      id: "vti",
      type: "etf",
      name: "VTI",
      symbol: "VTI",
      taxBucket: "Taxable",
      includedInFire: true,
      unitPrice: 300,
      units: 10,
      balance: 3000
    }
  ],
  collections: [],
  memberships: []
})
```

Replace existing expected export headers with:

```text
type,name,symbol,account_owner,account_name,account_type,tax_bucket,include_in_fire,unit_price,units,balance,collections
```

Run:

```bash
npm test -- src/tests/phase1/portfolio-file.test.ts
```

Expected:

```text
PASS src/tests/phase1/portfolio-file.test.ts
```

## Task 4: Portfolio Panel Collection UI

**Files:**

- Create: `src/components/planning/portfolio-collections-panel.tsx`
- Modify: `src/components/planning/portfolio-panel.tsx`
- Modify: `src/tests/components/portfolio-panel.test.tsx`

- [ ] **Step 1: Add failing UI tests for create, add, view, and delete**

Add this test to `src/tests/components/portfolio-panel.test.tsx`:

```tsx
it("creates a collection, adds selected holdings, and shows allocation", async () => {
  function SeededPortfolioPanelHarness() {
    const [workbook, setWorkbook] = useState<Phase1Workbook>({
      ...defaultPhase1Workbook,
      portfolioItems: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "VTI",
          accountOwner: "Me",
          accountName: "Fidelity Roth IRA",
          accountType: "Roth IRA",
          taxBucket: "Roth",
          includedInFire: true,
          unitPrice: 300,
          units: 10,
          balance: 3000
        },
        {
          id: "btc",
          type: "crypto",
          name: "Bitcoin",
          symbol: "BTC-USD.CC",
          accountOwner: "Me",
          accountName: "Coinbase",
          accountType: "Taxable Brokerage",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 100000,
          units: 0.1,
          balance: 10000
        }
      ],
      portfolioCollections: [],
      portfolioCollectionMemberships: []
    });
    const portfolioSummary = useMemo(
      () => summarizePhase1Portfolio(workbook.portfolioItems),
      [workbook.portfolioItems]
    );

    return (
      <PortfolioPanel
        workbook={workbook}
        fireResult={null}
        fireError={null}
        portfolioSummary={portfolioSummary}
        status="Local mode. Test ready."
        onChange={setWorkbook}
      />
    );
  }

  render(<SeededPortfolioPanelHarness />);

  fireEvent.change(screen.getByLabelText("Collection name"), {
    target: { value: "High Risk" }
  });
  fireEvent.change(screen.getByLabelText("Collection purpose"), {
    target: { value: "Watch concentrated risk" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

  expect(screen.getByText("High Risk")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("checkbox", { name: "Select Bitcoin" }));
  fireEvent.change(screen.getByLabelText("Add selected rows to collection"), {
    target: { value: "collection-high-risk" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Selected To Collection" }));

  expect(await screen.findByText("High Risk")).toBeInTheDocument();
  expect(screen.getByText("Bitcoin")).toBeInTheDocument();
  expect(screen.getByText("$10,000")).toBeInTheDocument();
  expect(screen.getByText("76.9% of net worth")).toBeInTheDocument();
  expect(screen.getByText("76.9% of FIRE assets")).toBeInTheDocument();
});

it("deletes a collection without deleting the underlying holding", () => {
  render(<PortfolioPanelHarness />);

  fireEvent.change(screen.getByLabelText("Type"), { target: { value: "cash" } });
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Emergency Fund" } });
  fireEvent.change(screen.getByLabelText("Balance"), { target: { value: "10000" } });
  fireEvent.click(screen.getByRole("button", { name: "Add Portfolio Row" }));

  fireEvent.change(screen.getByLabelText("Collection name"), {
    target: { value: "Bridge Fund" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Collection" }));

  fireEvent.click(screen.getByRole("checkbox", { name: "Select Emergency Fund" }));
  fireEvent.change(screen.getByLabelText("Add selected rows to collection"), {
    target: { value: "collection-bridge-fund" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Add Selected To Collection" }));

  fireEvent.click(screen.getByRole("button", { name: "Delete collection Bridge Fund" }));

  expect(screen.queryByText("Bridge Fund")).not.toBeInTheDocument();
  expect(screen.getByText("Emergency Fund")).toBeInTheDocument();
});

it("renames a collection and removes one holding from it", () => {
  function CollectionEditHarness() {
    const [workbook, setWorkbook] = useState<Phase1Workbook>({
      ...defaultPhase1Workbook,
      portfolioItems: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "VTI",
          accountName: "Fidelity Roth IRA",
          taxBucket: "Roth",
          includedInFire: true,
          unitPrice: 300,
          units: 10,
          balance: 3000
        }
      ],
      portfolioCollections: [
        {
          id: "collection-fire-core",
          name: "FIRE Core",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z"
        }
      ],
      portfolioCollectionMemberships: [
        {
          collectionId: "collection-fire-core",
          portfolioItemId: "vti"
        }
      ]
    });
    const portfolioSummary = useMemo(
      () => summarizePhase1Portfolio(workbook.portfolioItems),
      [workbook.portfolioItems]
    );

    return (
      <PortfolioPanel
        workbook={workbook}
        fireResult={null}
        fireError={null}
        portfolioSummary={portfolioSummary}
        status="Local mode. Test ready."
        onChange={setWorkbook}
      />
    );
  }

  render(<CollectionEditHarness />);

  fireEvent.click(screen.getByRole("button", { name: "Edit collection FIRE Core" }));
  fireEvent.change(screen.getByLabelText("Edit collection name"), {
    target: { value: "Long-Term Core" }
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Collection" }));

  expect(screen.getByText("Long-Term Core")).toBeInTheDocument();
  expect(screen.queryByText("FIRE Core")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Remove VTI from Long-Term Core" }));

  expect(screen.getByText("No holdings in this collection yet.")).toBeInTheDocument();
  expect(screen.getByText("VTI")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the UI test and verify it fails**

Run:

```bash
npm test -- src/tests/components/portfolio-panel.test.tsx
```

Expected:

```text
FAIL src/tests/components/portfolio-panel.test.tsx
```

Expected reason: collection UI labels and actions do not exist.

- [ ] **Step 3: Create PortfolioCollectionsPanel component**

Create `src/components/planning/portfolio-collections-panel.tsx`.

The component should:

- Accept `workbook`, `selectedItemIds`, `onChange`, `onClearSelection`, and `setUiStatus`.
- Render create collection fields: `Collection name`, `Collection purpose`, optional target range fields.
- Render `Add selected rows to collection` select and `Add Selected To Collection` button.
- Render collection summary cards using `summarizePortfolioCollections`.
- Render each collection's holdings and `Remove` buttons.
- Render edit/delete controls.
- Use `collection-${slug}` IDs for new collections so tests can select values predictably.
- Provide accessible labels exactly matching the tests: `Edit collection <name>`, `Delete collection <name>`, `Edit collection name`, `Save Collection`, and `Remove <holding> from <collection>`.

Use this component signature:

```tsx
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";

type PortfolioCollectionsPanelProps = {
  workbook: Phase1PanelProps["workbook"];
  selectedItemIds: string[];
  onChange: Phase1PanelProps["onChange"];
  onClearSelection: () => void;
  setUiStatus: (status: string) => void;
};
```

Use this new collection factory inside the component:

```ts
function createCollectionId(name: string, existingIds: Set<string>) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const baseId = `collection-${slug || "custom"}`;
  let nextId = baseId;
  let index = 2;

  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${index}`;
    index += 1;
  }

  return nextId;
}
```

- [ ] **Step 4: Wire collection helpers into PortfolioPanel**

In `src/components/planning/portfolio-panel.tsx`:

Add import:

```ts
import { getCollectionLabelsForItem } from "@/lib/phase1/collections";
import { PortfolioCollectionsPanel } from "@/components/planning/portfolio-collections-panel";
```

Add state:

```ts
const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
```

Add handlers:

```ts
const handleRowSelectionChange = (itemId: string, selected: boolean) => {
  setSelectedItemIds((currentIds) =>
    selected
      ? [...new Set([...currentIds, itemId])]
      : currentIds.filter((currentId) => currentId !== itemId)
  );
};
```

When deleting a portfolio item, also remove its memberships:

```ts
portfolioCollectionMemberships: currentWorkbook.portfolioCollectionMemberships.filter(
  (membership) => membership.portfolioItemId !== item.id
)
```

Replace the `Custom Group` column with:

```tsx
<Th>Collections</Th>
```

Add a selection column before `Type`:

```tsx
<Th>Select</Th>
```

For each row, render:

```tsx
<Td>
  <label className="inline-flex min-h-11 items-center gap-2">
    <input
      type="checkbox"
      aria-label={`Select ${item.name}`}
      checked={selectedItemIds.includes(item.id)}
      onChange={(event) => handleRowSelectionChange(item.id, event.target.checked)}
    />
  </label>
</Td>
```

Render collection labels:

```tsx
<Td>
  <div className="flex flex-wrap gap-1">
    {getCollectionLabelsForItem(
      item.id,
      workbook.portfolioCollections,
      workbook.portfolioCollectionMemberships
    ).length === 0 ? (
      <span className="text-xs text-[var(--muted-foreground)]">None</span>
    ) : (
      getCollectionLabelsForItem(
        item.id,
        workbook.portfolioCollections,
        workbook.portfolioCollectionMemberships
      ).map((label) => (
        <span
          key={label}
          className="rounded-full bg-[var(--muted)] px-2 py-1 text-xs text-[var(--foreground)]"
        >
          {label}
        </span>
      ))
    )}
  </div>
</Td>
```

Remove direct table editing of `customGroup`.

Render the collection manager between the import/refresh toolbar and the table:

```tsx
<PortfolioCollectionsPanel
  workbook={workbook}
  selectedItemIds={selectedItemIds}
  onChange={onChange}
  onClearSelection={() => setSelectedItemIds([])}
  setUiStatus={setUiStatus}
/>
```

- [ ] **Step 5: Add account fields to add/edit form**

Extend `PortfolioDraft`:

```ts
accountOwner: string;
accountName: string;
accountType: string;
```

Update `createDefaultDraft`:

```ts
accountOwner: "",
accountName: "",
accountType: "",
```

Update `draftToPortfolioItem`:

```ts
accountOwner: optionalString(draft.accountOwner),
accountName: optionalString(draft.accountName),
accountType: optionalString(draft.accountType),
```

Update `portfolioItemToDraft`:

```ts
accountOwner: item.accountOwner ?? "",
accountName: item.accountName ?? "",
accountType: item.accountType ?? "",
```

Add form fields:

```tsx
<Field label="Account Owner">
  <input
    type="text"
    value={draft.accountOwner}
    className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
    onChange={(event) =>
      setDraft((currentDraft) => ({ ...currentDraft, accountOwner: event.target.value }))
    }
  />
</Field>

<Field label="Account Name">
  <input
    type="text"
    value={draft.accountName}
    className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
    onChange={(event) =>
      setDraft((currentDraft) => ({ ...currentDraft, accountName: event.target.value }))
    }
  />
</Field>

<Field label="Account Type">
  <input
    type="text"
    value={draft.accountType}
    className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
    onChange={(event) =>
      setDraft((currentDraft) => ({ ...currentDraft, accountType: event.target.value }))
    }
  />
</Field>
```

Add account display under name/symbol in the table:

```tsx
{item.accountName ? (
  <div className="text-xs text-[var(--muted-foreground)]">
    {[item.accountOwner, item.accountName, item.accountType].filter(Boolean).join(" | ")}
  </div>
) : null}
```

- [ ] **Step 6: Update export calls in PortfolioPanel**

Replace:

```ts
exportPortfolioCsv(workbook.portfolioItems)
```

with:

```ts
exportPortfolioCsv({
  items: workbook.portfolioItems,
  collections: workbook.portfolioCollections,
  memberships: workbook.portfolioCollectionMemberships
})
```

Replace:

```ts
exportPortfolioXlsx(workbook.portfolioItems)
```

with:

```ts
exportPortfolioXlsx({
  items: workbook.portfolioItems,
  collections: workbook.portfolioCollections,
  memberships: workbook.portfolioCollectionMemberships
})
```

Replace the existing `appendImportedItems(result.items, result.errors.map(formatImportError))` flow with an `appendImportedPortfolio(result)` flow so imported collections and memberships are preserved.

Update the implementation to merge imported collections and remap memberships to new item IDs:

```ts
const importedIdToSavedId = new Map<string, string>();
const savedItems = items.map((item) => {
  const savedId = createItemId();
  importedIdToSavedId.set(item.id, savedId);

  return normalizePortfolioItemBalance({
    ...item,
    id: savedId
  });
});

const savedCollections = mergeImportedCollections(
  currentWorkbook.portfolioCollections,
  result.collections
);
const collectionIdMap = mapImportedCollectionIds(
  currentWorkbook.portfolioCollections,
  result.collections,
  savedCollections
);
const savedMemberships = result.memberships
  .map((membership) => ({
    collectionId: collectionIdMap.get(membership.collectionId),
    portfolioItemId: importedIdToSavedId.get(membership.portfolioItemId)
  }))
  .filter(
    (membership): membership is { collectionId: string; portfolioItemId: string } =>
      Boolean(membership.collectionId && membership.portfolioItemId)
  );
```

Implement `mergeImportedCollections` and `mapImportedCollectionIds` near other local helpers in `portfolio-panel.tsx`.

- [ ] **Step 7: Run component tests**

Run:

```bash
npm test -- src/tests/components/portfolio-panel.test.tsx
```

Expected:

```text
PASS src/tests/components/portfolio-panel.test.tsx
```

## Task 5: Workspace Integration And Regression Tests

**Files:**

- Modify: `src/components/planning/phase1-workspace.tsx`
- Modify: `src/tests/components/path-to-fire-panel.test.tsx`
- Modify: `src/tests/storage/phase1-store.test.ts`

- [ ] **Step 1: Ensure loaded workbooks are normalized in workspace state**

In `src/components/planning/phase1-workspace.tsx`, import:

```ts
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
```

Update the load path:

```ts
const normalizedWorkbook = normalizePhase1Workbook(savedWorkbook);
latestWorkbookRef.current = normalizedWorkbook;
readyRef.current = true;
setWorkbook(normalizedWorkbook);
```

Update the `handleWorkbookChange` callback to normalize updates:

```ts
const updatedWorkbook = normalizePhase1Workbook(
  typeof nextWorkbook === "function" ? nextWorkbook(currentWorkbook) : nextWorkbook
);
```

- [ ] **Step 2: Confirm Path to FIRE remains unaffected by collections**

Run:

```bash
npm test -- src/tests/components/path-to-fire-panel.test.tsx src/tests/phase1/fire.test.ts
```

Expected:

```text
PASS src/tests/components/path-to-fire-panel.test.tsx
PASS src/tests/phase1/fire.test.ts
```

- [ ] **Step 3: Confirm storage normalization remains stable**

Run:

```bash
npm test -- src/tests/storage/phase1-store.test.ts
```

Expected:

```text
PASS src/tests/storage/phase1-store.test.ts
```

## Task 6: Documentation Updates

**Files:**

- Modify: `docs/superpowers/specs/2026-06-08-portfolio-collections-design.md`
- Modify: `docs/superpowers/specs/2026-06-08-freedom-path-phase-1-design.md`
- Modify: `docs/product-strategy/founder-codex-interaction-log.md`

- [ ] **Step 1: Update implementation notes after code lands**

In `docs/superpowers/specs/2026-06-08-portfolio-collections-design.md`, append an "Implementation Notes" section:

```md
## Implementation Notes

- Collections are stored in `Phase1Workbook.portfolioCollections`.
- Memberships are stored in `Phase1Workbook.portfolioCollectionMemberships`.
- Portfolio rows can include optional `accountOwner`, `accountName`, and `accountType` metadata.
- CSV/XLSX export writes collection names in a semicolon-separated `collections` column.
- CSV/XLSX import accepts the legacy `custom_group` column and migrates it into collections.
```

- [ ] **Step 2: Update interaction log with execution outcome**

In `docs/product-strategy/founder-codex-interaction-log.md`, add:

```md
### 2026-06-08 - Portfolio Collections Implementation

Founder input:

- Approved the manual collections mockup and asked for an implementation plan.

Codex response / artifact:

- Implemented first-class Portfolio Collections for Phase 1 local-first portfolio analysis.
- Added lightweight account metadata so collections can group holdings across accounts.
- Added import/export support for collections.

Product significance:

- Moves Household FIRE Planner closer to the multi-account FIRE household wedge.
- Replaces plain custom-group tagging with analysis-ready collections.
```

Only add this entry after implementation and verification are complete.

## Task 7: Final Verification

**Files:**

- No source files changed in this task.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- src/tests/phase1/collections.test.ts src/tests/phase1/portfolio.test.ts src/tests/phase1/portfolio-file.test.ts src/tests/components/portfolio-panel.test.tsx src/tests/components/path-to-fire-panel.test.tsx src/tests/storage/phase1-store.test.ts
```

Expected:

```text
PASS src/tests/phase1/collections.test.ts
PASS src/tests/phase1/portfolio.test.ts
PASS src/tests/phase1/portfolio-file.test.ts
PASS src/tests/components/portfolio-panel.test.tsx
PASS src/tests/components/path-to-fire-panel.test.tsx
PASS src/tests/storage/phase1-store.test.ts
```

- [ ] **Step 2: Run lint**

Run:

```bash
npm run lint
```

Expected:

```text
No ESLint errors.
```

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected:

```text
Compiled successfully.
```

- [ ] **Step 4: Browser verification**

Start the dev server:

```bash
npm run dev
```

Open the local app URL shown by Next.js and verify:

- Path to FIRE still loads first.
- Understand Portfolio loads.
- A market holding can be added with account metadata.
- A direct-balance asset can be added with account metadata.
- A collection can be created.
- Rows can be selected and added to a collection.
- Collection labels appear in the portfolio table.
- Collection summary shows total, percent of net worth, percent of FIRE assets, and holding mix.
- Deleting a collection does not delete holdings.
- CSV export includes `collections`.
- Reimporting that CSV restores collection names and memberships.

## Implementation Order

Use this order:

1. Task 1: Types, defaults, and migration.
2. Task 2: Pure collection helpers.
3. Task 3: Import/export.
4. Task 4: Portfolio UI.
5. Task 5: Workspace integration.
6. Task 6: Documentation.
7. Task 7: Final verification.

This order keeps business logic testable before UI work and keeps workbook migration in place before any component depends on new fields.
