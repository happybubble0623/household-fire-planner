import type { FireRuleMode } from "./plan";
import type { MarketPrice } from "./market-data";

export type NetWorthDrilldown = {
  marketPositions: Array<{
    id: string;
    symbol: string;
    quantity: number;
    price: number;
    priceDate: string;
    priceSource: MarketPrice["source"];
    value: number;
    warning?: string;
  }>;
  cashAccounts: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
  manualAssets: Array<{
    id: string;
    name: string;
    value: number;
  }>;
  liabilities: Array<{
    id: string;
    name: string;
    balance: number;
  }>;
};

export type NetWorthResult = {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  drilldown: NetWorthDrilldown;
};

export type CandidateFireResult = {
  fireRuleMode: FireRuleMode;
  projectionMode: "deterministic" | "monte_carlo";
  passes: boolean;
  candidateRetirementDate: string;
  failureDate?: string;
  endingBalance?: number;
  totalWithdrawals?: number;
  incomeCoverageRatio?: number;
  annualPassiveOrGuaranteedIncome?: number;
  annualExpenses?: number;
};
