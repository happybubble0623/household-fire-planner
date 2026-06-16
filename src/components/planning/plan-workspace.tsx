"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Play, Save, Upload } from "lucide-react";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { estimateSocialSecurityBenefit } from "@/lib/calculations/social-security";
import { evaluateCandidateRetirementDate, getConservativeAllocationWarning } from "@/lib/calculations/fire";
import {
  generateNetWorthSeries,
  getEarliestEffectiveDate,
  netWorthChartRangeOptions,
  resolveNetWorthRange,
  type NetWorthChartRange
} from "@/lib/calculations/net-worth-series";
import { calculateNetWorthAsOf } from "@/lib/calculations/net-worth";
import { runMonteCarloProjection } from "@/lib/calculations/monte-carlo";
import { summarizeSavedPath, type SavedPathSummary } from "@/lib/calculations/projection-summary";
import { samplePlan } from "@/lib/data/sample-plan";
import { ensureSamplePlan, saveLocalPlan } from "@/lib/storage/local-store";
import { importPlanFromJson, serializePlanForExport } from "@/lib/storage/plan-io";
import { deleteCloudPlan, loadLatestCloudPlan, saveCloudPlan } from "@/lib/storage/supabase-sync";
import { applyFetchedPricesToPlan } from "@/lib/market-data/prices";
import {
  addCashSnapshotToPlan,
  addMarketSnapshotToPlan,
  summarizePortfolioLab
} from "@/lib/planning/portfolio-lab-actions";
import type {
  FireRuleMode,
  PlanDocument,
  RecurringExpense,
  RetirementIncomeStream,
  SavedPath,
  TimingRule
} from "@/types/plan";
import type { FetchedMarketPrice } from "@/types/market-data";
import type { NetWorthResult } from "@/types/calculations";

export type PlanWorkspaceSection =
  | "freedom-map"
  | "portfolio-lab"
  | "fire-path"
  | "saved-paths"
  | "path-comparison"
  | "family-plan"
  | "social-security-guide"
  | "wealth-records"
  | "settings"
  | "roadmap";

const sectionTitles: Record<PlanWorkspaceSection, string> = {
  "freedom-map": "Freedom Map",
  "portfolio-lab": "Portfolio Lab",
  "fire-path": "FIRE Path",
  "saved-paths": "Saved Paths",
  "path-comparison": "Path Comparison",
  "family-plan": "Family Plan",
  "social-security-guide": "Social Security Guide",
  "wealth-records": "Wealth Records",
  settings: "Settings",
  roadmap: "Roadmap"
};

type PlanWorkspaceProps = {
  section: PlanWorkspaceSection;
};

