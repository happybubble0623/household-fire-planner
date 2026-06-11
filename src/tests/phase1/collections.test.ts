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
    balance: 0
  },
  {
    id: "btc",
    type: "crypto",
    name: "Bitcoin",
    symbol: "BTC-USD.CC",
    accountName: "Coinbase",
    taxBucket: "Taxable",
    includedInFire: true,
    unitPrice: 100_000,
    units: 0.1,
    balance: 0
  },
  {
    id: "mortgage",
    type: "liability",
    name: "Mortgage",
    accountName: "Chase",
    taxBucket: "Other",
    includedInFire: true,
    balance: -2_000
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
    expect(items.map((item) => item.id)).toEqual(["vti", "btc", "mortgage"]);
  });

  it("returns labels for a portfolio item in multiple collections", () => {
    const memberships: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "core", portfolioItemId: "vti" },
      { collectionId: "risk", portfolioItemId: "vti" }
    ];

    expect(getCollectionLabelsForItem("vti", collections, memberships)).toEqual([
      "FIRE Core",
      "High Risk"
    ]);
  });

  it("summarizes positive and negative holdings with percentages and holding mix", () => {
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
      collectionBalance: 8_000,
      percentOfNetWorth: 72.72727272727273,
      percentOfFireAssets: 72.72727272727273,
      holdings: [
        expect.objectContaining({ itemId: "btc", balance: 10_000, mixPercent: 125 }),
        expect.objectContaining({ itemId: "mortgage", balance: -2_000, mixPercent: -25 })
      ]
    });
  });

  it("does not duplicate holdings or balances for duplicate memberships", () => {
    const memberships: Phase1PortfolioCollectionMembership[] = [
      { collectionId: "risk", portfolioItemId: "btc" },
      { collectionId: "risk", portfolioItemId: "btc" },
      { collectionId: "risk", portfolioItemId: "mortgage" },
      { collectionId: "risk", portfolioItemId: "missing" }
    ];

    const riskSummary = summarizePortfolioCollections({
      items,
      collections,
      memberships
    }).find((summary) => summary.collection.id === "risk");

    expect(riskSummary).toMatchObject({
      collectionBalance: 8_000,
      holdings: [
        expect.objectContaining({ itemId: "btc", balance: 10_000 }),
        expect.objectContaining({ itemId: "mortgage", balance: -2_000 })
      ]
    });
    expect(riskSummary?.holdings).toHaveLength(2);
  });

  it("returns zero percentages when denominators are empty or zero", () => {
    const summaries = summarizePortfolioCollections({
      items: [],
      collections,
      memberships: [
        { collectionId: "core", portfolioItemId: "missing" }
      ]
    });

    expect(summaries[0]).toMatchObject({
      collectionBalance: 0,
      percentOfNetWorth: 0,
      percentOfFireAssets: 0,
      holdings: []
    });
    expect(Number.isFinite(summaries[0].percentOfNetWorth)).toBe(true);
    expect(Number.isFinite(summaries[0].percentOfFireAssets)).toBe(true);
  });
});
