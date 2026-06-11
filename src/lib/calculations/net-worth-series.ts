import { addDays, addMonths, addWeeks, parseISO, startOfYear, subMonths, subYears } from "date-fns";
import { calculateNetWorthAsOf } from "@/lib/calculations/net-worth";
import type { NetWorthResult } from "@/types/calculations";
import type { PlanDocument } from "@/types/plan";

export type NetWorthGranularity = "daily" | "weekly" | "monthly";
export type NetWorthChartRange = "1M" | "3M" | "6M" | "YTD" | "1Y" | "3Y" | "5Y" | "All" | "Custom";

export const netWorthChartRangeOptions: NetWorthChartRange[] = [
  "1M",
  "3M",
  "6M",
  "YTD",
  "1Y",
  "3Y",
  "5Y",
  "All",
  "Custom"
];

type ResolveNetWorthRangeOptions = {
  range: NetWorthChartRange;
  endDate: string;
  earliestDate: string;
  customStartDate?: string;
};

export function resolveNetWorthRange({
  range,
  endDate,
  earliestDate,
  customStartDate
}: ResolveNetWorthRangeOptions): {
  startDate: string;
  granularity: NetWorthGranularity;
} {
  const end = parseISO(`${endDate}T00:00:00.000Z`);
  const rangeConfig: Record<NetWorthChartRange, { startDate: string; granularity: NetWorthGranularity }> = {
    "1M": { startDate: toDateString(subMonths(end, 1)), granularity: "daily" },
    "3M": { startDate: toDateString(subMonths(end, 3)), granularity: "daily" },
    "6M": { startDate: toDateString(subMonths(end, 6)), granularity: "weekly" },
    YTD: { startDate: toDateString(startOfYear(end)), granularity: "weekly" },
    "1Y": { startDate: toDateString(subYears(end, 1)), granularity: "weekly" },
    "3Y": { startDate: toDateString(subYears(end, 3)), granularity: "monthly" },
    "5Y": { startDate: toDateString(subYears(end, 5)), granularity: "monthly" },
    All: { startDate: earliestDate, granularity: "monthly" },
    Custom: { startDate: customStartDate || earliestDate, granularity: "weekly" }
  };
  const config = rangeConfig[range];
  const startDate = [config.startDate, earliestDate, endDate].sort()[1];

  return {
    startDate,
    granularity: config.granularity
  };
}

export function getEarliestEffectiveDate(plan: PlanDocument) {
  const dates = [
    ...plan.marketPositions.flatMap((position) =>
      position.quantitySnapshots.map((snapshot) => snapshot.effectiveDate)
    ),
    ...plan.cashAccounts.flatMap((cash) => cash.balanceSnapshots.map((snapshot) => snapshot.effectiveDate)),
    ...plan.manualAssets.flatMap((asset) => asset.valuationSnapshots.map((snapshot) => snapshot.effectiveDate)),
    ...plan.liabilityAccounts.flatMap((liability) => liability.balanceSnapshots.map((snapshot) => snapshot.effectiveDate))
  ].filter(Boolean);

  return dates.sort()[0] ?? plan.createdAt.slice(0, 10);
}

export async function generateNetWorthSeries(
  plan: PlanDocument,
  startDate: string,
  endDate: string,
  granularity: NetWorthGranularity
): Promise<NetWorthResult[]> {
  const results: NetWorthResult[] = [];
  let cursor = parseISO(`${startDate}T00:00:00.000Z`);
  const end = parseISO(`${endDate}T00:00:00.000Z`);

  while (cursor <= end) {
    results.push(await calculateNetWorthAsOf(plan, cursor.toISOString().slice(0, 10)));
    cursor = advanceDate(cursor, granularity);
  }

  if (results.at(-1)?.date !== endDate) {
    results.push(await calculateNetWorthAsOf(plan, endDate));
  }

  return results;
}

function advanceDate(date: Date, granularity: NetWorthGranularity) {
  if (granularity === "daily") return addDays(date, 1);
  if (granularity === "weekly") return addWeeks(date, 1);
  return addMonths(date, 1);
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}
