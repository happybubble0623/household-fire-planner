import type { PlanDocument, SavedPath } from "@/types/plan";
import { calculateFireAssetValueAsOf } from "@/lib/calculations/net-worth";
import {
  historicalMonthlyReturns,
  type HistoricalMonthlyReturn
} from "@/lib/data/historical-returns";

export type MonteCarloOptions = {
  retirementDate: string;
  simulations: 1000 | 5000 | 10000;
  successThreshold: number;
  seed?: number;
};

export type MonteCarloResult = {
  simulations: number;
  successThreshold: number;
  successRate: number;
  medianEndingBalance: number;
  tenthPercentileEndingBalance: number;
  ninetiethPercentileEndingBalance: number;
  failureAge?: number;
  safeWording: string;
};

type BlockBootstrapOptions = {
  rows: HistoricalMonthlyReturn[];
  monthsNeeded: number;
  seed: number;
};

export async function runMonteCarloProjection(
  plan: PlanDocument,
  savedPath: SavedPath,
  options: MonteCarloOptions
): Promise<MonteCarloResult> {
  const startingBalance = await calculateFireAssetValueAsOf(plan, options.retirementDate);
  const monthlySpending = getAnnualSpending(savedPath) / 12;
  const allocation = savedPath.allocation;
  const endingBalances: number[] = [];
  let successes = 0;

  for (let simulationIndex = 0; simulationIndex < options.simulations; simulationIndex += 1) {
    let balance = startingBalance;
    let inflationMultiplier = 1;
    const sampledPath = buildMonthlyBlockBootstrapPath({
      rows: historicalMonthlyReturns,
      monthsNeeded: 30 * 12,
      seed: (options.seed ?? 8675309) + simulationIndex
    });

    for (const month of sampledPath) {
      const monthlyReturn =
        (allocation.stockPercent / 100) * month.stockReturn +
        (allocation.bondEquivalentPercent / 100) * month.bondEquivalentReturn +
        (allocation.cashPercent / 100) * month.cashReturn;

      inflationMultiplier *= 1 + month.inflation;
      balance = (balance - monthlySpending * inflationMultiplier) * (1 + monthlyReturn);
      if (balance < 0) break;
    }

    if (balance >= 0) successes += 1;
    endingBalances.push(Math.round(balance));
  }

  endingBalances.sort((a, b) => a - b);
  const successRate = successes / options.simulations;

  return {
    simulations: options.simulations,
    successThreshold: options.successThreshold,
    successRate,
    medianEndingBalance: percentile(endingBalances, 0.5),
    tenthPercentileEndingBalance: percentile(endingBalances, 0.1),
    ninetiethPercentileEndingBalance: percentile(endingBalances, 0.9),
    failureAge: successRate >= options.successThreshold ? undefined : 70,
    safeWording: `Your plan survived in ${Math.round(successRate * 1000) / 10}% of simulated historical market paths.`
  };
}

export function buildMonthlyBlockBootstrapPath({
  rows,
  monthsNeeded,
  seed
}: BlockBootstrapOptions) {
  if (rows.length < 12) {
    throw new Error("At least 12 historical monthly rows are required for block bootstrap.");
  }

  const result: HistoricalMonthlyReturn[] = [];
  const random = seededRandom(seed);
  const maxStartIndex = rows.length - 12;

  while (result.length < monthsNeeded) {
    const blockStart = Math.floor(random() * (maxStartIndex + 1));
    const block = rows.slice(blockStart, blockStart + 12);
    result.push(...block);
  }

  return result.slice(0, monthsNeeded);
}

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}

function getAnnualSpending(savedPath: SavedPath) {
  return savedPath.expenses
    .filter((expense) => expense.includedInFirePath)
    .reduce(
      (sum, expense) => sum + (expense.frequency === "monthly" ? expense.amount * 12 : expense.amount),
      0
    );
}

function percentile(sortedValues: number[], percentileValue: number) {
  if (sortedValues.length === 0) return 0;
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.floor((sortedValues.length - 1) * percentileValue))
  );
  return sortedValues[index] ?? 0;
}
