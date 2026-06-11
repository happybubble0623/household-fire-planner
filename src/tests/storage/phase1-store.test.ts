import { describe, expect, it } from "vitest";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import type { Phase1Workbook } from "@/types/phase1";

describe("defaultPhase1Workbook", () => {
  it("starts with path-first inputs, no portfolio rows, and empty collections", () => {
    expect(defaultPhase1Workbook.id).toBe("phase1-default");
    expect(defaultPhase1Workbook.schemaVersion).toBe("phase1.7");
    expect(defaultPhase1Workbook.fireInputs.fireRuleMode).toBe("withdrawal_rate");
    expect(defaultPhase1Workbook.fireInputs.passiveIncomeFireAge).toBe(60);
    expect(defaultPhase1Workbook.fireInputs.expectedCashGeneratingReturnPercent).toBe(2);
    expect(defaultPhase1Workbook.fireInputs.expensesInflationAdjusted).toBe(true);
    expect(defaultPhase1Workbook.fireInputs.useExpenseCategoriesOverride).toBe(false);
    expect(defaultPhase1Workbook.fireInputs.expenseCategories).toEqual([]);
    expect(defaultPhase1Workbook.fireInputs.useIncomeSourcesOverride).toBe(false);
    expect(defaultPhase1Workbook.fireInputs.incomeSources).toEqual([]);
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

    expect(normalized.schemaVersion).toBe("phase1.7");
    expect(normalized.fireInputs.expectedCashGeneratingReturnPercent).toBe(2);
    expect(normalized.fireInputs.useExpenseCategoriesOverride).toBe(false);
    expect(normalized.fireInputs.expenseCategories).toEqual([]);
    expect(normalized.portfolioCollections.map((collection) => collection.name)).toEqual([
      "FIRE Core",
      "High Risk"
    ]);
    expect(
      normalized.portfolioCollections.map((collection) => ({
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt
      }))
    ).toEqual([
      {
        createdAt: defaultPhase1Workbook.updatedAt,
        updatedAt: defaultPhase1Workbook.updatedAt
      },
      {
        createdAt: defaultPhase1Workbook.updatedAt,
        updatedAt: defaultPhase1Workbook.updatedAt
      }
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

  it("migrates the old income-only FIRE mode to Income Stream FIRE", () => {
    const olderWorkbook = {
      ...defaultPhase1Workbook,
      schemaVersion: "phase1.4",
      fireInputs: {
        ...defaultPhase1Workbook.fireInputs,
        fireRuleMode: "income_only"
      }
    } as unknown as Phase1Workbook;

    const normalized = normalizePhase1Workbook(olderWorkbook);

    expect(normalized.schemaVersion).toBe("phase1.7");
    expect(normalized.fireInputs.fireRuleMode).toBe("income_stream");
  });

  it("does not create duplicates during repeated normalization", () => {
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
          taxBucket: "Taxable",
          includedInFire: true,
          balance: 3000,
          customGroup: "FIRE Core"
        }
      ]
    } as unknown as Phase1Workbook;

    const normalizedOnce = normalizePhase1Workbook(olderWorkbook);
    const normalizedTwice = normalizePhase1Workbook(normalizedOnce);

    expect(normalizedTwice.portfolioCollections).toEqual(normalizedOnce.portfolioCollections);
    expect(normalizedTwice.portfolioCollectionMemberships).toEqual(
      normalizedOnce.portfolioCollectionMemberships
    );
  });

  it("does not recreate deleted collections from stale custom groups in phase1.2 workbooks", () => {
    const normalizedWorkbook = {
      ...defaultPhase1Workbook,
      schemaVersion: "phase1.2",
      portfolioItems: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          taxBucket: "Taxable",
          includedInFire: true,
          balance: 3000,
          customGroup: "Deleted Collection"
        }
      ],
      portfolioCollections: [],
      portfolioCollectionMemberships: []
    } as unknown as Phase1Workbook;

    const normalized = normalizePhase1Workbook(normalizedWorkbook);

    expect(normalized.portfolioCollections).toEqual([]);
    expect(normalized.portfolioCollectionMemberships).toEqual([]);
  });

  it("reuses existing collection names case-insensitively during legacy migration", () => {
    const olderWorkbook = {
      ...defaultPhase1Workbook,
      schemaVersion: "phase1.1",
      portfolioCollections: [
        {
          id: "collection-existing-core",
          name: "fire core",
          createdAt: "2026-06-01T00:00:00.000Z",
          updatedAt: "2026-06-01T00:00:00.000Z"
        }
      ],
      portfolioCollectionMemberships: [],
      portfolioItems: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          taxBucket: "Taxable",
          includedInFire: true,
          balance: 3000,
          customGroup: "FIRE Core"
        }
      ]
    } as unknown as Phase1Workbook;

    const normalized = normalizePhase1Workbook(olderWorkbook);

    expect(normalized.portfolioCollections).toEqual(olderWorkbook.portfolioCollections);
    expect(normalized.portfolioCollectionMemberships).toEqual([
      {
        collectionId: "collection-existing-core",
        portfolioItemId: "vti"
      }
    ]);
  });

  it("dedupes duplicate memberships", () => {
    const workbook = {
      ...defaultPhase1Workbook,
      portfolioCollections: [
        {
          id: "collection-fire-core-1",
          name: "FIRE Core",
          createdAt: defaultPhase1Workbook.updatedAt,
          updatedAt: defaultPhase1Workbook.updatedAt
        }
      ],
      portfolioCollectionMemberships: [
        {
          collectionId: "collection-fire-core-1",
          portfolioItemId: "vti"
        },
        {
          collectionId: "collection-fire-core-1",
          portfolioItemId: "vti"
        }
      ]
    } satisfies Phase1Workbook;

    const normalized = normalizePhase1Workbook(workbook);

    expect(normalized.portfolioCollectionMemberships).toEqual([
      {
        collectionId: "collection-fire-core-1",
        portfolioItemId: "vti"
      }
    ]);
  });
});
