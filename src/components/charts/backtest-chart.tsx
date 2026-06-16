"use client";

import { useSyncExternalStore } from "react";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";

export type BacktestChartLine = {
  dataKey: string;
  name: string;
  color: string;
  emphasized?: boolean;
};

type BacktestChartRow = { date: string } & Record<string, number | string>;

type BacktestChartProps = {
  data: BacktestChartRow[];
  lines: BacktestChartLine[];
  // When true (Portfolio tracker "Hide values" toggle), the dollar Y-axis tick
  // labels and the tooltip's dollar readout are masked. The line shapes, dates,
  // and legend are untouched, so the chart still conveys relative performance.
  hideValues?: boolean;
};

export function BacktestChart({ data, lines, hideValues = false }: BacktestChartProps) {
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
        <LineChart
          width={860}
          height={270}
          data={data}
          margin={{ left: 8, right: 8, top: 16, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            minTickGap={32}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            tickFormatter={(value) =>
              hideValues ? "••" : `$${Math.round(Number(value) / 1000)}k`
            }
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
              hideValues ? "••••" : `$${Math.round(Number(value ?? 0)).toLocaleString()}`,
              name
            ]}
            labelFormatter={(value) => `Month: ${value}`}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={line.emphasized ? 2.5 : 1.5}
              dot={false}
              strokeDasharray={line.emphasized ? undefined : "5 3"}
            />
          ))}
        </LineChart>
      </div>
    </div>
  );
}
