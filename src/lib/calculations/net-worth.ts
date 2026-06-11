import type {
  BalanceSnapshot,
  PlanDocument,
  QuantitySnapshot,
  ValuationSnapshot
} from "@/types/plan";
import type { NetWorthResult } from "@/types/calculations";
import { getMarketPriceOnOrBefore } from "@/lib/market-data/prices";

type EffectiveDatedSnapshot = QuantitySnapshot | BalanceSnapshot | ValuationSnapshot;

export function getLatestSnapshotOnOrBefore<T extends Pick<EffectiveDatedSnapshot, "effectiveDate">>(
  snapshots: T[],
  targetDate: string
): T | null {
  return (
    snapshots
      .filter((snapshot) => snapshot.effectiveDate <= targetDate)
      .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate))[0] ?? null
  );
}

export async function calculateNetWorthAsOf(
  plan: PlanDocument,
  date: string
): Promise<NetWorthResult> {
  let totalAssets = 0;
  let totalLiabilities = 0;

  const drilldown: NetWorthResult["drilldown"] = {
    marketPositions: [],
    cashAccounts: [],
    manualAssets: [],
    liabilities: []
  };

  for (const position of plan.marketPositions) {
    const quantitySnapshot = getLatestSnapshotOnOrBefore(position.quantitySnapshots, date);
    if (!quantitySnapshot) continue;

    const price = await getMarketPriceOnOrBefore(
      position.symbol,
      date,
      position.manualPriceOverrides
    );
    const value = quantitySnapshot.quantity * price.closePrice;
    totalAssets += value;
    drilldown.marketPositions.push({
      id: position.id,
      symbol: position.symbol,
      quantity: quantitySnapshot.quantity,
      price: price.closePrice,
      priceDate: price.priceDate,
      priceSource: price.source,
      value,
      warning: price.warning
    });
  }

  for (const cash of plan.cashAccounts) {
    const balanceSnapshot = getLatestSnapshotOnOrBefore(cash.balanceSnapshots, date);
    if (!balanceSnapshot) continue;

    totalAssets += balanceSnapshot.balance;
    drilldown.cashAccounts.push({
      id: cash.id,
      name: cash.name,
      balance: balanceSnapshot.balance
    });
  }

  for (const asset of plan.manualAssets) {
    const valuationSnapshot = getLatestSnapshotOnOrBefore(asset.valuationSnapshots, date);
    if (!valuationSnapshot) continue;

    totalAssets += valuationSnapshot.value;
    drilldown.manualAssets.push({
      id: asset.id,
      name: asset.name,
      value: valuationSnapshot.value
    });
  }

  for (const liability of plan.liabilityAccounts) {
    if (!liability.includedInNetWorth) continue;

    const balanceSnapshot = getLatestSnapshotOnOrBefore(liability.balanceSnapshots, date);
    if (!balanceSnapshot) continue;

    totalLiabilities += balanceSnapshot.balance;
    drilldown.liabilities.push({
      id: liability.id,
      name: liability.name,
      balance: balanceSnapshot.balance
    });
  }

  return {
    date,
    totalAssets,
    totalLiabilities,
    netWorth: totalAssets - totalLiabilities,
    drilldown
  };
}

export async function calculateFireAssetValueAsOf(plan: PlanDocument, date: string) {
  let total = 0;

  for (const position of plan.marketPositions) {
    if (!position.includedInFire) continue;
    const snapshot = getLatestSnapshotOnOrBefore(position.quantitySnapshots, date);
    if (!snapshot) continue;
    const price = await getMarketPriceOnOrBefore(position.symbol, date, position.manualPriceOverrides);
    total += snapshot.quantity * price.closePrice;
  }

  for (const cash of plan.cashAccounts) {
    if (!cash.includedInFire) continue;
    const snapshot = getLatestSnapshotOnOrBefore(cash.balanceSnapshots, date);
    if (!snapshot) continue;
    total += snapshot.balance;
  }

  for (const asset of plan.manualAssets) {
    if (!asset.includedInFire) continue;
    const snapshot = getLatestSnapshotOnOrBefore(asset.valuationSnapshots, date);
    if (!snapshot) continue;
    total += snapshot.value;
  }

  return total;
}
