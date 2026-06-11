import type {
  BalanceSnapshot,
  ManualPriceOverride,
  PlanDocument,
  QuantitySnapshot,
  TaxBucket
} from "@/types/plan";

type AddMarketSnapshotInput = {
  symbol: string;
  quantity: number;
  effectiveDate: string;
  manualPrice?: number;
  priceDate?: string;
  portfolioGroupId?: string;
  taxBucket?: TaxBucket;
  includedInFire?: boolean;
  now?: string;
};

type AddCashSnapshotInput = {
  accountName: string;
  balance: number;
  effectiveDate: string;
  now?: string;
};

export type PortfolioHoldingSummary = {
  symbol: string;
  groupName: string;
  latestQuantity: number;
  latestQuantityDate: string;
  latestPrice: number | null;
  priceDate: string | null;
  currentValue: number;
  includedInFire: boolean;
  timeline: Array<{
    effectiveDate: string;
    quantity: number;
    notes?: string;
  }>;
};

export type PortfolioLabSummary = {
  holdings: PortfolioHoldingSummary[];
  groupTotals: Array<{ groupName: string; value: number }>;
  allocationByGroup: Array<{ groupName: string; percent: number }>;
  combinedInvestableAssets: number;
  lastPriceUpdate: string | null;
};

export function addMarketSnapshotToPlan(
  plan: PlanDocument,
  input: AddMarketSnapshotInput
): PlanDocument {
  const symbol = input.symbol.trim().toUpperCase();
  const now = input.now ?? new Date().toISOString();
  const quantitySnapshot: QuantitySnapshot = {
    id: buildId("quantity", symbol, input.effectiveDate, now),
    effectiveDate: input.effectiveDate,
    quantity: input.quantity,
    source: "manual",
    createdAt: now,
    updatedAt: now
  };
  const price = input.manualPrice ?? 0;
  const priceOverride: ManualPriceOverride | null =
    price > 0
      ? {
          id: buildId("price", symbol, input.priceDate ?? input.effectiveDate, now),
          priceDate: input.priceDate ?? input.effectiveDate,
          price,
          notes: "Manual MVP price",
          createdAt: now
        }
      : null;
  const existing = plan.marketPositions.find((position) => position.symbol === symbol);

  return {
    ...plan,
    updatedAt: now,
    marketPositions: existing
      ? plan.marketPositions.map((position) =>
          position.symbol === symbol
            ? {
                ...position,
                portfolioGroupId: input.portfolioGroupId ?? position.portfolioGroupId,
                taxBucket: input.taxBucket ?? position.taxBucket,
                includedInFire: input.includedInFire ?? position.includedInFire,
                quantitySnapshots: [...position.quantitySnapshots, quantitySnapshot],
                manualPriceOverrides: priceOverride
                  ? [...(position.manualPriceOverrides ?? []), priceOverride]
                  : position.manualPriceOverrides
              }
            : position
        )
      : [
          ...plan.marketPositions,
          {
            id: buildId("position", symbol, input.effectiveDate, now),
            symbol,
            assetType: "stock",
            portfolioGroupId: input.portfolioGroupId ?? plan.portfolioGroups[0]?.id,
            includedInFire: input.includedInFire ?? true,
            taxBucket: input.taxBucket ?? "taxable",
            quantitySnapshots: [quantitySnapshot],
            manualPriceOverrides: priceOverride ? [priceOverride] : []
          }
        ]
  };
}

export function addCashSnapshotToPlan(
  plan: PlanDocument,
  input: AddCashSnapshotInput
): PlanDocument {
  const now = input.now ?? new Date().toISOString();
  const snapshot: BalanceSnapshot = {
    id: buildId("cash", input.accountName, input.effectiveDate, now),
    effectiveDate: input.effectiveDate,
    balance: input.balance,
    createdAt: now,
    updatedAt: now
  };
  const firstCash = plan.cashAccounts[0];

  return {
    ...plan,
    updatedAt: now,
    cashAccounts: firstCash
      ? plan.cashAccounts.map((cash, index) =>
          index === 0
            ? {
                ...cash,
                name: input.accountName,
                balanceSnapshots: [...cash.balanceSnapshots, snapshot]
              }
            : cash
        )
      : [
          {
            id: buildId("cash-account", input.accountName, input.effectiveDate, now),
            name: input.accountName,
            portfolioGroupId: plan.portfolioGroups.find((group) => group.name === "Cash")?.id,
            includedInFire: true,
            taxBucket: "cash",
            balanceSnapshots: [snapshot]
          }
        ]
  };
}

