"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { NetWorthResult } from "@/types/calculations";

type NetWorthChartProps = {
  data: NetWorthResult[];
};

export function NetWorthChart({ data }: NetWorthChartProps) {
  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!isClient) {
    return (
      <div className="h-72 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm" />
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
      <div className="h-72 min-w-[860px]">
        <AreaChart width={860} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.28} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
            width={56}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(16, 40, 24, 0.12)",
              fontSize: 12,
              fontVariantNumeric: "tabular-nums"
            }}
            labelStyle={{
              color: "var(--muted-foreground)",
              fontWeight: 600,
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.04em"
            }}
            formatter={(value, name) => [
              `$${Math.round(Number(value ?? 0)).toLocaleString()}`,
              name
            ]}
            labelFormatter={(value) => `Date: ${value}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Area
            type="monotone"
            dataKey="netWorth"
            name="Net worth"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
          <Area
            type="monotone"
            dataKey="totalAssets"
            name="Total assets"
            stroke="var(--chart-4)"
            strokeWidth={1.5}
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="totalLiabilities"
            name="Total liabilities"
            stroke="var(--chart-negative)"
            strokeWidth={1.5}
            fill="transparent"
          />
        </AreaChart>
      </div>
    </div>
  );
}
