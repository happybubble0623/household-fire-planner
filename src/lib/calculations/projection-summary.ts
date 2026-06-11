import type { PlanDocument, SavedPath } from "@/types/plan";
import { addMonths, differenceInCalendarMonths, parseISO } from "date-fns";
import { calculateSimpleFireNumber, toAnnualAmount } from "@/lib/calculations/fire";
import { evaluateCandidateRetirementDate } from "@/lib/calculations/fire";
import { calculateFireAssetValueAsOf } from "@/lib/calculations/net-worth";
import { runMonteCarloProjection } from "@/lib/calculations/monte-carlo";

export type FireEstimateSummary = {
  label: "Simple FIRE Age Estimate" | "Deterministic FIRE Age Estimate" | "Monte Carlo FIRE Age Estimate";
  value: string;
  detail: string;
  date?: string;
  monthsFromCurrentDate?: number;
};

export type SavedPathSummary = {
  pathName: string;
  fireRuleModeLabel: string;
  simpleFireNumber: number;
  simple: FireEstimateSummary;
  deterministic: FireEstimateSummary;
  monteCarlo: FireEstimateSummary;
  disclaimer: string;
};

export async function summarizeSavedPath(
  plan: PlanDocument,
  savedPath: SavedPath,
  options: { currentDate?: string; simulations?: 1000 | 5000 | 10000 } = {}
): Promise<SavedPathSummary> {
  const currentDate = options.currentDate ?? new Date().toISOString().slice(0, 10);
  const annualExpenses = savedPath.expenses
    .filter((expense) => expense.includedInFirePath)
    .reduce((sum, expense) => sum + toAnnualAmount(expense.amount, expense.frequency), 0);
  const annualIncome = savedPath.incomeStreams
    .filter((income) => income.includedInFirePath)
    .reduce((sum, income) => sum + toAnnualAmount(income.amount, income.frequency), 0);
  const simpleFireNumber = calculateSimpleFireNumber(
    annualExpenses,
    annualIncome,
    savedPath.assumptions.withdrawalRate
  );
  const simple = await estimateSimpleFireAge(plan, savedPath, simpleFireNumber, currentDate);
  const deterministic = await estimateDeterministicFireAge(plan, savedPath, currentDate);
  const monteCarloEstimate = await estimateMonteCarloFireAge(
    plan,
    savedPath,
    currentDate,
    options.simulations ?? 1000
  );
  const monteCarlo = await runMonteCarloProjection(plan, savedPath, {
    retirementDate: monteCarloEstimate.date ?? deterministic.date ?? simple.date ?? currentDate,
    simulations: options.simulations ?? 1000,
    successThreshold: 0.9
  });

  return {
    pathName: savedPath.name,
    fireRuleModeLabel:
      savedPath.assumptions.fireRuleMode === "income_only" ||
      savedPath.assumptions.fireRuleMode === "income_stream"
        ? "Estimated Income Stream FIRE Age"
        : "Estimated Withdrawal-Rate FIRE Age",
    simpleFireNumber,
    simple: {
      label: "Simple FIRE Age Estimate",
      value: simple.value,
      date: simple.date,
      monthsFromCurrentDate: simple.monthsFromCurrentDate,
      detail: "When selected FIRE assets reach the annual spending gap divided by withdrawal rate."
    },
    deterministic: {
      label: "Deterministic FIRE Age Estimate",
      value: deterministic.value,
      date: deterministic.date,
      monthsFromCurrentDate: deterministic.monthsFromCurrentDate,
      detail: "Earliest fixed-assumption estimate where the portfolio does not run below zero."
    },
    monteCarlo: {
      label: "Monte Carlo FIRE Age Estimate",
      value: monteCarloEstimate.value,
      date: monteCarloEstimate.date,
      monthsFromCurrentDate: monteCarloEstimate.monthsFromCurrentDate,
      detail: monteCarlo.safeWording
    },
    disclaimer:
      "These estimates are based on the assumptions you entered. They are not a guarantee and are not financial advice."
  };
}