export function summarizePortfolioLab(plan: PlanDocument): PortfolioLabSummary {
  const groupNames = new Map(plan.portfolioGroups.map((group) => [group.id, group.name]));
  const groupTotals = new Map<string, number>();
  const investableGroupTotals = new Map<string, number>();
  let combinedInvestableAssets = 0;
  let lastPriceUpdate: string | null = null;

  const holdings = plan.marketPositions.map((position) => {
    const latestQuantity = latestByDate(position.quantitySnapshots, "effectiveDate");
    const latestPrice = latestByDate(position.manualPriceOverrides ?? [], "priceDate");
    const currentValue = (latestQuantity?.quantity ?? 0) * (latestPrice?.price ?? 0);
    const groupName = groupNames.get(position.portfolioGroupId ?? "") ?? "Ungrouped";

    groupTotals.set(groupName, (groupTotals.get(groupName) ?? 0) + currentValue);
    if (position.includedInFire) {
      combinedInvestableAssets += currentValue;
      investableGroupTotals.set(groupName, (investableGroupTotals.get(groupName) ?? 0) + currentValue);
    }
    if (latestPrice?.createdAt && (!lastPriceUpdate || latestPrice.createdAt > lastPriceUpdate)) {
      lastPriceUpdate = latestPrice.createdAt;
    }

    return {
      symbol: position.symbol,
      groupName,
      latestQuantity: latestQuantity?.quantity ?? 0,
      latestQuantityDate: latestQuantity?.effectiveDate ?? "Missing",
      latestPrice: latestPrice?.price ?? null,
      priceDate: latestPrice?.priceDate ?? null,
      currentValue,
      includedInFire: position.includedInFire,
      timeline: [...position.quantitySnapshots]
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
        .map((snapshot) => ({
          effectiveDate: snapshot.effectiveDate,
          quantity: snapshot.quantity,
          notes: snapshot.notes
        }))
    };
  });

  for (const cash of plan.cashAccounts) {
    const latestBalance = latestByDate(cash.balanceSnapshots, "effectiveDate");
    const value = latestBalance?.balance ?? 0;
    const groupName = groupNames.get(cash.portfolioGroupId ?? "") ?? "Cash";
    groupTotals.set(groupName, (groupTotals.get(groupName) ?? 0) + value);
    if (cash.includedInFire) {
      combinedInvestableAssets += value;
      investableGroupTotals.set(groupName, (investableGroupTotals.get(groupName) ?? 0) + value);
    }
  }

  for (const asset of plan.manualAssets) {
    const latestValuation = latestByDate(asset.valuationSnapshots, "effectiveDate");
    const value = latestValuation?.value ?? 0;
    const groupName = groupNames.get(asset.portfolioGroupId ?? "") ?? "Manual Assets";
    groupTotals.set(groupName, (groupTotals.get(groupName) ?? 0) + value);
    if (asset.includedInFire) {
      combinedInvestableAssets += value;
      investableGroupTotals.set(groupName, (investableGroupTotals.get(groupName) ?? 0) + value);
    }
  }

  const groupTotalRows = [...groupTotals.entries()].map(([groupName, value]) => ({
    groupName,
    value
  }));
  const investableGroupRows = [...investableGroupTotals.entries()].map(([groupName, value]) => ({
    groupName,
    value
  }));

  return {
    holdings,
    groupTotals: groupTotalRows,
    allocationByGroup: investableGroupRows.map((group) => ({
      groupName: group.groupName,
      percent: combinedInvestableAssets > 0 ? (group.value / combinedInvestableAssets) * 100 : 0
    })),
    combinedInvestableAssets,
    lastPriceUpdate
  };
}

function latestByDate<T extends Record<K, string>, K extends keyof T>(
  rows: T[],
  dateKey: K
) {
  return [...rows].sort((a, b) => b[dateKey].localeCompare(a[dateKey]))[0];
}

function buildId(prefix: string, label: string, date: string, now: string) {
  const safeLabel = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${prefix}-${safeLabel}-${date}-${Date.parse(now)}`;
}