export function PlanWorkspace({ section }: PlanWorkspaceProps) {
  const [plan, setPlan] = useState<PlanDocument>(samplePlan);
  const [selectedDate, setSelectedDate] = useState("2025-12-31");
  const [chartRange, setChartRange] = useState<NetWorthChartRange>("1Y");
  const [customStartDate, setCustomStartDate] = useState("2024-06-01");
  const [selectedPathId, setSelectedPathId] = useState(samplePlan.settings.defaultSavedPathId ?? samplePlan.savedPaths[0].id);
  const [series, setSeries] = useState<NetWorthResult[]>([]);
  const [drilldown, setDrilldown] = useState<NetWorthResult | null>(null);
  const [summary, setSummary] = useState<SavedPathSummary | null>(null);
  const [comparison, setComparison] = useState<SavedPathSummary[]>([]);
  const [status, setStatus] = useState("Guest mode is active.");
  const [localPlanReady, setLocalPlanReady] = useState(false);
  const [monteCarloStatus, setMonteCarloStatus] = useState("Monte Carlo has not been run in this session.");

  const selectedPath = useMemo(
    () => plan.savedPaths.find((path) => path.id === selectedPathId) ?? plan.savedPaths[0],
    [plan.savedPaths, selectedPathId]
  );
  const chartRangeConfig = useMemo(
    () =>
      resolveNetWorthRange({
        range: chartRange,
        endDate: selectedDate,
        earliestDate: getEarliestEffectiveDate(plan),
        customStartDate
      }),
    [chartRange, customStartDate, plan, selectedDate]
  );

  useEffect(() => {
    let active = true;
    ensureSamplePlan()
      .then((storedPlan) => {
        if (!active) return;
        setPlan(storedPlan);
        setSelectedPathId(storedPlan.settings.defaultSavedPathId ?? storedPlan.savedPaths[0]?.id ?? "path-base");
        setCustomStartDate(getEarliestEffectiveDate(storedPlan));
        setLocalPlanReady(true);
      })
      .catch(() => {
        setStatus("IndexedDB was not available. The sample plan is running in memory.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!localPlanReady) return;

    const timeout = window.setTimeout(() => {
      saveLocalPlan(plan)
        .then(() => {
          setStatus("Changes autosaved locally in IndexedDB.");
        })
        .catch(() => {
          setStatus("Autosave could not access IndexedDB. Export JSON if you want a backup.");
        });
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [localPlanReady, plan]);

  useEffect(() => {
    let active = true;
    async function refresh() {
      const nextSeries = await generateNetWorthSeries(plan, chartRangeConfig.startDate, selectedDate, chartRangeConfig.granularity);
      const nextDrilldown = await calculateNetWorthAsOf(plan, selectedDate);
      const nextSummary = selectedPath ? await summarizeSavedPath(plan, selectedPath) : null;
      const nextComparison = await Promise.all(
        plan.savedPaths.filter((path) => !path.isArchived).map((path) => summarizeSavedPath(plan, path))
      );

      if (!active) return;
      setSeries(nextSeries);
      setDrilldown(nextDrilldown);
      setSummary(nextSummary);
      setComparison(nextComparison);
    }

    refresh();
    return () => {
      active = false;
    };
  }, [chartRangeConfig, plan, selectedDate, selectedPath]);

  function updatePlan(mutator: (draft: PlanDocument) => PlanDocument) {
    setPlan((current) => mutator(current));
  }

  function updateSelectedPath(mutator: (path: SavedPath) => SavedPath) {
    updatePlan((current) => ({
      ...current,
      updatedAt: new Date().toISOString(),
      savedPaths: current.savedPaths.map((path) => (path.id === selectedPath.id ? mutator(path) : path))
    }));
  }

  async function handleSaveLocal() {
    const saved = await saveLocalPlan(plan);
    setPlan(saved);
    setStatus("Saved locally in IndexedDB.");
  }

  async function handleSaveCloud() {
    try {
      await saveCloudPlan(plan);
      setStatus("Cloud save completed.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud save is not available.");
    }
  }

  async function handleLoadCloud() {
    try {
      const cloudPlan = await loadLatestCloudPlan();
      if (!cloudPlan) {
        setStatus("No cloud plans were found for this account.");
        return;
      }
      setPlan(cloudPlan);
      setSelectedPathId(cloudPlan.settings.defaultSavedPathId ?? cloudPlan.savedPaths[0]?.id ?? "");
      setStatus("Loaded latest cloud plan.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud load is not available.");
    }
  }

  async function handleDeleteCloud() {
    const confirmed = window.confirm("Delete this plan from cloud storage? Your local guest copy stays on this device.");
    if (!confirmed) return;

    try {
      await deleteCloudPlan(plan.id);
      setStatus("Cloud copy deleted. Your local plan is still available.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Cloud delete is not available.");
    }
  }

  function handleExport() {
    const blob = new Blob([serializePlanForExport(plan)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${plan.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatus("Plan JSON exported.");
  }

  async function handleImport(file: File | null) {
    if (!file) return;
    const text = await file.text();
    const imported = importPlanFromJson(text);
    setPlan(imported);
    setSelectedPathId(imported.settings.defaultSavedPathId ?? imported.savedPaths[0]?.id ?? "");
    setStatus("Plan JSON imported.");
  }

  return (
    <div className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-[var(--border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--primary)]">Plan My FIRE</p>
            <h1 className="mt-1 text-3xl font-semibold">{sectionTitles[section]}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted-foreground)]">
              Plan My FIRE provides planning estimates only. It is not investment, tax, legal, or financial advice.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white" onClick={handleSaveLocal}>
              <Save size={16} aria-hidden="true" />
              Save Local
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold" onClick={handleExport}>
              <Download size={16} aria-hidden="true" />
              Export
            </button>
          </div>
        </header>

        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-lg border border-[#d8c6a0] bg-[#fff8eb] p-3 text-sm leading-6 text-[#76531c]">
            Guest plans are saved on this device. Export a backup if you want to protect against browser data loss or move your plan to another device.
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--muted-foreground)]">
            {status}
          </div>
        </div>

        {section === "freedom-map" && (
          <FreedomMapSection
            plan={plan}
            series={series}
            drilldown={drilldown}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            chartRange={chartRange}
            setChartRange={setChartRange}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            chartStartDate={chartRangeConfig.startDate}
          />
        )}
        {section === "portfolio-lab" && <PortfolioLabSection plan={plan} updatePlan={updatePlan} setStatus={setStatus} />}
        {section === "fire-path" && (
          <div className="grid gap-5">
            <FirePathSection
              plan={plan}
              selectedPath={selectedPath}
              selectedPathId={selectedPathId}
              setSelectedPathId={setSelectedPathId}
              updateSelectedPath={updateSelectedPath}
              summary={summary}
              setStatus={setStatus}
              monteCarloStatus={monteCarloStatus}
              setMonteCarloStatus={setMonteCarloStatus}
            />
            <SavedPathsSection plan={plan} updatePlan={updatePlan} selectedPathId={selectedPathId} setSelectedPathId={setSelectedPathId} />
            <PathComparisonSection comparison={comparison} />
            <FamilyPlanSection plan={plan} updatePlan={updatePlan} />
            <SocialSecuritySection selectedPath={selectedPath} updateSelectedPath={updateSelectedPath} />
          </div>
        )}
        {section === "saved-paths" && <SavedPathsSection plan={plan} updatePlan={updatePlan} selectedPathId={selectedPathId} setSelectedPathId={setSelectedPathId} />}
        {section === "path-comparison" && <PathComparisonSection comparison={comparison} />}
        {section === "family-plan" && <FamilyPlanSection plan={plan} updatePlan={updatePlan} />}
        {section === "social-security-guide" && <SocialSecuritySection selectedPath={selectedPath} updateSelectedPath={updateSelectedPath} />}
        {section === "wealth-records" && <WealthRecordsSection plan={plan} />}
        {section === "settings" && (
          <SettingsSection
            plan={plan}
            handleImport={handleImport}
            handleExport={handleExport}
            handleSaveLocal={handleSaveLocal}
            handleSaveCloud={handleSaveCloud}
            handleLoadCloud={handleLoadCloud}
            handleDeleteCloud={handleDeleteCloud}
          />
        )}
        {section === "roadmap" && <RoadmapSection />}
      </div>
    </div>
  );
}

function FreedomMapSection({
  series,
  drilldown,
  selectedDate,
  setSelectedDate,
  chartRange,
  setChartRange,
  customStartDate,
  setCustomStartDate,
  chartStartDate
}: {
  plan: PlanDocument;
  series: NetWorthResult[];
  drilldown: NetWorthResult | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  chartRange: NetWorthChartRange;
  setChartRange: (range: NetWorthChartRange) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  chartStartDate: string;
}) {
  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Net worth on selected date" value={formatCurrency(drilldown?.netWorth ?? 0)} />
        <Metric label="Total assets" value={formatCurrency(drilldown?.totalAssets ?? 0)} />
        <Metric label="Total liabilities" value={formatCurrency(drilldown?.totalLiabilities ?? 0)} />
      </div>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="mb-4 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Historical Net Worth</h2>
            <label className="flex items-center gap-2 text-sm">
              Drilldown date
              <input className="rounded-lg border border-[var(--border)] px-3 py-2" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {netWorthChartRangeOptions.map((range) => (
              <button
                key={range}
                className={`h-9 rounded-lg border px-3 text-sm font-semibold ${
                  chartRange === range
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white"
                }`}
                type="button"
                aria-pressed={chartRange === range}
                onClick={() => setChartRange(range)}
              >
                {range}
              </button>
            ))}
            {chartRange === "Custom" && (
              <label className="flex items-center gap-2 text-sm">
                Start
                <input
                  className="h-9 rounded-lg border border-[var(--border)] px-3"
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                />
              </label>
            )}
          </div>
          <p className="text-xs text-[var(--muted-foreground)]">Showing history from {chartStartDate} through {selectedDate}.</p>
        </div>
        <NetWorthChart data={series} />
      </section>
      {drilldown && <DrilldownPanel drilldown={drilldown} />}
    </div>
  );
}

function PortfolioLabSection({
  plan,
  updatePlan,
  setStatus
}: {
  plan: PlanDocument;
  updatePlan: (mutator: (draft: PlanDocument) => PlanDocument) => void;
  setStatus: (status: string) => void;
}) {
  const portfolioSummary = summarizePortfolioLab(plan);

  function addMarketSnapshot(formData: FormData) {
    const symbol = String(formData.get("symbol") ?? "").toUpperCase();
    const quantity = Number(formData.get("quantity"));
    const effectiveDate = String(formData.get("effectiveDate"));
    const price = Number(formData.get("price"));
    const priceDate = String(formData.get("priceDate") || effectiveDate);
    if (!symbol || Number.isNaN(quantity) || !effectiveDate) return;

    updatePlan((current) =>
      addMarketSnapshotToPlan(current, {
        symbol,
        quantity,
        effectiveDate,
        manualPrice: price,
        priceDate,
        portfolioGroupId: String(formData.get("portfolioGroupId") || current.portfolioGroups[0]?.id || ""),
        taxBucket: String(formData.get("taxBucket") || "taxable") as "taxable" | "tax_deferred" | "tax_free" | "cash" | "real_estate" | "custom",
        includedInFire: String(formData.get("includedInFire") || "true") === "true"
      })
    );
    setStatus(`This update affects your net-worth history from ${effectiveDate} forward.`);
  }

  function addCashSnapshot(formData: FormData) {
    const balance = Number(formData.get("balance"));
    const effectiveDate = String(formData.get("effectiveDate"));
    const accountName = String(formData.get("name") || "Cash Account");
    if (Number.isNaN(balance) || !effectiveDate) return;

    updatePlan((current) =>
      addCashSnapshotToPlan(current, {
        accountName,
        balance,
        effectiveDate
      })
    );
    setStatus(`This update affects your net-worth history from ${effectiveDate} forward.`);
  }

  function addManualAssetSnapshot(formData: FormData) {
    const value = Number(formData.get("value"));
    const effectiveDate = String(formData.get("effectiveDate"));
    const name = String(formData.get("name") || "Manual Asset");
    if (Number.isNaN(value) || !effectiveDate) return;

    updatePlan((current) => ({
      ...current,
      manualAssets: [
        ...current.manualAssets,
        {
          id: createId("asset"),
          name,
          assetType: "other",
          includedInFire: false,
          valuationSnapshots: [
            {
              id: createId("valuation"),
              effectiveDate,
              value,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      updatedAt: new Date().toISOString()
    }));
    setStatus(`This update affects your net-worth history from ${effectiveDate} forward.`);
  }

  function addLiabilitySnapshot(formData: FormData) {
    const balance = Number(formData.get("balance"));
    const effectiveDate = String(formData.get("effectiveDate"));
    const name = String(formData.get("name") || "Liability");
    if (Number.isNaN(balance) || !effectiveDate) return;

    updatePlan((current) => ({
      ...current,
      liabilityAccounts: [
        ...current.liabilityAccounts,
        {
          id: createId("liability"),
          name,
          liabilityType: "other",
          includedInNetWorth: true,
          balanceSnapshots: [
            {
              id: createId("liability-balance"),
              effectiveDate,
              balance,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ]
        }
      ],
      updatedAt: new Date().toISOString()
    }));
    setStatus(`This update affects your net-worth history from ${effectiveDate} forward.`);
  }

  async function refreshPrices() {
    const symbols = plan.marketPositions.map((position) => position.symbol).join(",");
    // Live prices need a connection. Offline (native shell with no network, or a
    // failed request) degrades to a clear notice instead of a broken screen — the
    // service worker returns a 503 {offline:true} for /api/* when offline.
    let response: Response;
    try {
      response = await fetch(`/api/prices?symbols=${encodeURIComponent(symbols)}`);
    } catch {
      setStatus("You're offline — reconnect to refresh prices.");
      return;
    }
    const payload = (await response.json().catch(() => ({}))) as {
      prices?: FetchedMarketPrice[];
      warning?: string;
      offline?: boolean;
    };
    if (payload.offline || !response.ok) {
      setStatus("You're offline — reconnect to refresh prices.");
      return;
    }
    const fetchedPrices = payload.prices ?? [];
    const usablePrices = fetchedPrices.filter((price) => price.closePrice !== null).length;

    if (usablePrices > 0) {
      updatePlan((current) => applyFetchedPricesToPlan(current, fetchedPrices));
    }

    setStatus(
      usablePrices > 0
        ? `Applied ${usablePrices} EOD price record${usablePrices === 1 ? "" : "s"}. ${payload.warning ?? ""}`.trim()
        : payload.warning ?? "Could not fetch latest price. Enter a manual price or try again later."
    );
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-3">
        <Metric label="Combined investable assets" value={formatCurrency(portfolioSummary.combinedInvestableAssets)} />
        <Metric label="Tracked holdings" value={String(portfolioSummary.holdings.length)} />
        <Metric label="Last price update" value={portfolioSummary.lastPriceUpdate ? formatDateTime(portfolioSummary.lastPriceUpdate) : "Manual price needed"} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Holdings by Portfolio Group</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-[var(--muted-foreground)]">
              <tr>
                <th className="py-2">Symbol</th>
                <th>Latest quantity</th>
                <th>Latest price</th>
                <th>Price date</th>
                <th>Include in FIRE</th>
              </tr>
            </thead>
            <tbody>
              {portfolioSummary.holdings.map((holding) => {
                return (
                  <tr key={holding.symbol} className="border-t border-[var(--border)]">
                    <td className="py-3 font-semibold">{holding.symbol}</td>
                    <td>{holding.latestQuantity}</td>
                    <td>{holding.latestPrice ? formatCurrency(holding.latestPrice) : "Manual price needed"}</td>
                    <td>{holding.priceDate ?? "Missing"}</td>
                    <td>{holding.includedInFire ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <RecordList
            title="Total Value by Group"
            items={portfolioSummary.groupTotals.map((group) => `${group.groupName}: ${formatCurrency(group.value)}`)}
          />
          <RecordList
            title="Investable Allocation by Group"
            items={portfolioSummary.allocationByGroup.map((group) => `${group.groupName}: ${formatPercent(group.percent / 100)}`)}
          />
        </div>
        <div className="mt-5 grid gap-3">
          {portfolioSummary.holdings.map((holding) => (
            <RecordList
              key={`${holding.symbol}-timeline`}
              title={`${holding.symbol} Quantity Timeline`}
              items={holding.timeline.map((item) => `${item.effectiveDate}: ${item.quantity} shares${item.notes ? ` (${item.notes})` : ""}`)}
            />
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values.
        </p>
        <button className="mt-4 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={refreshPrices}>
          Refresh EOD Prices
        </button>
      </section>

      <section className="grid gap-4">
        <FormPanel title="Add Stock Holding Snapshot" onSubmit={addMarketSnapshot}>
          <Input name="symbol" label="Ticker" defaultValue="AAPL" />
          <Input name="quantity" label="Quantity" type="number" defaultValue="50" />
          <Input name="effectiveDate" label="Effective date" type="date" defaultValue="2025-06-01" />
          <Input name="price" label="Manual price" type="number" defaultValue="210" />
          <Input name="priceDate" label="Price date" type="date" defaultValue="2025-12-31" />
          <label className="grid gap-1 text-sm font-medium">
            Portfolio group
            <select className="rounded-lg border border-[var(--border)] px-3 py-2" name="portfolioGroupId" defaultValue={plan.portfolioGroups[0]?.id}>
              {plan.portfolioGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <Select name="taxBucket" label="Tax bucket" options={["taxable", "tax_deferred", "tax_free", "custom"]} />
          <Select name="includedInFire" label="Include in FIRE" options={["true", "false"]} />
        </FormPanel>
        <FormPanel title="Add Cash Balance Snapshot" onSubmit={addCashSnapshot}>
          <Input name="name" label="Account name" defaultValue="Emergency Cash" />
          <Input name="balance" label="Balance" type="number" defaultValue="42000" />
          <Input name="effectiveDate" label="Effective date" type="date" defaultValue="2025-06-01" />
        </FormPanel>
        <FormPanel title="Add Manual Asset Valuation" onSubmit={addManualAssetSnapshot}>
          <Input name="name" label="Asset name" defaultValue="Vehicle" />
          <Input name="value" label="Value" type="number" defaultValue="22000" />
          <Input name="effectiveDate" label="Effective date" type="date" defaultValue="2025-12-31" />
        </FormPanel>
        <FormPanel title="Add Liability Balance" onSubmit={addLiabilitySnapshot}>
          <Input name="name" label="Liability name" defaultValue="Auto Loan" />
          <Input name="balance" label="Balance" type="number" defaultValue="12000" />
          <Input name="effectiveDate" label="Effective date" type="date" defaultValue="2025-12-31" />
        </FormPanel>
      </section>
      </div>
    </div>
  );
}

function FirePathSection({
  plan,
  selectedPath,
  selectedPathId,
  setSelectedPathId,
  updateSelectedPath,
  summary,
  setStatus,
  monteCarloStatus,
  setMonteCarloStatus
}: {
  plan: PlanDocument;
  selectedPath: SavedPath;
  selectedPathId: string;
  setSelectedPathId: (id: string) => void;
  updateSelectedPath: (mutator: (path: SavedPath) => SavedPath) => void;
  summary: SavedPathSummary | null;
  setStatus: (status: string) => void;
  monteCarloStatus: string;
  setMonteCarloStatus: (status: string) => void;
}) {
  const warning = getConservativeAllocationWarning(selectedPath.allocation);
  const [monteCarloSimulations, setMonteCarloSimulations] = useState<1000 | 5000 | 10000>(5000);
  const [monteCarloThreshold, setMonteCarloThreshold] = useState(0.9);

  async function runProjection() {
    const result = await evaluateCandidateRetirementDate(plan, selectedPath, "2048-01-01", "deterministic");
    setStatus(
      result.passes
        ? "Projection run complete. This is a planning estimate, not a recommendation."
        : `Projection run complete. First failure date: ${result.failureDate}.`
    );
  }

  async function runMonteCarlo() {
    const result = await runMonteCarloProjection(plan, selectedPath, {
      retirementDate: selectedPath.assumptions.retirementDate ?? "2048-01-01",
      simulations: monteCarloSimulations,
      successThreshold: monteCarloThreshold,
      seed: 20260607
    });
    setMonteCarloStatus(
      `${result.safeWording} Median ending balance: ${formatCurrency(
        result.medianEndingBalance
      )}. 10th percentile: ${formatCurrency(
        result.tenthPercentileEndingBalance
      )}. 90th percentile: ${formatCurrency(result.ninetiethPercentileEndingBalance)}.`
    );
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <label className="grid gap-2 text-sm font-medium">
            Saved Path
            <select className="rounded-lg border border-[var(--border)] px-3 py-2" value={selectedPathId} onChange={(event) => setSelectedPathId(event.target.value)}>
              {plan.savedPaths.map((path) => (
                <option key={path.id} value={path.id}>
                  {path.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label={summary?.simple.label ?? "Simple FIRE Age Estimate"} value={summary?.simple.value ?? "Calculating"} />
            <Metric label={summary?.deterministic.label ?? "Deterministic FIRE Age Estimate"} value={summary?.deterministic.value ?? "Calculating"} />
            <Metric label={summary?.monteCarlo.label ?? "Monte Carlo FIRE Age Estimate"} value={summary?.monteCarlo.value ?? "Calculating"} />
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          These estimates are based on the assumptions you entered. They are not a guarantee and are not financial advice.
        </p>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-lg border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-semibold">Saved Path Assumptions</h2>
          <div className="mt-4 grid gap-3">
            <label className="grid gap-2 text-sm font-medium">
              Choose the FIRE rule you want this Saved Path to test.
              <select
                className="rounded-lg border border-[var(--border)] px-3 py-2"
                value={selectedPath.assumptions.fireRuleMode}
                onChange={(event) =>
                  updateSelectedPath((path) => ({
                    ...path,
                    assumptions: { ...path.assumptions, fireRuleMode: event.target.value as FireRuleMode }
                  }))
                }
              >
                <option value="withdrawal_rate">Withdrawal-Rate FIRE</option>
                <option value="income_stream">Income Stream FIRE</option>
              </select>
            </label>
            <InlineNumber label="Withdrawal rate" value={selectedPath.assumptions.withdrawalRate} step={0.005} onChange={(value) => updateSelectedPath((path) => ({ ...path, assumptions: { ...path.assumptions, withdrawalRate: value } }))} />
            <InlineNumber label="Annual savings" value={selectedPath.assumptions.annualSavings} step={1000} onChange={(value) => updateSelectedPath((path) => ({ ...path, assumptions: { ...path.assumptions, annualSavings: value } }))} />
            <InlineNumber label="Inflation rate" value={selectedPath.assumptions.globalInflationRate} step={0.005} onChange={(value) => updateSelectedPath((path) => ({ ...path, assumptions: { ...path.assumptions, globalInflationRate: value } }))} />
            <TaxSettingsControls selectedPath={selectedPath} updateSelectedPath={updateSelectedPath} />
          </div>
          {warning && <p className="mt-4 rounded-lg bg-[#fff8eb] p-3 text-sm leading-6 text-[#76531c]">{warning}</p>}
          <button className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white" onClick={runProjection}>
            <Play size={16} aria-hidden="true" />
            Run Projection
          </button>
          <div className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--muted)] p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="grid gap-2 text-sm font-medium">
                Simulations
                <select
                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
                  value={monteCarloSimulations}
                  onChange={(event) => setMonteCarloSimulations(Number(event.target.value) as 1000 | 5000 | 10000)}
                >
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                Success Target
                <select
                  className="rounded-lg border border-[var(--border)] bg-white px-3 py-2"
                  value={monteCarloThreshold}
                  onChange={(event) => setMonteCarloThreshold(Number(event.target.value))}
                >
                  <option value={0.8}>80%</option>
                  <option value={0.85}>85%</option>
                  <option value={0.9}>90%</option>
                  <option value={0.95}>95%</option>
                </select>
              </label>
              <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold" onClick={runMonteCarlo}>
                <Play size={16} aria-hidden="true" />
                Run Monte Carlo
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{monteCarloStatus}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              Historical simulations sample past monthly market paths. They are planning estimates, not predictions.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[var(--border)] bg-white p-4">
          <h2 className="text-lg font-semibold">Expenses and Income</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <QuickExpenseForm updateSelectedPath={updateSelectedPath} />
            <QuickIncomeForm updateSelectedPath={updateSelectedPath} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <RecordList title="Expenses" items={selectedPath.expenses.map((expense) => `${expense.name}: ${formatCurrency(expense.amount)} ${expense.frequency}`)} />
            <RecordList title="Income" items={selectedPath.incomeStreams.map((income) => `${income.name}: ${formatCurrency(income.amount)} ${income.frequency} (${income.incomeCategory})`)} />
          </div>
        </section>
      </div>
    </div>
  );
}

function TaxSettingsControls({
  selectedPath,
  updateSelectedPath
}: {
  selectedPath: SavedPath;
  updateSelectedPath: (mutator: (path: SavedPath) => SavedPath) => void;
}) {
  const rates = selectedPath.taxSettings.accountTaxRates ?? {
    taxable: 0.15,
    tax_deferred: 0.25,
    tax_free: 0,
    cash: 0,
    real_estate: 0.1,
    custom: 0.2
  };

  function updateAccountRate(key: keyof typeof rates, value: number) {
    updateSelectedPath((path) => ({
      ...path,
      taxSettings: {
        ...path.taxSettings,
        mode: "account_level",
        accountWithdrawalMethod: "pro_rata",
        accountTaxRates: {
          ...(path.taxSettings.accountTaxRates ?? rates),
          [key]: value
        }
      }
    }));
  }

  return (
    <fieldset className="rounded-lg border border-[var(--border)] p-3">
      <legend className="px-1 text-sm font-semibold">Tax Model</legend>
      <label className="mt-2 grid gap-2 text-sm font-medium">
        Tax mode
        <select
          className="rounded-lg border border-[var(--border)] px-3 py-2"
          value={selectedPath.taxSettings.mode}
          onChange={(event) =>
            updateSelectedPath((path) => ({
              ...path,
              taxSettings: {
                ...path.taxSettings,
                mode: event.target.value as "none" | "simple_blended" | "account_level",
                accountWithdrawalMethod: "pro_rata",
                accountTaxRates:
                  event.target.value === "account_level"
                    ? path.taxSettings.accountTaxRates ?? rates
                    : path.taxSettings.accountTaxRates
              }
            }))
          }
        >
          <option value="none">No tax</option>
          <option value="simple_blended">Simple blended effective tax rate</option>
          <option value="account_level">Account-level effective tax rates</option>
        </select>
      </label>
      {selectedPath.taxSettings.mode === "simple_blended" && (
        <InlineNumber
          label="Simple effective tax rate"
          value={selectedPath.taxSettings.simpleEffectiveTaxRate ?? 0}
          step={0.01}
          onChange={(value) =>
            updateSelectedPath((path) => ({
              ...path,
              taxSettings: { ...path.taxSettings, simpleEffectiveTaxRate: value }
            }))
          }
        />
      )}
      {selectedPath.taxSettings.mode === "account_level" && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <InlineNumber label="Taxable" value={rates.taxable} step={0.01} onChange={(value) => updateAccountRate("taxable", value)} />
          <InlineNumber label="Tax-deferred" value={rates.tax_deferred} step={0.01} onChange={(value) => updateAccountRate("tax_deferred", value)} />
          <InlineNumber label="Tax-free / Roth" value={rates.tax_free} step={0.01} onChange={(value) => updateAccountRate("tax_free", value)} />
          <InlineNumber label="Cash" value={rates.cash} step={0.01} onChange={(value) => updateAccountRate("cash", value)} />
          <InlineNumber label="Real estate" value={rates.real_estate} step={0.01} onChange={(value) => updateAccountRate("real_estate", value)} />
          <InlineNumber label="Custom" value={rates.custom} step={0.01} onChange={(value) => updateAccountRate("custom", value)} />
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-[var(--muted-foreground)]">
        Tax calculations are simplified planning estimates and are not tax advice. Account-level mode uses a pro-rata withdrawal assumption.
      </p>
    </fieldset>
  );
}

function SavedPathsSection({
  plan,
  updatePlan,
  selectedPathId,
  setSelectedPathId
}: {
  plan: PlanDocument;
  updatePlan: (mutator: (draft: PlanDocument) => PlanDocument) => void;
  selectedPathId: string;
  setSelectedPathId: (id: string) => void;
}) {
  function createPath(formData: FormData) {
    const name = String(formData.get("name") || "New Saved Path");
    const base = plan.savedPaths.find((path) => path.id === selectedPathId) ?? plan.savedPaths[0];
    const id = createId("path");
    updatePlan((current) => ({
      ...current,
      savedPaths: [
        ...current.savedPaths,
        {
          ...base,
          id,
          name,
          isDefault: false,
          isArchived: false
        }
      ]
    }));
    setSelectedPathId(id);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <FormPanel title="Create Saved Path" onSubmit={createPath}>
        <Input name="name" label="Path name" defaultValue="Retire Earlier" />
      </FormPanel>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Saved Paths</h2>
        <div className="mt-4 grid gap-3">
          {plan.savedPaths.map((path) => (
            <div key={path.id} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{path.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    {path.assumptions.fireRuleMode === "income_only" ||
                    path.assumptions.fireRuleMode === "income_stream"
                      ? "Income Stream FIRE"
                      : "Withdrawal-Rate FIRE"}
                    {path.isDefault ? " | Default" : ""}
                    {path.isArchived ? " | Archived" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold" onClick={() => setSelectedPathId(path.id)}>
                    Select
                  </button>
                  <button
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
                    onClick={() =>
                      updatePlan((current) => ({
                        ...current,
                        settings: { ...current.settings, defaultSavedPathId: path.id },
                        savedPaths: current.savedPaths.map((item) => ({ ...item, isDefault: item.id === path.id }))
                      }))
                    }
                  >
                    Default
                  </button>
                  <button
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-semibold"
                    onClick={() =>
                      updatePlan((current) => ({
                        ...current,
                        savedPaths: current.savedPaths.map((item) => (item.id === path.id ? { ...item, isArchived: !item.isArchived } : item))
                      }))
                    }
                  >
                    {path.isArchived ? "Restore" : "Archive"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PathComparisonSection({ comparison }: { comparison: SavedPathSummary[] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <h2 className="text-lg font-semibold">Path Comparison</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="text-left text-[var(--muted-foreground)]">
            <tr>
              <th className="py-2">Saved Path</th>
              <th>Rule mode</th>
              <th>Simple FIRE number</th>
              <th>Simple FIRE Age Estimate</th>
              <th>Deterministic FIRE Age Estimate</th>
              <th>Monte Carlo FIRE Age Estimate</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((item) => (
              <tr key={item.pathName} className="border-t border-[var(--border)]">
                <td className="py-3 font-semibold">{item.pathName}</td>
                <td>{item.fireRuleModeLabel}</td>
                <td>{formatCurrency(item.simpleFireNumber)}</td>
                <td>{item.simple.value}</td>
                <td>{item.deterministic.value}</td>
                <td>{item.monteCarlo.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FamilyPlanSection({
  plan,
  updatePlan
}: {
  plan: PlanDocument;
  updatePlan: (mutator: (draft: PlanDocument) => PlanDocument) => void;
}) {
  function addPerson(formData: FormData) {
    const label = String(formData.get("label") || "Partner");
    const birthDate = String(formData.get("birthDate") || "1986-01-01");
    const lifeExpectancy = Number(formData.get("lifeExpectancy") || 92);
    updatePlan((current) => ({
      ...current,
      settings: { ...current.settings, planningMode: "family" },
      people: [
        ...current.people,
        {
          id: createId("person"),
          label,
          birthDate,
          lifeExpectancy,
          isPrimary: false
        }
      ]
    }));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
      <FormPanel title="Add Family Planner" onSubmit={addPerson}>
        <Input name="label" label="Label" defaultValue="Partner" />
        <Input name="birthDate" label="Birth date" type="date" defaultValue="1986-01-01" />
        <Input name="lifeExpectancy" label="Life expectancy" type="number" defaultValue="92" />
      </FormPanel>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Family Planning Horizon</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {plan.people.map((person) => (
            <div key={person.id} className="rounded-lg border border-[var(--border)] p-3">
              <h3 className="font-semibold">{person.label}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Birth date: {person.birthDate ?? "Age entered"} | Life expectancy: {person.lifeExpectancy}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function SocialSecuritySection({
  selectedPath,
  updateSelectedPath
}: {
  selectedPath: SavedPath;
  updateSelectedPath: (mutator: (path: SavedPath) => SavedPath) => void;
}) {
  function addDirectEntry(formData: FormData) {
    const monthlyBenefit = Number(formData.get("monthlyBenefit"));
    const claimingDate = String(formData.get("claimingDate"));
    updateSelectedPath((path) => ({
      ...path,
      socialSecurity: [
        ...path.socialSecurity,
        {
          id: createId("ss"),
          personId: "person-primary",
          entryMode: "direct_entry",
          monthlyBenefitTodayDollars: monthlyBenefit,
          claimingTiming: { type: "exact_date", date: claimingDate },
          inflationAdjusted: true,
          includedInFirePlan: true
        }
      ]
    }));
  }

  function addCalculatorEstimate(formData: FormData) {
    const birthYear = Number(formData.get("birthYear"));
    const claimingAge = Number(formData.get("claimingAge"));
    const workStartYear = Number(formData.get("workStartYear"));
    const workEndYear = Number(formData.get("workEndYear"));
    const annualEarnings = Number(formData.get("annualEarnings"));
    const annualEarningsGrowth = Number(formData.get("annualEarningsGrowth"));
    const wageGrowthAssumption = Number(formData.get("wageGrowthAssumption"));
    const estimate = estimateSocialSecurityBenefit({
      birthYear,
      claimingAge,
      workStartYear,
      workEndYear,
      startingAnnualCoveredEarnings: annualEarnings,
      annualEarningsGrowth,
      wageGrowthAssumption,
      displayMode: "today_dollars"
    });
    const claimingDate = `${birthYear + claimingAge}-01-01`;
    updateSelectedPath((path) => ({
      ...path,
      socialSecurity: [
        ...path.socialSecurity,
        {
          id: createId("ss-calc"),
          personId: "person-primary",
          entryMode: "formula_calculator",
          birthYear,
          claimingAge,
          workStartYear,
          workEndYear,
          currentAnnualCoveredEarnings: annualEarnings,
          assumedAnnualEarningsGrowth: annualEarningsGrowth,
          estimatedAime: estimate.estimatedAime,
          estimatedPia: estimate.estimatedPia,
          estimatedMonthlyBenefitTodayDollars: estimate.estimatedMonthlyBenefitTodayDollars,
          estimatedMonthlyBenefitFutureDollars: estimate.estimatedMonthlyBenefitFutureDollars,
          claimingTiming: { type: "exact_date", date: claimingDate },
          inflationAdjusted: true,
          includedInFirePlan: true
        }
      ]
    }));
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="grid gap-4">
        <FormPanel title="Direct Entry" onSubmit={addDirectEntry}>
          <Input name="monthlyBenefit" label="Monthly benefit in today's dollars" type="number" defaultValue="2600" />
          <Input name="claimingDate" label="Claiming date" type="date" defaultValue="2052-01-01" />
        </FormPanel>
        <FormPanel title="Formula Calculator" onSubmit={addCalculatorEstimate}>
          <Input name="birthYear" label="Birth year" type="number" defaultValue="1985" />
          <Input name="claimingAge" label="Claiming age" type="number" defaultValue="67" />
          <Input name="workStartYear" label="Work start year" type="number" defaultValue="2010" />
          <Input name="workEndYear" label="Current or expected stop-work year" type="number" defaultValue="2049" />
          <Input name="annualEarnings" label="Starting annual covered earnings" type="number" defaultValue="120000" />
          <Input name="annualEarningsGrowth" label="Annual earnings growth" type="number" defaultValue="0.03" />
          <Input name="wageGrowthAssumption" label="Wage growth assumption" type="number" defaultValue="0.025" />
        </FormPanel>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Social Security Estimates</h2>
        <p className="mt-2 rounded-lg bg-[var(--muted)] p-3 text-sm leading-6 text-[var(--muted-foreground)]">
          This is an unofficial estimate based on the information you entered. It does not access your SSA earnings record and may differ from your official Social Security estimate.
        </p>
        <div className="mt-4 grid gap-3">
          {selectedPath.socialSecurity.map((estimate) => (
            <div key={estimate.id} className="rounded-lg border border-[var(--border)] p-3">
              <h3 className="font-semibold">{estimate.entryMode === "direct_entry" ? "Direct entry" : "Formula calculator"}</h3>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Monthly estimate: {formatCurrency(estimate.monthlyBenefitTodayDollars ?? estimate.estimatedMonthlyBenefitTodayDollars ?? 0)}
              </p>
              {estimate.estimatedAime && <p className="text-sm text-[var(--muted-foreground)]">AIME: {formatCurrency(estimate.estimatedAime)} | PIA: {formatCurrency(estimate.estimatedPia ?? 0)}</p>}
              {estimate.estimatedMonthlyBenefitFutureDollars && (
                <p className="text-sm text-[var(--muted-foreground)]">
                  Future-dollar monthly view: {formatCurrency(estimate.estimatedMonthlyBenefitFutureDollars)}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function WealthRecordsSection({ plan }: { plan: PlanDocument }) {
  return (
    <div className="grid gap-5">
      <RecordList title="Historical Quantity Timelines" items={plan.marketPositions.flatMap((position) => position.quantitySnapshots.map((snapshot) => `${position.symbol}: ${snapshot.quantity} shares as of ${snapshot.effectiveDate}${snapshot.notes ? ` (${snapshot.notes})` : ""}`))} />
      <RecordList title="Cash Balance Snapshots" items={plan.cashAccounts.flatMap((cash) => cash.balanceSnapshots.map((snapshot) => `${cash.name}: ${formatCurrency(snapshot.balance)} as of ${snapshot.effectiveDate}`))} />
      <RecordList title="Manual Asset Valuation Snapshots" items={plan.manualAssets.flatMap((asset) => asset.valuationSnapshots.map((snapshot) => `${asset.name}: ${formatCurrency(snapshot.value)} as of ${snapshot.effectiveDate}`))} />
      <RecordList title="Liability Balance Snapshots" items={plan.liabilityAccounts.flatMap((liability) => liability.balanceSnapshots.map((snapshot) => `${liability.name}: ${formatCurrency(snapshot.balance)} as of ${snapshot.effectiveDate}`))} />
    </div>
  );
}

function SettingsSection({
  handleImport,
  handleExport,
  handleSaveLocal,
  handleSaveCloud,
  handleLoadCloud,
  handleDeleteCloud
}: {
  plan: PlanDocument;
  handleImport: (file: File | null) => void;
  handleExport: () => void;
  handleSaveLocal: () => void;
  handleSaveCloud: () => void;
  handleLoadCloud: () => void;
  handleDeleteCloud: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Plan Storage</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Creating an account lets you save and sync your plan. You can still use Plan My FIRE without an account.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white" onClick={handleSaveLocal}>
            <Save size={16} aria-hidden="true" />
            Save Local
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={handleExport}>
            <Download size={16} aria-hidden="true" />
            Export JSON
          </button>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold">
            <Upload size={16} aria-hidden="true" />
            Import JSON
            <input className="hidden" type="file" accept="application/json" onChange={(event) => handleImport(event.target.files?.[0] ?? null)} />
          </label>
          <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={handleSaveCloud}>
            Save Cloud
          </button>
          <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold" onClick={handleLoadCloud}>
            Load Cloud
          </button>
          <button className="rounded-lg border border-[#f1b8b8] px-4 py-2 text-sm font-semibold text-[#9f1d1d]" onClick={handleDeleteCloud}>
            Delete Cloud Copy
          </button>
        </div>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4">
        <h2 className="text-lg font-semibold">Privacy and Guardrails</h2>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
          <li>No Social Security number.</li>
          <li>No brokerage credentials.</li>
          <li>No bank credentials.</li>
          <li>Tax calculations are simplified planning estimates and are not tax advice.</li>
          <li>Monte Carlo results are based on sampled historical market paths and assumptions you provide. They are not a guarantee of future results.</li>
        </ul>
      </section>
      <section className="rounded-lg border border-[var(--border)] bg-white p-4 lg:col-span-2">
        <h2 className="text-lg font-semibold">Next Development</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
          Roadmap items are planned features and may change. Plan My FIRE provides planning estimates only and is not investment, tax, legal, or financial advice.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <RoadmapList title="Current MVP Features" items={["Guest mode", "Optional account cloud sync", "Effective-dated historical holdings", "Historical net-worth chart", "End-of-day stock pricing", "Basic Portfolio Lab", "FIRE Path", "Saved Paths", "Path Comparison", "Withdrawal-Rate FIRE", "Income Stream FIRE", "Principal-Preserving FIRE", "Direct Social Security entry", "Basic Social Security formula calculator", "Historical Monte Carlo"]} />
          <RoadmapList title="Next Development" items={["Hybrid FIRE", "Full buy/sell transaction ledger", "Cost basis", "Tax lots", "CSV import/export", "Improved Portfolio Lab analytics", "More Social Security scenarios"]} />
        </div>
      </section>
    </div>
  );
}

function RoadmapSection() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <RoadmapList title="Current MVP Features" items={["Guest mode", "Optional account cloud sync", "Effective-dated historical holdings", "Historical net-worth chart", "End-of-day stock pricing", "Basic Portfolio Lab", "FIRE Path", "Saved Paths", "Path Comparison", "Withdrawal-Rate FIRE", "Income Stream FIRE", "Principal-Preserving FIRE", "Direct Social Security entry", "Basic Social Security formula calculator", "Simple and account-level tax model", "Historical Monte Carlo"]} />
      <RoadmapList title="Next Development" items={["Hybrid FIRE", "Full buy/sell transaction ledger", "Cost basis", "Realized/unrealized gains", "Tax lots", "Dividend tracking", "Reinvestment tracking", "Stock split tracking", "CSV import/export", "Improved Portfolio Lab analytics", "App-estimated portfolio income from holdings", "More Social Security scenarios"]} />
      <RoadmapList title="Later Development" items={["Spousal/survivor Social Security", "WEP/GPO", "Tax optimization", "Roth conversion planning", "Required minimum distribution planning", "Time-weighted return", "Money-weighted return", "Performance attribution", "Brokerage/bank integrations", "Paid market data plan if needed"]} />
      <RoadmapList title="Out of Scope for MVP" items={["Trading", "Personalized investment advice", "Real-time market data", "Brokerage account linking", "Bank account linking", "Exact tax filing calculations", "Guaranteed retirement recommendations"]} />
      <p className="rounded-lg border border-[var(--border)] bg-white p-4 text-sm leading-6 text-[var(--muted-foreground)] lg:col-span-2">
        Roadmap items are planned features and may change. Plan My FIRE provides planning estimates only and is not investment, tax, legal, or financial advice.
      </p>
    </div>
  );
}

function QuickExpenseForm({ updateSelectedPath }: { updateSelectedPath: (mutator: (path: SavedPath) => SavedPath) => void }) {
  return (
    <FormPanel
      title="Add Expense"
      onSubmit={(formData) => {
        const expense: RecurringExpense = {
          id: createId("expense"),
          name: String(formData.get("name") || "Expense"),
          category: String(formData.get("category") || "Living"),
          amount: Number(formData.get("amount") || 0),
          frequency: String(formData.get("frequency") || "monthly") as "monthly" | "annual",
          startTiming: buildTimingRuleFromForm(formData, "start", "2026-01-01", "event-healthcare-65"),
          endTiming: buildOptionalTimingRuleFromForm(formData, "end", "event-healthcare-65"),
          inflationAdjusted: true,
          isEssential: true,
          includedInFirePath: true
        };
        updateSelectedPath((path) => ({ ...path, expenses: [...path.expenses, expense] }));
      }}
    >
      <Input name="name" label="Name" defaultValue="Healthcare" />
      <Input name="category" label="Category" defaultValue="Living" />
      <Input name="amount" label="Amount" type="number" defaultValue="650" />
      <Select name="frequency" label="Frequency" options={["monthly", "annual"]} />
      <Select name="startTimingType" label="Start timing" options={["exact_date", "relative_event"]} />
      <Input name="startDate" label="Start date" type="date" defaultValue="2026-01-01" />
      <Input name="startEventId" label="Start event id" defaultValue="event-healthcare-65" />
      <Input name="startOffsetValue" label="Start offset" type="number" defaultValue="0" />
      <Select name="startOffsetUnit" label="Start offset unit" options={["months", "years"]} />
      <Select name="startDirection" label="Start direction" options={["after", "before"]} />
      <Select name="endTimingType" label="End timing" options={["none", "exact_date", "relative_event"]} />
      <Input name="endDate" label="End date" type="date" defaultValue="2030-12-31" />
      <Input name="endEventId" label="End event id" defaultValue="event-healthcare-65" />
      <Input name="endOffsetValue" label="End offset" type="number" defaultValue="0" />
      <Select name="endOffsetUnit" label="End offset unit" options={["months", "years"]} />
      <Select name="endDirection" label="End direction" options={["after", "before"]} />
    </FormPanel>
  );
}

function QuickIncomeForm({ updateSelectedPath }: { updateSelectedPath: (mutator: (path: SavedPath) => SavedPath) => void }) {
  return (
    <FormPanel
      title="Add Income"
      onSubmit={(formData) => {
        const endTiming = buildOptionalTimingRuleFromForm(formData, "end", "event-healthcare-65");
        const income: RetirementIncomeStream = {
          id: createId("income"),
          name: String(formData.get("name") || "Income"),
          incomeType: String(formData.get("incomeType") || "rental") as RetirementIncomeStream["incomeType"],
          incomeCategory: String(formData.get("incomeCategory") || "passive") as RetirementIncomeStream["incomeCategory"],
          amount: Number(formData.get("amount") || 0),
          frequency: String(formData.get("frequency") || "annual") as "monthly" | "annual",
          startTiming: buildTimingRuleFromForm(formData, "start", "2026-01-01", "event-healthcare-65"),
          endTiming: endTiming ?? "lifetime",
          inflationAdjusted: true,
          taxable: true,
          includedInFirePath: true
        };
        updateSelectedPath((path) => ({ ...path, incomeStreams: [...path.incomeStreams, income] }));
      }}
    >
      <Input name="name" label="Name" defaultValue="Rental net income" />
      <Select name="incomeType" label="Type" options={["social_security", "pension", "rental", "part_time_work", "business", "portfolio_income", "dividend", "interest", "annuity", "other"]} />
      <Select name="incomeCategory" label="Category" options={["guaranteed", "passive", "earned", "portfolio_income", "other"]} />
      <Input name="amount" label="Amount" type="number" defaultValue="72000" />
      <Select name="frequency" label="Frequency" options={["monthly", "annual"]} />
      <Select name="startTimingType" label="Start timing" options={["exact_date", "relative_event"]} />
      <Input name="startDate" label="Start date" type="date" defaultValue="2026-01-01" />
      <Input name="startEventId" label="Start event id" defaultValue="event-healthcare-65" />
      <Input name="startOffsetValue" label="Start offset" type="number" defaultValue="0" />
      <Select name="startOffsetUnit" label="Start offset unit" options={["months", "years"]} />
      <Select name="startDirection" label="Start direction" options={["after", "before"]} />
      <Select name="endTimingType" label="End timing" options={["none", "exact_date", "relative_event"]} />
      <Input name="endDate" label="End date" type="date" defaultValue="2030-12-31" />
      <Input name="endEventId" label="End event id" defaultValue="event-healthcare-65" />
      <Input name="endOffsetValue" label="End offset" type="number" defaultValue="0" />
      <Select name="endOffsetUnit" label="End offset unit" options={["months", "years"]} />
      <Select name="endDirection" label="End direction" options={["after", "before"]} />
    </FormPanel>
  );
}

function buildTimingRuleFromForm(
  formData: FormData,
  prefix: "start" | "end",
  fallbackDate: string,
  fallbackEventId: string
): TimingRule {
  const timingType = String(formData.get(`${prefix}TimingType`) || "exact_date");
  if (timingType === "relative_event") {
    return {
      type: "relative_event",
      eventId: String(formData.get(`${prefix}EventId`) || fallbackEventId),
      offsetValue: Number(formData.get(`${prefix}OffsetValue`) || 0),
      offsetUnit: String(formData.get(`${prefix}OffsetUnit`) || "months") as "months" | "years",
      direction: String(formData.get(`${prefix}Direction`) || "after") as "before" | "after"
    };
  }

  return {
    type: "exact_date",
    date: String(formData.get(`${prefix}Date`) || fallbackDate)
  };
}

function buildOptionalTimingRuleFromForm(
  formData: FormData,
  prefix: "end",
  fallbackEventId: string
): TimingRule | undefined {
  const timingType = String(formData.get(`${prefix}TimingType`) || "none");
  if (timingType === "none") return undefined;
  return buildTimingRuleFromForm(formData, prefix, String(formData.get(`${prefix}Date`) || "2030-12-31"), fallbackEventId);
}

function DrilldownPanel({ drilldown }: { drilldown: NetWorthResult }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <h2 className="text-lg font-semibold">Source Data Drilldown</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <RecordList title="Market prices used" items={drilldown.drilldown.marketPositions.map((item) => `${item.symbol}: ${item.quantity} shares x ${formatCurrency(item.price)} (${item.priceSource}, ${item.priceDate})`)} />
        <RecordList title="Cash balances used" items={drilldown.drilldown.cashAccounts.map((item) => `${item.name}: ${formatCurrency(item.balance)}`)} />
        <RecordList title="Manual valuations used" items={drilldown.drilldown.manualAssets.map((item) => `${item.name}: ${formatCurrency(item.value)}`)} />
        <RecordList title="Liabilities used" items={drilldown.drilldown.liabilities.map((item) => `${item.name}: ${formatCurrency(item.balance)}`)} />
      </div>
    </section>
  );
}

function FormPanel({ title, children, onSubmit }: { title: string; children: React.ReactNode; onSubmit: (formData: FormData) => void }) {
  return (
    <form
      className="rounded-lg border border-[var(--border)] bg-white p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(new FormData(event.currentTarget));
      }}
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4 grid gap-3">{children}</div>
      <button className="mt-4 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white" type="submit">
        Add
      </button>
    </form>
  );
}

function Input({ label, name, type = "text", defaultValue }: { label: string; name: string; type?: string; defaultValue?: string }) {
  const isNumericInput = type === "number";

  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        className="min-w-0 rounded-lg border border-[var(--border)] px-3 py-2"
        name={name}
        type={isNumericInput ? "text" : type}
        inputMode={isNumericInput ? "decimal" : undefined}
        defaultValue={defaultValue}
      />
    </label>
  );
}

function Select({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <select className="rounded-lg border border-[var(--border)] px-3 py-2" name={name}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}

function InlineNumber({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (value: number) => void }) {
  const [draftValue, setDraftValue] = useState(() => String(value));
  const [isEditing, setIsEditing] = useState(false);
  const [hasUncommittedDraft, setHasUncommittedDraft] = useState(false);
  const displayedValue = isEditing || hasUncommittedDraft ? draftValue : String(value);
  const handleInputValue = (rawValue: string) => {
    setIsEditing(true);
    setDraftValue(rawValue);
    const trimmedValue = rawValue.trim();
    const parsedValue = Number(trimmedValue);
    if (trimmedValue && Number.isFinite(parsedValue)) {
      setHasUncommittedDraft(false);
      onChange(parsedValue);
    } else {
      setHasUncommittedDraft(true);
    }
  };

  return (
    <label className="grid gap-1 text-sm font-medium">
      {label}
      <input
        className="rounded-lg border border-[var(--border)] px-3 py-2"
        type="text"
        inputMode="decimal"
        value={displayedValue}
        step={step}
        onChange={(event) => {
          handleInputValue(event.target.value);
        }}
        onInput={(event) => {
          handleInputValue(event.currentTarget.value);
        }}
        onFocus={() => {
          if (!hasUncommittedDraft) {
            setDraftValue(String(value));
          }
          setIsEditing(true);
        }}
        onBlur={() => {
          setIsEditing(false);
          const trimmedValue = draftValue.trim();
          setHasUncommittedDraft(!trimmedValue || !Number.isFinite(Number(trimmedValue)));
        }}
        onWheel={(event) => event.currentTarget.blur()}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-white p-4">
      <p className="text-sm text-[var(--muted-foreground)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

function RecordList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 grid gap-2 text-sm leading-6 text-[var(--muted-foreground)]">
        {items.length > 0 ? items.map((item) => <li key={item}>{item}</li>) : <li>No records yet.</li>}
      </ul>
    </section>
  );
}

function RoadmapList({ title, items }: { title: string; items: string[] }) {
  return <RecordList title={title} items={items} />;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    maximumFractionDigits: 1
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