async function estimateSimpleFireAge(
  plan: PlanDocument,
  savedPath: SavedPath,
  simpleFireNumber: number,
  currentDate: string
) {
  let assets = await calculateFireAssetValueAsOf(plan, currentDate);
  const monthlySavings = Math.max(0, savedPath.assumptions.annualSavings / 12);
  const monthlyReturn = Math.pow(1 + estimateAnnualReturn(savedPath), 1 / 12) - 1;
  const horizonDate = getPlanningHorizonDate(plan);
  let cursor = parseISO(`${currentDate}T00:00:00.000Z`);
  const horizon = parseISO(`${horizonDate}T00:00:00.000Z`);

  while (cursor <= horizon) {
    if (assets >= simpleFireNumber) {
      return formatEstimateForDate(plan, currentDate, cursor.toISOString().slice(0, 10));
    }
    assets = (assets + monthlySavings) * (1 + monthlyReturn);
    cursor = addMonths(cursor, 1);
  }

  return {
    value: "Not reached",
    date: undefined,
    monthsFromCurrentDate: undefined
  };
}

async function estimateDeterministicFireAge(
  plan: PlanDocument,
  savedPath: SavedPath,
  currentDate: string
) {
  const horizonDate = getPlanningHorizonDate(plan);
  let cursor = parseISO(`${currentDate}T00:00:00.000Z`);
  const horizon = parseISO(`${horizonDate}T00:00:00.000Z`);

  while (cursor <= horizon) {
    const candidateDate = cursor.toISOString().slice(0, 10);
    const result = await evaluateCandidateRetirementDate(
      plan,
      savedPath,
      candidateDate,
      "deterministic"
    );
    if (result.passes) {
      return formatEstimateForDate(plan, currentDate, candidateDate);
    }
    cursor = addMonths(cursor, 1);
  }

  return {
    value: "Not reached",
    date: undefined,
    monthsFromCurrentDate: undefined
  };
}

async function estimateMonteCarloFireAge(
  plan: PlanDocument,
  savedPath: SavedPath,
  currentDate: string,
  simulations: 1000 | 5000 | 10000
) {
  const horizonDate = getPlanningHorizonDate(plan);
  let cursor = parseISO(`${currentDate}T00:00:00.000Z`);
  const horizon = parseISO(`${horizonDate}T00:00:00.000Z`);

  while (cursor <= horizon) {
    const candidateDate = cursor.toISOString().slice(0, 10);
    const result = await runMonteCarloProjection(plan, savedPath, {
      retirementDate: candidateDate,
      simulations,
      successThreshold: 0.9
    });
    if (result.successRate >= result.successThreshold) {
      return formatEstimateForDate(plan, currentDate, candidateDate);
    }
    cursor = addMonths(cursor, 12);
  }

  return {
    value: "Not reached",
    date: undefined,
    monthsFromCurrentDate: undefined
  };
}

function formatEstimateForDate(plan: PlanDocument, currentDate: string, estimateDate: string) {
  const monthsFromCurrentDate = Math.max(
    0,
    differenceInCalendarMonths(
      parseISO(`${estimateDate}T00:00:00.000Z`),
      parseISO(`${currentDate}T00:00:00.000Z`)
    )
  );
  return {
    value: formatAgeEstimate(calculateAgeOnDate(plan, estimateDate)),
    date: estimateDate,
    monthsFromCurrentDate
  };
}

function calculateAgeOnDate(plan: PlanDocument, date: string) {
  const person = plan.people.find((item) => item.isPrimary) ?? plan.people[0];
  if (!person?.birthDate) {
    return (person?.currentAge ?? 0) + 0;
  }
  return (
    differenceInCalendarMonths(
      parseISO(`${date}T00:00:00.000Z`),
      parseISO(`${person.birthDate}T00:00:00.000Z`)
    ) / 12
  );
}

function getPlanningHorizonDate(plan: PlanDocument) {
  const people = plan.people.length > 0 ? plan.people : [{ birthDate: "1985-01-01", lifeExpectancy: 92 }];
  const horizonDates = people.map((person) => {
    if (!person.birthDate) {
      return `${new Date().getFullYear() + 30}-01-01`;
    }
    const birthYear = Number(person.birthDate.slice(0, 4));
    return `${birthYear + person.lifeExpectancy}-01-01`;
  });
  return horizonDates.sort((a, b) => b.localeCompare(a))[0] ?? "2055-01-01";
}

function estimateAnnualReturn(savedPath: SavedPath) {
  return (
    savedPath.allocation.stockPercent * 0.07 +
    savedPath.allocation.bondEquivalentPercent * 0.035 +
    savedPath.allocation.cashPercent * 0.02
  ) / 100;
}

function formatAgeEstimate(age: number) {
  const years = Math.floor(age);
  const months = Math.max(0, Math.round((age - years) * 12));
  return `${years} years, ${months} months`;
}
