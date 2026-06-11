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
    return <div className="h-72 w-full rounded-lg border border-[var(--border)] bg-white p-3" />;
  }

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-[var(--border)] bg-white p-3">
      <div className="h-72 min-w-[860px]">
        <AreaChart width={860} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
          <defs>
            <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#136f63" stopOpacity={0.32} />
              <stop offset="95%" stopColor="#136f63" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e4e8df" strokeDasharray="3 3" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => `$${Math.round(Number(value) / 1000)}k`}
            width={56}
          />
          <Tooltip
            formatter={(value, name) => [
              `$${Math.round(Number(value ?? 0)).toLocaleString()}`,
              name
            ]}
            labelFormatter={(value) => `Date: ${value}`}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="netWorth"
            name="Net worth"
            stroke="#136f63"
            strokeWidth={2}
            fill="url(#netWorthFill)"
          />
          <Area
            type="monotone"
            dataKey="totalAssets"
            name="Total assets"
            stroke="#3f6f9f"
            strokeWidth={1.5}
            fill="transparent"
          />
          <Area
            type="monotone"
            dataKey="totalLiabilities"
            name="Total liabilities"
            stroke="#b4443e"
            strokeWidth={1.5}
            fill="transparent"
          />
        </AreaChart>
      </div>
    </div>
  );
}
