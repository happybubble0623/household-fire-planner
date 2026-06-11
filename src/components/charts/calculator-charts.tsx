"use client";

import { useSyncExternalStore } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type {
  InvestmentScheduleRow,
  MortgageScheduleRow
} from "@/components/planning/planning-tool-panel";
import type { HealthcareYearRow } from "@/lib/calculations/healthcare-cost";

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}

const currency = (value: number) => `$${Math.round(value).toLocaleString()}`;
const kAxis = (value: unknown) => `$${Math.round(Number(value) / 1000)}k`;

function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
      <div className="h-72 min-w-[760px]">{children}</div>
    </div>
  );
}

export function MortgageChart({ data }: { data: MortgageScheduleRow[] }) {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className="h-72 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" />;
  }

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="#eceef1" strokeDasharray="3 3" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickFormatter={kAxis} width={52} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={{ fontSize: 11 }}
          tickFormatter={kAxis}
          width={52}
        />
        <Tooltip
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Year ${value}`}
        />
        <Legend />
        <Bar yAxisId="left" dataKey="principal" name="Principal" stackId="p" fill="#15803d" />
        <Bar yAxisId="left" dataKey="interest" name="Interest" stackId="p" fill="#3f6f9f" />
        <Bar yAxisId="left" dataKey="taxesAndFees" name="Taxes & fees" stackId="p" fill="#a9c5dd" />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="#1f2937"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

export function HealthcareCostChart({
  data,
  medicareAge
}: {
  data: HealthcareYearRow[];
  medicareAge: number;
}) {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className="h-72 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" />;
  }

  const showTravel = data.some((row) => row.travelPremium > 0);

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="#eceef1" strokeDasharray="3 3" />
        <XAxis dataKey="age" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={kAxis} width={52} />
        <Tooltip
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Age ${value}`}
        />
        <Legend />
        <ReferenceLine
          x={medicareAge}
          stroke="#9ca3af"
          strokeDasharray="4 4"
          label={{ value: "Medicare 65", position: "top", fontSize: 11, fill: "#6b7280" }}
        />
        <Bar dataKey="premium" name="Premiums" stackId="c" fill="#3f6f9f" />
        <Bar dataKey="outOfPocket" name="Out-of-pocket" stackId="c" fill="#a9c5dd" />
        {showTravel ? (
          <Bar dataKey="travelPremium" name="Travel / global" stackId="c" fill="#c4b5fd" />
        ) : null}
        <Line
          type="monotone"
          dataKey="netPortfolioCost"
          name="Net cost (after HSA)"
          stroke="#15803d"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

export function InvestmentChart({ data }: { data: InvestmentScheduleRow[] }) {
  const isClient = useIsClient();
  if (!isClient) {
    return <div className="h-72 w-full rounded-2xl border border-gray-200 bg-white p-3 shadow-sm" />;
  }

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="#eceef1" strokeDasharray="3 3" />
        <XAxis dataKey="year" tick={{ fontSize: 11 }} minTickGap={24} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={kAxis} width={52} />
        <Tooltip
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Year ${value}`}
        />
        <Legend />
        <Bar dataKey="contributed" name="Contributions" stackId="b" fill="#a9c5dd" />
        <Bar dataKey="growth" name="Investment growth" stackId="b" fill="#15803d" />
        <Line
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="#1f2937"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}
