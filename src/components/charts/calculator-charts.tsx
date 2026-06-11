"use client";

import { useSyncExternalStore } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
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
import type { Phase1ProjectionRow } from "@/types/phase1";

function useIsClient() {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
}

const currency = (value: number) => `$${Math.round(value).toLocaleString()}`;
const kAxis = (value: unknown) => `$${Math.round(Number(value) / 1000)}k`;

const axisTick = { fontSize: 11, fill: "var(--muted-foreground)" };

// Branded tooltip shared by every chart: surface card, tokenized border,
// tabular figures (REDESIGN_SPEC §5).
const brandedTooltip = {
  contentStyle: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(16, 40, 24, 0.12)",
    fontSize: 12,
    fontVariantNumeric: "tabular-nums" as const
  },
  labelStyle: {
    color: "var(--muted-foreground)",
    fontWeight: 600 as const,
    fontSize: 11,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em"
  },
  cursor: { fill: "rgba(21, 128, 61, 0.06)" }
};

const legendStyle = { fontSize: 12 };

function ChartFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm">
      <div className="h-72 min-w-[760px]">{children}</div>
    </div>
  );
}

function ChartPlaceholder() {
  return (
    <div className="h-72 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-sm" />
  );
}

export function MortgageChart({ data }: { data: MortgageScheduleRow[] }) {
  const isClient = useIsClient();
  if (!isClient) {
    return <ChartPlaceholder />;
  }

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="year" tick={axisTick} minTickGap={24} />
        <YAxis yAxisId="left" tick={axisTick} tickFormatter={kAxis} width={52} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={axisTick}
          tickFormatter={kAxis}
          width={52}
        />
        <Tooltip
          {...brandedTooltip}
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Year ${value}`}
        />
        <Legend wrapperStyle={legendStyle} />
        <Bar yAxisId="left" dataKey="principal" name="Principal" stackId="p" fill="var(--chart-1)" />
        <Bar yAxisId="left" dataKey="interest" name="Interest" stackId="p" fill="var(--chart-4)" />
        <Bar
          yAxisId="left"
          dataKey="taxesAndFees"
          name="Taxes & fees"
          stackId="p"
          fill="var(--chart-5)"
          radius={[6, 6, 0, 0]}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="var(--chart-ink)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

// Donut-with-center-number: the canonical mortgage payment-composition pattern
// (REDESIGN_SPEC §5). Purely additive next to the existing result cards.
export function MortgagePaymentDonut({
  principalInterest,
  taxesAndFees,
  monthlyPayment
}: {
  principalInterest: number;
  taxesAndFees: number;
  monthlyPayment: number;
}) {
  const isClient = useIsClient();
  const slices = [
    { name: "Principal & interest", value: Math.max(0, principalInterest), color: "var(--chart-1)" },
    { name: "Taxes, insurance & fees", value: Math.max(0, taxesAndFees), color: "var(--chart-3)" }
  ].filter((slice) => slice.value > 0);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-gray-500">
        Monthly payment breakdown
      </p>
      <div className="mt-2 flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-44 w-44 flex-none">
          {isClient ? (
            <PieChart width={176} height={176}>
              <Pie
                data={slices}
                dataKey="value"
                nameKey="name"
                innerRadius={58}
                outerRadius={80}
                paddingAngle={slices.length > 1 ? 2 : 0}
                strokeWidth={0}
              >
                {slices.map((slice) => (
                  <Cell key={slice.name} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip
                {...brandedTooltip}
                formatter={(value, name) => [currency(Number(value ?? 0)), name]}
              />
            </PieChart>
          ) : null}
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="text-xl font-extrabold tracking-tight text-gray-900 tabular-nums">
                {currency(monthlyPayment)}
              </p>
              <p className="text-[11px] font-medium text-gray-500">per month</p>
            </div>
          </div>
        </div>
        <ul className="w-full space-y-2 text-sm">
          {slices.map((slice) => (
            <li key={slice.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-gray-700">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 flex-none rounded-full"
                  style={{ background: slice.color }}
                />
                {slice.name}
              </span>
              <span className="font-semibold text-gray-900 tabular-nums">
                {currency(slice.value)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
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
    return <ChartPlaceholder />;
  }

  const showTravel = data.some((row) => row.travelPremium > 0);

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <defs>
          <linearGradient id="hc-net-cost-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green-100)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--green-100)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="age" tick={axisTick} minTickGap={24} />
        <YAxis tick={axisTick} tickFormatter={kAxis} width={52} />
        <Tooltip
          {...brandedTooltip}
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Age ${value}`}
        />
        <Legend wrapperStyle={legendStyle} />
        <ReferenceLine
          x={medicareAge}
          stroke="var(--gold)"
          strokeDasharray="4 4"
          strokeWidth={1.5}
          label={{
            value: "Medicare 65",
            position: "top",
            fontSize: 11,
            fontWeight: 600,
            fill: "var(--gold-text)"
          }}
        />
        <Bar dataKey="premium" name="Premiums" stackId="c" fill="var(--chart-4)" />
        <Bar
          dataKey="outOfPocket"
          name="Out-of-pocket"
          stackId="c"
          fill="var(--chart-3)"
          radius={showTravel ? undefined : [6, 6, 0, 0]}
        />
        {showTravel ? (
          <Bar
            dataKey="travelPremium"
            name="Travel / global"
            stackId="c"
            fill="var(--chart-6)"
            radius={[6, 6, 0, 0]}
          />
        ) : null}
        <Area
          type="monotone"
          dataKey="netPortfolioCost"
          name="Net cost (after HSA)"
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill="url(#hc-net-cost-fill)"
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

export function InvestmentChart({ data }: { data: InvestmentScheduleRow[] }) {
  const isClient = useIsClient();
  if (!isClient) {
    return <ChartPlaceholder />;
  }

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <defs>
          <linearGradient id="inv-balance-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--green-100)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="var(--green-100)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="year" tick={axisTick} minTickGap={24} />
        <YAxis tick={axisTick} tickFormatter={kAxis} width={52} />
        <Tooltip
          {...brandedTooltip}
          formatter={(value, name) => [currency(Number(value ?? 0)), name]}
          labelFormatter={(value) => `Year ${value}`}
        />
        <Legend wrapperStyle={legendStyle} />
        <Bar dataKey="contributed" name="Contributions" stackId="b" fill="var(--chart-2)" />
        <Bar
          dataKey="growth"
          name="Investment growth"
          stackId="b"
          fill="var(--chart-1)"
          radius={[6, 6, 0, 0]}
        />
        <Area
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="var(--chart-ink)"
          strokeWidth={2}
          fill="url(#inv-balance-fill)"
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

// Claim-age comparison with the largest benefit highlighted — the
// "highlighted bar + tooltip" pattern from REDESIGN_SPEC §5. Additive next to
// the existing Social Security result cards.
export function ClaimAgeComparisonChart({
  data
}: {
  data: Array<{ label: string; monthly: number }>;
}) {
  const isClient = useIsClient();
  if (!isClient) {
    return <ChartPlaceholder />;
  }

  const best = Math.max(...data.map((row) => row.monthly));

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 24, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} />
        <YAxis tick={axisTick} tickFormatter={(value) => currency(Number(value))} width={68} />
        <Tooltip
          {...brandedTooltip}
          formatter={(value) => [`${currency(Number(value ?? 0))}/mo`, "Estimated benefit"]}
        />
        <Bar dataKey="monthly" name="Monthly benefit" radius={[6, 6, 0, 0]} maxBarSize={96}>
          {data.map((row) => (
            <Cell
              key={row.label}
              fill={row.monthly === best && best > 0 ? "var(--chart-1)" : "var(--green-100)"}
            />
          ))}
        </Bar>
      </ComposedChart>
    </ChartFrame>
  );
}

// Diverging cash-flow chart for the Portfolio Drawdown strategy: savings and
// income up in green, portfolio withdrawals down in the negative tone, with a
// gold FIRE-age milestone (REDESIGN_SPEC §5 + §7).
export function StrategyCashFlowChart({
  rows,
  fireAge
}: {
  rows: Phase1ProjectionRow[];
  fireAge: number | null;
}) {
  const isClient = useIsClient();
  if (!isClient) {
    return <ChartPlaceholder />;
  }

  const data = rows.map((row) => ({
    age: row.age,
    moneyIn: row.annualIncome ?? Math.max(0, row.cashFlow),
    moneyOut: -(row.assetsWithdrawn ?? 0),
    endingAssets: row.endingAssets
  }));

  return (
    <ChartFrame>
      <ComposedChart width={760} height={270} data={data} margin={{ left: 8, right: 8, top: 16, bottom: 8 }}>
        <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
        <XAxis dataKey="age" tick={axisTick} minTickGap={24} />
        <YAxis yAxisId="left" tick={axisTick} tickFormatter={kAxis} width={56} />
        <YAxis
          yAxisId="right"
          orientation="right"
          tick={axisTick}
          tickFormatter={kAxis}
          width={56}
        />
        <Tooltip
          {...brandedTooltip}
          formatter={(value, name) => [currency(Math.abs(Number(value ?? 0))), name]}
          labelFormatter={(value) => `Age ${value}`}
        />
        <Legend wrapperStyle={legendStyle} />
        <ReferenceLine yAxisId="left" y={0} stroke="var(--chart-5)" />
        {fireAge !== null ? (
          <ReferenceLine
            yAxisId="left"
            x={fireAge}
            stroke="var(--gold)"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `FIRE ${fireAge}`,
              position: "top",
              fontSize: 11,
              fontWeight: 600,
              fill: "var(--gold-text)"
            }}
          />
        ) : null}
        <Bar yAxisId="left" dataKey="moneyIn" name="Income / savings in" fill="var(--chart-2)" />
        <Bar
          yAxisId="left"
          dataKey="moneyOut"
          name="Portfolio withdrawals"
          fill="var(--chart-negative)"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="endingAssets"
          name="Ending assets"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
        />
      </ComposedChart>
    </ChartFrame>
  );
}
