"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarClock,
  Cloud,
  Download,
  Eye,
  EyeOff,
  Info,
  Layers,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Upload
} from "lucide-react";
import { PortfolioCollectionsPanel } from "@/components/planning/portfolio-collections-panel";
import { PortfolioBacktestPanel } from "@/components/planning/portfolio-backtest-panel";
import {
  PortfolioPrivacyProvider,
  useMaskCurrency
} from "@/components/planning/portfolio-privacy";
import { maskCurrency } from "@/lib/phase1/mask-currency";
import { AddHoldingForm } from "@/components/planning/add-holding-form";
import { InfoPopover } from "@/components/ui/info-popover";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { useIsAppMode } from "@/components/app-mode-provider";
import { useSession } from "@/lib/auth/use-session";
import { getCollectionLabelsForItem } from "@/lib/phase1/collections";
import {
  applyFetchedPricesToPhase1Portfolio,
  calculatePortfolioItemBalance,
  deletePhase1PortfolioItem,
  countsTowardFireAssets,
  isSuccessfulFetchedMarketPrice,
  isMarketPricedType,
  normalizePortfolioItemBalance
} from "@/lib/phase1/portfolio";
import {
  createItemId,
  formatAssetType,
  getPortfolioEntryType,
  householdSharedOwner,
  isHouseholdSharedAssetType,
  portfolioEntryTypes
} from "@/lib/phase1/portfolio-draft";
import {
  exportPortfolioCsv,
  exportPortfolioXlsx,
  parsePortfolioCsv,
  parsePortfolioXlsx
} from "@/lib/phase1/portfolio-file";
import type { FetchedMarketPrice } from "@/types/market-data";
import type { Phase1AssetType, Phase1PortfolioItem, PortfolioImportResult } from "@/types/phase1";

type PortfolioScope = "all" | "fire";
type PortfolioLens = "accountOwner" | "accountType" | "taxTreatment" | "collection";
type PortfolioAllocationView = "riskExposure" | "holdings";
type PortfolioTableColumnId =
  | "type"
  | "holdingType"
  | "nameSymbol"
  | "accountOwner"
  | "accountType"
  | "taxTreatment"
  | "includeInFire"
  | "unitPrice"
  | "units"
  | "balance"
  | "collections";
type PortfolioTableSort = {
  columnId: PortfolioTableColumnId;
  direction: "asc" | "desc";
};

const portfolioScopeOptions: { value: PortfolioScope; label: string }[] = [
  { value: "all", label: "All portfolio" },
  { value: "fire", label: "FIRE included" }
];
const portfolioLensOptions: { value: PortfolioLens; label: string }[] = [
  { value: "accountOwner", label: "Account owner" },
  { value: "accountType", label: "Account type" },
  { value: "taxTreatment", label: "Tax treatment" },
  { value: "collection", label: "Collection" }
];
const portfolioAllocationViewOptions: { value: PortfolioAllocationView; label: string }[] = [
  { value: "riskExposure", label: "Market Holding Risk Exposure" },
  { value: "holdings", label: "Holdings" }
];
const portfolioTableColumns: { id: PortfolioTableColumnId; label: string }[] = [
  { id: "type", label: "Type" },
  { id: "holdingType", label: "Holding Type" },
  { id: "nameSymbol", label: "Name/Symbol" },
  { id: "accountOwner", label: "Account Owner" },
  { id: "accountType", label: "Account Type" },
  { id: "taxTreatment", label: "Tax Treatment" },
  { id: "includeInFire", label: "Include in FIRE" },
  { id: "unitPrice", label: "Unit Price" },
  { id: "units", label: "Units" },
  { id: "balance", label: "Balance" },
  { id: "collections", label: "Collections" }
];
const defaultPortfolioTableColumnIds = portfolioTableColumns.map((column) => column.id);
const portfolioTableColumnsStorageKey = "freedom-path.portfolio-table-columns.v1";
// Brand-derived allocation palette (REDESIGN_SPEC §2 chart swatches).
const allocationColors = ["#15803d", "#f5b301", "#0d9488", "#9333ea", "#34c77e", "#7c7b71"];
const genericMarketDataWarning =
  "Market data may be delayed, stale, estimated, or manually entered. Check source and price date before relying on values.";

type AllocationSegment = {
  label: string;
  balance: number;
  visualValue: number;
  percent: number;
  color: string;
};

type PortfolioLensSegment = AllocationSegment & {
  id: string;
  itemCount: number;
};

type PortfolioLensGroup = {
  id: string;
  label: string;
};

// Benefit chips for the value-prop header. Kept short so the header stays clean.
const portfolioValueProps = [
  { icon: Layers, label: "Consolidated household view" },
  { icon: SlidersHorizontal, label: "Scope, lens, focus & collections" },
  { icon: ShieldCheck, label: "No login required" },
  { icon: Cloud, label: "Saved locally, sync optional" },
  { icon: CalendarClock, label: "Daily end-of-day prices" }
] as const;

export function PortfolioPanel({
  workbook,
  status,
  portfolioSummary,
  onChange
}: Phase1PanelProps) {
  const csvInputRef = useRef<HTMLInputElement>(null);
  const xlsxInputRef = useRef<HTMLInputElement>(null);
  const selectAllRowsRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useSession();
  // App mode (Capacitor iOS app) gets the mobile redesign — holdings as cards,
  // a dedicated Add Holdings page, top action bar + FAB. The website (desktop
  // AND mobile web) keeps the original wide table + inline add/edit form.
  const isAppMode = useIsAppMode();
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  // Website inline-form edit target. Clicking a row's Edit on the website loads
  // it into the inline AddHoldingForm (app mode routes to the Add page instead).
  // editNonce forces the form to remount so re-editing the SAME row reloads it.
  const [editItem, setEditItem] = useState<Phase1PortfolioItem | null>(null);
  const [editNonce, setEditNonce] = useState(0);
  const [uiStatus, setUiStatus] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [portfolioScope, setPortfolioScope] = useState<PortfolioScope>("all");
  const [portfolioLens, setPortfolioLens] = useState<PortfolioLens>("accountOwner");
  const [portfolioFocus, setPortfolioFocus] = useState("all");
  const [portfolioAllocationView, setPortfolioAllocationView] =
    useState<PortfolioAllocationView>("riskExposure");
  const [visibleTableColumnIds, setVisibleTableColumnIds] = useState<
    PortfolioTableColumnId[]
  >(loadPortfolioTableColumnPreferences);
  const [tableSettingsOpen, setTableSettingsOpen] = useState(false);
  const [portfolioTableSort, setPortfolioTableSort] = useState<PortfolioTableSort | null>(
    null
  );
  const [portfolioTableSearch, setPortfolioTableSearch] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  // "Hide values" privacy toggle — per-session plain state (NOT persisted or
  // synced), so it resets to OFF on reload. Drives masking of every dollar
  // figure across the portfolio tracker on both website and app; percentages,
  // names, tickers and dates stay visible. Provided to the portfolio tree via
  // PortfolioPrivacyProvider so nested sub-panels can mask without prop drilling.
  const [valuesHidden, setValuesHidden] = useState(false);

  const scopedPortfolioItems = useMemo(
    () => getAnalyzedPortfolioItems(workbook.portfolioItems, portfolioScope),
    [workbook.portfolioItems, portfolioScope]
  );
  const lensSegments = useMemo(
    () =>
      buildLensSegments(
        scopedPortfolioItems,
        portfolioLens,
        workbook.portfolioCollections,
        workbook.portfolioCollectionMemberships
      ),
    [
      scopedPortfolioItems,
      portfolioLens,
      workbook.portfolioCollections,
      workbook.portfolioCollectionMemberships
    ]
  );
  const selectedPortfolioFocus =
    portfolioFocus === "all" || lensSegments.some((segment) => segment.id === portfolioFocus)
      ? portfolioFocus
      : "all";
  const focusedPortfolioItems = useMemo(
    () =>
      getFocusedPortfolioItems(
        scopedPortfolioItems,
        portfolioLens,
        selectedPortfolioFocus,
        workbook.portfolioCollections,
        workbook.portfolioCollectionMemberships
      ),
    [
      scopedPortfolioItems,
      portfolioLens,
      selectedPortfolioFocus,
      workbook.portfolioCollections,
      workbook.portfolioCollectionMemberships
    ]
  );
  const sortedPortfolioItems = useMemo(
    () =>
      sortPortfolioItems(
        focusedPortfolioItems,
        portfolioTableSort,
        workbook.portfolioCollections,
        workbook.portfolioCollectionMemberships
      ),
    [
      focusedPortfolioItems,
      portfolioTableSort,
      workbook.portfolioCollections,
      workbook.portfolioCollectionMemberships
    ]
  );
  const filteredPortfolioItems = useMemo(
    () =>
      filterPortfolioTableItems(sortedPortfolioItems, {
        collectionMemberships: workbook.portfolioCollectionMemberships,
        collections: workbook.portfolioCollections,
        search: portfolioTableSearch,
        selectedItemIds,
        showSelectedOnly
      }),
    [
      sortedPortfolioItems,
      workbook.portfolioCollections,
      workbook.portfolioCollectionMemberships,
      portfolioTableSearch,
      selectedItemIds,
      showSelectedOnly
    ]
  );
  const analyzedSummary = useMemo(
    () => summarizeDashboardPortfolio(focusedPortfolioItems),
    [focusedPortfolioItems]
  );
  const allocationSegments = useMemo(
    () => buildAllocationSegments(focusedPortfolioItems, portfolioAllocationView),
    [focusedPortfolioItems, portfolioAllocationView]
  );
  const selectedFocusLabel = getSelectedFocusLabel(selectedPortfolioFocus, lensSegments);
  const selectedLensLabel =
    portfolioLensOptions.find((option) => option.value === portfolioLens)?.label ??
    "Account owner";
  const selectedAllocationViewLabel =
    portfolioAllocationViewOptions.find((option) => option.value === portfolioAllocationView)
      ?.label ?? "Market Holding Risk Exposure";
  const visibleTableColumnSet = useMemo(
    () => new Set(visibleTableColumnIds),
    [visibleTableColumnIds]
  );
  const visiblePortfolioItemIds = filteredPortfolioItems.map((item) => item.id);
  const selectedVisibleItemCount = visiblePortfolioItemIds.filter((itemId) =>
    selectedItemIds.includes(itemId)
  ).length;
  const allVisibleItemsSelected =
    visiblePortfolioItemIds.length > 0 &&
    selectedVisibleItemCount === visiblePortfolioItemIds.length;
  const someVisibleItemsSelected =
    selectedVisibleItemCount > 0 && !allVisibleItemsSelected;
  const visibleTableColumnCount = visibleTableColumnIds.length + 2;
  const visibleRowsLabel = `Showing ${filteredPortfolioItems.length} matching row${
    filteredPortfolioItems.length === 1 ? "" : "s"
  }`;
  const importExportStatus = uiStatus ?? getVisibleWorkbookStatus(workbook.lastImportExportStatus);
  const statusPresentation = getPortfolioStatusPresentation(importExportStatus);
  const lastEodLabel = workbook.lastEodRefreshAt
    ? `Showing EOD prices for ${formatEodDate(workbook.lastEodRefreshAt)}`
    : "EOD prices not refreshed yet";
  // "Local mode…" statuses duplicate the "Saved locally, sync optional" chip on
  // the left of this card, so they are hidden here. Signed-in sync statuses
  // ("Synced to your account.", "Saving to your account...") still render.
  const visibleSyncStatus = status.startsWith("Local mode") ? null : status;
  useEffect(() => {
    savePortfolioTableColumnPreferences(visibleTableColumnIds);
  }, [visibleTableColumnIds]);

  useEffect(() => {
    if (selectAllRowsRef.current) {
      selectAllRowsRef.current.indeterminate = someVisibleItemsSelected;
    }
  }, [someVisibleItemsSelected]);

  const updatePortfolioItem = (
    itemId: string,
    updater: (item: Phase1PortfolioItem) => Phase1PortfolioItem
  ) => {
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: new Date().toISOString(),
      portfolioItems: currentWorkbook.portfolioItems.map((item) =>
        item.id === itemId ? normalizePortfolioItemBalance(updater(item)) : item
      )
    }));
  };

  const handleIncludeInFireChange = (itemId: string, includedInFire: boolean) => {
    updatePortfolioItem(itemId, (item) => ({ ...item, includedInFire }));
  };

  // Surfaces the existing portfolio→FIRE-assets handoff as a one-tap action.
  // Uses the SAME value the Plan's "Use my portfolio total" applies
  // (portfolioSummary.includedInFire) — no new math. Navigation to the Plan is
  // handled by the surrounding <Link>; this just applies the value first.
  const handleUseInPlan = () => {
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: new Date().toISOString(),
      fireInputs: {
        ...currentWorkbook.fireInputs,
        currentFireAssets: portfolioSummary.includedInFire
      }
    }));
  };

  const handleSelectedItemChange = (itemId: string, selected: boolean) => {
    setSelectedItemIds((currentIds) => {
      if (selected) {
        return currentIds.includes(itemId) ? currentIds : [...currentIds, itemId];
      }

      return currentIds.filter((currentId) => currentId !== itemId);
    });
  };

  const handleSelectAllVisibleItems = (selected: boolean) => {
    const visibleItemIdSet = new Set(visiblePortfolioItemIds);

    setSelectedItemIds((currentIds) => {
      if (selected) {
        return [...new Set([...currentIds, ...visiblePortfolioItemIds])];
      }

      return currentIds.filter((currentId) => !visibleItemIdSet.has(currentId));
    });
  };

  const handlePortfolioTableSort = (columnId: PortfolioTableColumnId) => {
    setPortfolioTableSort((currentSort) => {
      if (currentSort?.columnId === columnId) {
        return {
          columnId,
          direction: currentSort.direction === "asc" ? "desc" : "asc"
        };
      }

      return { columnId, direction: "asc" };
    });
  };

  // App mode: the table/card edit button opens the dedicated Add/Edit page with
  // the row loaded (the inline form is gone there). Website: it loads the row
  // into the inline AddHoldingForm below (the original behavior), bumping the
  // remount nonce so re-editing the same row reloads it.
  const handleEditItem = (item: Phase1PortfolioItem) => {
    if (isAppMode) {
      router.push(`/app/portfolio-lab/add?edit=${encodeURIComponent(item.id)}`);
      return;
    }

    setEditItem(item);
    setEditNonce((nonce) => nonce + 1);
  };

  const handleDeleteItem = (item: Phase1PortfolioItem) => {
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: new Date().toISOString(),
      portfolioItems: deletePhase1PortfolioItem(currentWorkbook.portfolioItems, item.id),
      portfolioCollectionMemberships: currentWorkbook.portfolioCollectionMemberships.filter(
        (membership) => membership.portfolioItemId !== item.id
      ),
      lastImportExportStatus: undefined
    }));
    setSelectedItemIds((currentIds) => currentIds.filter((itemId) => itemId !== item.id));

    setUiStatus(`Deleted ${item.name}.`);
  };

  const handleDeleteSelectedItems = () => {
    const selectedIds = new Set(selectedItemIds);
    const selectedExistingItems = workbook.portfolioItems.filter((item) => selectedIds.has(item.id));

    if (selectedExistingItems.length === 0) {
      setUiStatus("Select one or more portfolio rows before deleting.");
      return;
    }

    const now = new Date().toISOString();

    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: now,
      portfolioItems: currentWorkbook.portfolioItems.filter((item) => !selectedIds.has(item.id)),
      portfolioCollectionMemberships: currentWorkbook.portfolioCollectionMemberships.filter(
        (membership) => !selectedIds.has(membership.portfolioItemId)
      ),
      lastImportExportStatus: `Deleted ${selectedExistingItems.length} selected row(s).`
    }));
    setSelectedItemIds([]);

    setUiStatus(`Deleted ${selectedExistingItems.length} selected row(s).`);
  };

  const handleTableColumnToggle = (columnId: PortfolioTableColumnId, visible: boolean) => {
    setVisibleTableColumnIds((currentIds) => {
      if (visible) {
        return currentIds.includes(columnId) ? currentIds : [...currentIds, columnId];
      }

      return currentIds.filter((currentId) => currentId !== columnId);
    });
  };

  const handleCsvImport = async (file: File | undefined) => {
    if (!file) return;

    const result = parsePortfolioCsv(await file.text());
    appendImportedPortfolio(result);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const handleXlsxImport = async (file: File | undefined) => {
    if (!file) return;

    const result = parsePortfolioXlsx(await file.arrayBuffer());
    appendImportedPortfolio(result);
    if (xlsxInputRef.current) xlsxInputRef.current.value = "";
  };

  const appendImportedPortfolio = (result: PortfolioImportResult) => {
    const errors = result.errors.map(formatImportError);
    const message = buildImportMessage(result.items.length, errors);

    onChange((currentWorkbook) => ({
      ...appendImportedPortfolioResult(currentWorkbook, result),
      lastImportExportStatus: message
    }));
    setUiStatus(message);
  };

  const handleExportCsv = () => {
    downloadFile(
      exportPortfolioCsv({
        items: workbook.portfolioItems,
        collections: workbook.portfolioCollections,
        memberships: workbook.portfolioCollectionMemberships
      }),
      "household-fire-planner-portfolio.csv",
      "text/csv;charset=utf-8"
    );
    const message = "Exported current portfolio to CSV.";
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: new Date().toISOString(),
      lastImportExportStatus: message
    }));
    setUiStatus(message);
  };

  const handleExportXlsx = () => {
    downloadFile(
      exportPortfolioXlsx({
        items: workbook.portfolioItems,
        collections: workbook.portfolioCollections,
        memberships: workbook.portfolioCollectionMemberships
      }),
      "household-fire-planner-portfolio.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const message = "Exported current portfolio to XLSX.";
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: new Date().toISOString(),
      lastImportExportStatus: message
    }));
    setUiStatus(message);
  };

  const handleRefreshEodPrices = async () => {
    const marketItems = workbook.portfolioItems
      .filter((item) => item.symbol && isMarketPricedType(item.type) && item.units !== undefined)
      .map((item) => ({ symbol: item.symbol!.toUpperCase(), type: item.type }));
    const symbols = [...new Set(marketItems.map((item) => item.symbol))];
    const assetTypes = marketItems
      .filter(
        (item, index, rows) => rows.findIndex((row) => row.symbol === item.symbol) === index
      )
      .map((item) => `${item.symbol}:${item.type}`)
      .join(",");

    if (symbols.length === 0) {
      setUiStatus("No market-priced rows with symbols and units to refresh.");
      return;
    }

    setIsRefreshing(true);
    setUiStatus(`Refreshing EOD prices for ${symbols.length} symbol(s)...`);

    try {
      const response = await fetch(
        `/api/prices?symbols=${encodeURIComponent(symbols.join(","))}&assetTypes=${encodeURIComponent(assetTypes)}`
      );
      const payload = (await response.json()) as {
        prices: FetchedMarketPrice[];
        warning: string;
      };

      if (!response.ok) {
        throw new Error(payload.warning || "Price refresh failed.");
      }

      const refreshedPriceCount = payload.prices.filter(isSuccessfulFetchedMarketPrice).length;
      const message =
        refreshedPriceCount > 0
          ? payload.warning
            ? `EOD refresh updated ${refreshedPriceCount} symbol(s), with warning: ${payload.warning}`
            : `EOD refresh updated ${refreshedPriceCount} symbol(s).`
          : payload.warning
            ? `EOD refresh checked, but no prices were updated: ${payload.warning}`
            : "EOD refresh checked, but no prices were updated. Manual prices may be needed.";
      const refreshedAt = new Date().toISOString();

      onChange((currentWorkbook) => ({
        ...currentWorkbook,
        updatedAt: refreshedAt,
        portfolioItems: applyFetchedPricesToPhase1Portfolio(
          currentWorkbook.portfolioItems,
          payload.prices
        ),
        lastEodRefreshAt:
          refreshedPriceCount > 0 ? refreshedAt : currentWorkbook.lastEodRefreshAt,
        lastImportExportStatus: message
      }));
      setUiStatus(message);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to refresh EOD prices.";
      setUiStatus(message);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <PortfolioPrivacyProvider hidden={valuesHidden}>
    <div className="space-y-6">
      <section className="space-y-5">
        <div className="flex flex-col gap-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">
              Understand Portfolio
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-[-0.02em] text-gray-900">
              Your whole household portfolio, in one private view
            </h1>
            {/* Hero blurb — website only. App mode drops it to open straight
                into the tracker. */}
            {!isAppMode ? (
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted-foreground)]">
                Bring every account and holding together, slice it by owner, tax bucket, or
                goal, and keep values current with one-click end-of-day prices.
              </p>
            ) : null}
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Portfolio features">
              {portfolioValueProps.map((prop) => (
                <li
                  key={prop.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--soft)] px-3 py-1 text-xs font-medium text-[var(--foreground)]"
                >
                  <prop.icon
                    aria-hidden="true"
                    size={14}
                    className="text-[var(--muted-foreground)]"
                  />
                  {prop.label}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            {/* Per-session privacy toggle. Default OFF (values shown). Masks
                every dollar figure across the tracker when ON; resets on
                reload. Shown on both website and app. */}
            <button
              type="button"
              aria-pressed={valuesHidden}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
              onClick={() => setValuesHidden((hidden) => !hidden)}
              title="Hide every dollar amount on this page. Percentages stay visible. Resets when you reload."
            >
              {valuesHidden ? (
                <EyeOff aria-hidden="true" size={16} />
              ) : (
                <Eye aria-hidden="true" size={16} />
              )}
              {valuesHidden ? "Show values" : "Hide values"}
            </button>
            <div className="flex items-center gap-1.5">
              <InfoPopover
                label="Update today's prices"
                content="Fetches the latest published end-of-day (closing) market prices for every holding that has a ticker symbol, then updates each row's unit price and value. Prices are end-of-day, so a date — not a time — is shown."
              />
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isRefreshing}
                onClick={() => void handleRefreshEodPrices()}
                title="Fetches the latest end-of-day market prices for your holdings with ticker symbols."
              >
                <RefreshCw
                  aria-hidden="true"
                  size={16}
                  className={isRefreshing ? "animate-spin" : undefined}
                />
                {isRefreshing ? "Updating prices..." : "Update today's prices"}
              </button>
            </div>
            <p className="text-[11px] text-[var(--muted-foreground)] sm:text-right">{lastEodLabel}</p>
            {visibleSyncStatus ? (
              <p className="text-sm text-[var(--muted-foreground)] sm:text-right">
                {visibleSyncStatus}
              </p>
            ) : null}
          </div>
        </div>

        {/* Primary actions, promoted to the TOP of the page — APP MODE ONLY.
            Adding a holding leads with a prominent button (links to the
            dedicated Add Holdings page). "Use in my plan" reuses the existing
            portfolio→FIRE-assets value (portfolioSummary.includedInFire, the
            same number the Plan's "Use my portfolio total" applies). On the
            website these live in the original inline form / per-tab buttons. */}
        {isAppMode ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/app/portfolio-lab/add"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                style={{ color: "#fff" }}
              >
                <Plus aria-hidden="true" size={18} />
                Add holdings
              </Link>
              <Link
                href="/app/fire-path/withdrawal-rate"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] transition hover:bg-[var(--muted)]"
                onClick={handleUseInPlan}
                title="Sets your plan's current FIRE assets to the total of holdings marked Include in FIRE."
              >
                Use in my plan
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
              <span className="text-xs text-[var(--muted-foreground)]">
                {maskCurrency(formatCurrency(portfolioSummary.includedInFire), valuesHidden)} marked
                for FIRE
              </span>
            </div>
            {!user ? (
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--primary)] underline-offset-4 hover:underline"
              >
                Sign in to save &amp; sync across devices
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Portfolio overview
              </h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                Choose a lens, then compare risk exposure or specific holdings.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Portfolio scope">
                <select
                  value={portfolioScope}
                  className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
                  onChange={(event) => {
                    setPortfolioScope(event.target.value as PortfolioScope);
                    setPortfolioFocus("all");
                  }}
                >
                  {portfolioScopeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Analyze by">
                <select
                  value={portfolioLens}
                  className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
                  onChange={(event) => {
                    setPortfolioLens(event.target.value as PortfolioLens);
                    setPortfolioFocus("all");
                  }}
                >
                  {portfolioLensOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Focus">
                <select
                  value={selectedPortfolioFocus}
                  className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
                  onChange={(event) => {
                    setPortfolioFocus(event.target.value);
                  }}
                >
                  <option value="all">All selected scope</option>
                  {lensSegments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Allocation view">
                <select
                  value={portfolioAllocationView}
                  className="min-h-11 w-full rounded-md border border-[var(--border)] bg-white px-3"
                  onChange={(event) =>
                    setPortfolioAllocationView(event.target.value as PortfolioAllocationView)
                  }
                >
                  {portfolioAllocationViewOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
            <section
              aria-label="Portfolio summary stats"
              className="grid gap-3 sm:grid-cols-2"
            >
              <Metric
                label="Analyzed net worth"
                value={maskCurrency(formatCurrency(analyzedSummary.totalNetBalance), valuesHidden)}
                note={`${analyzedSummary.itemCount} row${
                  analyzedSummary.itemCount === 1 ? "" : "s"
                } for ${selectedFocusLabel}`}
                featured
              />
              <Metric
                label="Assets"
                value={maskCurrency(formatCurrency(analyzedSummary.totalAssets), valuesHidden)}
                note="Before liabilities"
              />
              <Metric
                label="Liabilities"
                value={maskCurrency(
                  formatCurrency(analyzedSummary.totalLiabilities),
                  valuesHidden
                )}
                note="Debt impact"
                danger={analyzedSummary.totalLiabilities < 0}
              />
              <Metric
                label="Included in FIRE"
                value={maskCurrency(formatCurrency(analyzedSummary.includedInFire), valuesHidden)}
                note={
                  portfolioScope === "fire"
                    ? "Current scope · primary home excluded"
                    : "Rows marked Yes · primary home excluded"
                }
              />
            </section>

            <PortfolioVisualSummary
              segments={allocationSegments}
              ariaLabel="Selected portfolio allocation"
              title="Selected allocation"
              subtitle={`${selectedAllocationViewLabel} for ${selectedFocusLabel}`}
            />
          </div>

          <PortfolioLensBreakdown
            segments={lensSegments}
            lensLabel={selectedLensLabel}
            selectedFocus={selectedPortfolioFocus}
            onFocusChange={(focus) => {
              setPortfolioFocus(focus);
            }}
          />

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--foreground)]">
                {statusPresentation.message}
              </p>
              {statusPresentation.note ? (
                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--muted-foreground)]">
                  <Info aria-hidden="true" size={13} />
                  <span title={statusPresentation.note}>Market data note</span>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <PortfolioCollectionsPanel
        workbook={workbook}
        selectedItemIds={selectedItemIds}
        onChange={onChange}
        onClearSelection={() => setSelectedItemIds([])}
        setUiStatus={setUiStatus}
      />

      <PortfolioBacktestPanel workbook={workbook} />

      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Detailed holdings
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Rows shown here follow the selected overview scope and focus.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {selectedItemIds.length > 0 ? (
              <>
                <span className="text-sm font-medium text-[var(--foreground)]">
                  {selectedItemIds.length} selected
                </span>
                <button
                  type="button"
                  className="min-h-11 rounded-md border border-[var(--negative)]/30 px-3 text-sm font-semibold text-[var(--negative)] hover:bg-[var(--negative-bg)]"
                  onClick={handleDeleteSelectedItems}
                >
                  Delete selected
                </button>
              </>
            ) : null}
            <div className="relative">
              <button
                type="button"
                aria-label="Table columns"
                aria-expanded={tableSettingsOpen}
                className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                onClick={() => setTableSettingsOpen((open) => !open)}
              >
                <Settings aria-hidden="true" size={17} />
              </button>
              {tableSettingsOpen ? (
                <div
                  role="region"
                  aria-label="Detailed holdings table settings"
                  className="absolute right-0 z-20 mt-2 w-64 rounded-md border border-[var(--border)] bg-white p-3 shadow-lg"
                >
                  <p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">
                    Visible columns
                  </p>
                  <div className="mt-2 grid gap-1">
                    {portfolioTableColumns.map((column) => (
                      <label
                        key={column.id}
                        className="flex min-h-9 items-center gap-2 rounded px-2 text-sm hover:bg-[var(--muted)]"
                      >
                        <input
                          type="checkbox"
                          checked={visibleTableColumnSet.has(column.id)}
                          onChange={(event) =>
                            handleTableColumnToggle(column.id, event.target.checked)
                          }
                        />
                        <span>{column.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(event) => void handleCsvImport(event.target.files?.[0])}
            />
            <input
              ref={xlsxInputRef}
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
              onChange={(event) => void handleXlsxImport(event.target.files?.[0])}
            />
            <details className="relative">
              <summary
                aria-label="Import portfolio"
                className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] [&::-webkit-details-marker]:hidden"
                title="Import portfolio"
              >
                <Upload aria-hidden="true" size={17} />
                <span className="sr-only">Import portfolio</span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="min-h-11 w-full rounded px-3 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={(event) => {
                    closeFileMenu(event);
                    csvInputRef.current?.click();
                  }}
                >
                  CSV
                </button>
                <button
                  type="button"
                  className="min-h-11 w-full rounded px-3 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={(event) => {
                    closeFileMenu(event);
                    xlsxInputRef.current?.click();
                  }}
                >
                  XLSX
                </button>
              </div>
            </details>
            <details className="relative">
              <summary
                aria-label="Export portfolio"
                className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)] [&::-webkit-details-marker]:hidden"
                title="Export portfolio"
              >
                <Download aria-hidden="true" size={17} />
                <span className="sr-only">Export portfolio</span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-32 rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
                <button
                  type="button"
                  className="min-h-11 w-full rounded px-3 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={(event) => {
                    closeFileMenu(event);
                    handleExportCsv();
                  }}
                >
                  CSV
                </button>
                <button
                  type="button"
                  className="min-h-11 w-full rounded px-3 text-left text-sm hover:bg-[var(--muted)]"
                  onClick={(event) => {
                    closeFileMenu(event);
                    handleExportXlsx();
                  }}
                >
                  XLSX
                </button>
              </div>
            </details>
            <p className="text-sm text-[var(--muted-foreground)]">{visibleRowsLabel}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(220px,1fr)_auto] lg:items-end">
          <Field label="Search detailed holdings">
            <input
              type="search"
              value={portfolioTableSearch}
              placeholder="Search name, symbol, owner, account, tax, collection"
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) => setPortfolioTableSearch(event.target.value)}
            />
          </Field>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)]">
            <input
              type="checkbox"
              aria-label="Show selected only"
              checked={showSelectedOnly}
              onChange={(event) => setShowSelectedOnly(event.target.checked)}
            />
            <span>Selected only</span>
          </label>
        </div>

        {isAppMode ? (
          // App mode: holdings as a stacked card list inside a FIXED-HEIGHT
          // scroll container, so a long list scrolls internally instead of
          // making the page endless. (Website keeps the table below as-is.)
          <div className="max-h-[60vh] overflow-y-auto">
            <PortfolioHoldingCards
              items={filteredPortfolioItems}
              collections={workbook.portfolioCollections}
              memberships={workbook.portfolioCollectionMemberships}
              selectedItemIds={selectedItemIds}
              onSelectChange={handleSelectedItemChange}
              onIncludeInFireChange={handleIncludeInFireChange}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
            />
          </div>
        ) : (
        <div className="mt-4 max-h-[560px] overflow-auto rounded-md border border-[var(--border)]">
          <table className="w-full min-w-[1320px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[var(--muted-foreground)]">
                <Th>
                  <input
                    ref={selectAllRowsRef}
                    type="checkbox"
                    className="min-h-5 min-w-5"
                    aria-label="Select all visible holdings"
                    checked={allVisibleItemsSelected}
                    disabled={filteredPortfolioItems.length === 0}
                    onChange={(event) => handleSelectAllVisibleItems(event.target.checked)}
                  />
                </Th>
                {visibleTableColumnSet.has("type") ? (
                  <SortableTh
                    columnId="type"
                    label="Type"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("holdingType") ? (
                  <SortableTh
                    columnId="holdingType"
                    label="Holding Type"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("nameSymbol") ? (
                  <SortableTh
                    columnId="nameSymbol"
                    label="Name/Symbol"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("accountOwner") ? (
                  <SortableTh
                    columnId="accountOwner"
                    label="Account Owner"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("accountType") ? (
                  <SortableTh
                    columnId="accountType"
                    label="Account Type"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("taxTreatment") ? (
                  <SortableTh
                    columnId="taxTreatment"
                    label="Tax Treatment"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("includeInFire") ? (
                  <SortableTh
                    columnId="includeInFire"
                    label="Include in FIRE"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("unitPrice") ? (
                  <SortableTh
                    columnId="unitPrice"
                    label="Unit Price"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("units") ? (
                  <SortableTh
                    columnId="units"
                    label="Units"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("balance") ? (
                  <SortableTh
                    columnId="balance"
                    label="Balance"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                {visibleTableColumnSet.has("collections") ? (
                  <SortableTh
                    columnId="collections"
                    label="Collections"
                    sort={portfolioTableSort}
                    onSort={handlePortfolioTableSort}
                  />
                ) : null}
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolioItems.length === 0 ? (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-[var(--muted-foreground)]"
                    colSpan={visibleTableColumnCount}
                  >
                    No portfolio rows match the current table controls.
                  </td>
                </tr>
              ) : (
                filteredPortfolioItems.map((item) => {
                  const marketPriced = isMarketPricedType(item.type);
                  const balance = calculatePortfolioItemBalance(item);
                  const accountOwner = getPortfolioItemAccountOwner(item);
                  const accountType = item.accountType ?? "";
                  const collectionLabels = getCollectionLabelsForItem(
                    item.id,
                    workbook.portfolioCollections,
                    workbook.portfolioCollectionMemberships
                  );

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border)] odd:bg-white even:bg-gray-50 hover:bg-[var(--green-50)]"
                    >
                      <Td>
                        <input
                          type="checkbox"
                          className="min-h-5 min-w-5"
                          aria-label={`Select ${item.name}`}
                          checked={selectedItemIds.includes(item.id)}
                          onChange={(event) =>
                            handleSelectedItemChange(item.id, event.target.checked)
                          }
                        />
                      </Td>
                      {visibleTableColumnSet.has("type") ? (
                        <Td>{formatPortfolioEntryType(item.type)}</Td>
                      ) : null}
                      {visibleTableColumnSet.has("holdingType") ? (
                        <Td>{getHoldingTypeLabel(item)}</Td>
                      ) : null}
                      {visibleTableColumnSet.has("nameSymbol") ? (
                        <Td>
                          <div className="font-medium text-[var(--foreground)]">{item.name}</div>
                          {item.symbol ? (
                            <div className="text-xs uppercase text-[var(--muted-foreground)]">
                              {item.symbol}
                            </div>
                          ) : null}
                          {shouldShowRowPriceWarning(item.priceWarning) ? (
                            <div className="mt-1 text-xs text-[var(--gold-text)]">{item.priceWarning}</div>
                          ) : null}
                        </Td>
                      ) : null}
                      {visibleTableColumnSet.has("accountOwner") ? <Td>{accountOwner}</Td> : null}
                      {visibleTableColumnSet.has("accountType") ? (
                        <Td>{accountType || "--"}</Td>
                      ) : null}
                      {visibleTableColumnSet.has("taxTreatment") ? <Td>{item.taxBucket}</Td> : null}
                      {visibleTableColumnSet.has("includeInFire") ? (
                        <Td>
                          {item.type === "home" ? (
                            <span
                              className="inline-flex min-h-11 items-center text-xs text-gray-500"
                              title="Your primary home isn't a liquid FIRE asset. Model a planned sale in the FIRE inputs instead."
                            >
                              No (home excluded)
                            </span>
                          ) : (
                            <label className="inline-flex min-h-11 items-center gap-2">
                              <input
                                type="checkbox"
                                checked={item.includedInFire}
                                onChange={(event) =>
                                  handleIncludeInFireChange(item.id, event.target.checked)
                                }
                              />
                              <span>{item.includedInFire ? "Yes" : "No"}</span>
                            </label>
                          )}
                        </Td>
                      ) : null}
                      {visibleTableColumnSet.has("unitPrice") ? (
                        <Td>
                          {marketPriced && item.unitPrice !== undefined
                            ? maskCurrency(formatCurrency(item.unitPrice), valuesHidden)
                            : "--"}
                        </Td>
                      ) : null}
                      {visibleTableColumnSet.has("units") ? (
                        <Td>
                          {marketPriced && item.units !== undefined
                            ? formatNumber(item.units)
                            : "--"}
                        </Td>
                      ) : null}
                      {visibleTableColumnSet.has("balance") ? (
                        <Td className={balance < 0 ? "text-[var(--negative)]" : undefined}>
                          {maskCurrency(formatCurrency(balance), valuesHidden)}
                        </Td>
                      ) : null}
                      {visibleTableColumnSet.has("collections") ? (
                        <Td>
                          {collectionLabels.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {collectionLabels.map((label) => (
                                <span
                                  key={label}
                                  className="rounded-md bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--foreground)]"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[var(--muted-foreground)]">No collections</span>
                          )}
                        </Td>
                      ) : null}
                      <Td>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                            aria-label={`Edit ${item.name}`}
                            onClick={() => handleEditItem(item)}
                          >
                            <Pencil aria-hidden="true" size={16} />
                          </button>
                          <button
                            type="button"
                            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--negative)] hover:bg-[var(--negative-bg)]"
                            aria-label={`Delete ${item.name}`}
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 aria-hidden="true" size={16} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        )}
      </section>

      {/* Website inline "Add asset or liability" form — the original behavior.
          Renders the shared AddHoldingForm wired to the workbook + the panel's
          status line, and loads a row for editing when a table Edit is clicked
          (editNonce remounts it so re-editing the same row reloads it). In app
          mode this is removed; the Add Holdings page owns add/edit instead. */}
      {!isAppMode ? (
        <AddHoldingForm
          key={editNonce}
          onChange={onChange}
          onStatusChange={setUiStatus}
          editItem={editItem}
          onItemSaved={() => setEditItem(null)}
        />
      ) : null}

      {/* App-mode floating "+" — opens the dedicated Add Holdings page. Sits
          above the tab bar + home indicator (safe-area aware). Never shown on
          the website. */}
      {isAppMode ? (
        <Link
          href="/app/portfolio-lab/add"
          aria-label="Add holdings"
          className="fixed right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition hover:brightness-110"
          style={{
            backgroundColor: "#15803d",
            color: "#fff",
            bottom: "calc(4rem + env(safe-area-inset-bottom, 0px) + 1rem)"
          }}
        >
          <Plus aria-hidden="true" size={26} />
        </Link>
      ) : null}
    </div>
    </PortfolioPrivacyProvider>
  );
}

function Metric({
  label,
  value,
  note,
  featured,
  danger
}: {
  label: string;
  value: string;
  note: string;
  featured?: boolean;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-t-2 border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm ${
        danger ? "border-t-[var(--negative)]" : "border-t-[var(--primary)]"
      } ${featured ? "sm:col-span-2" : ""}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-1.5 font-extrabold tracking-tight tabular-nums ${
          featured ? "text-4xl" : "text-[28px] leading-9"
        } ${danger ? "text-[var(--negative)]" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p className="mt-1.5 text-xs text-[var(--muted-foreground)]">{note}</p>
    </div>
  );
}

// Mobile holdings view: a stacked, tappable card per row. Mirrors the table's
// data (name/symbol + value, owner/account, FIRE toggle) and reuses the SAME
// edit/delete/select handlers, so behavior and numbers match the desktop table.
function PortfolioHoldingCards({
  items,
  collections,
  memberships,
  selectedItemIds,
  onSelectChange,
  onIncludeInFireChange,
  onEdit,
  onDelete
}: {
  items: Phase1PortfolioItem[];
  collections: Phase1PanelProps["workbook"]["portfolioCollections"];
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"];
  selectedItemIds: string[];
  onSelectChange: (itemId: string, selected: boolean) => void;
  onIncludeInFireChange: (itemId: string, includedInFire: boolean) => void;
  onEdit: (item: Phase1PortfolioItem) => void;
  onDelete: (item: Phase1PortfolioItem) => void;
}) {
  const maskValue = useMaskCurrency();

  if (items.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-[var(--border)] px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">
        No portfolio rows match the current table controls.
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-3" aria-label="Holdings">
      {items.map((item) => {
        const balance = calculatePortfolioItemBalance(item);
        const accountOwner = getPortfolioItemAccountOwner(item);
        const collectionLabels = getCollectionLabelsForItem(item.id, collections, memberships);
        const metaParts = [getHoldingTypeLabel(item), accountOwner, item.accountType].filter(
          Boolean
        );

        return (
          <li
            key={item.id}
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                className="mt-1 min-h-5 min-w-5"
                aria-label={`Select ${item.name}`}
                checked={selectedItemIds.includes(item.id)}
                onChange={(event) => onSelectChange(item.id, event.target.checked)}
              />
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                aria-label={`Edit ${item.name}`}
                onClick={() => onEdit(item)}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-semibold text-[var(--foreground)]">
                    {item.name}
                  </span>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      balance < 0 ? "text-[var(--negative)]" : "text-gray-900"
                    }`}
                  >
                    {maskValue(formatCurrency(balance))}
                  </span>
                </div>
                {item.symbol ? (
                  <div className="text-xs uppercase text-[var(--muted-foreground)]">
                    {item.symbol}
                  </div>
                ) : null}
                <div className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {metaParts.join(" · ")}
                </div>
                {shouldShowRowPriceWarning(item.priceWarning) ? (
                  <div className="mt-1 text-xs text-[var(--gold-text)]">{item.priceWarning}</div>
                ) : null}
                {collectionLabels.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {collectionLabels.map((label) => (
                      <span
                        key={label}
                        className="rounded-md bg-[var(--muted)] px-2 py-0.5 text-xs font-medium text-[var(--foreground)]"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-[var(--border)] pt-3">
              {item.type === "home" ? (
                <span
                  className="text-xs text-gray-500"
                  title="Your primary home isn't a liquid FIRE asset. Model a planned sale in the FIRE inputs instead."
                >
                  Not in FIRE (home)
                </span>
              ) : (
                <label className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                  <input
                    type="checkbox"
                    checked={item.includedInFire}
                    onChange={(event) => onIncludeInFireChange(item.id, event.target.checked)}
                  />
                  <span>In FIRE: {item.includedInFire ? "Yes" : "No"}</span>
                </label>
              )}
              <div className="flex gap-1">
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                  aria-label={`Edit ${item.name} details`}
                  onClick={() => onEdit(item)}
                >
                  <Pencil aria-hidden="true" size={16} />
                </button>
                <button
                  type="button"
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--negative)] hover:bg-[var(--negative-bg)]"
                  aria-label={`Delete ${item.name}`}
                  onClick={() => onDelete(item)}
                >
                  <Trash2 aria-hidden="true" size={16} />
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PortfolioVisualSummary({
  segments,
  ariaLabel,
  title,
  subtitle
}: {
  segments: AllocationSegment[];
  ariaLabel: string;
  title: string;
  subtitle: string;
}) {
  const maskValue = useMaskCurrency();
  const totalVisualValue = segments.reduce((total, segment) => total + segment.visualValue, 0);

  return (
    <section
      aria-label={ariaLabel}
      className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            {title}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">{subtitle}</p>
        </div>
        <p className="rounded-full bg-[var(--green-50)] px-3 py-1 text-xs font-semibold text-[var(--primary-hover)]">
          {segments.length || 0} slices
        </p>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-[160px_1fr] sm:items-center">
        <div
          role="img"
          aria-label="Portfolio allocation visual"
          className="mx-auto grid h-36 w-36 place-items-center rounded-full"
          style={{ background: buildConicGradient(segments) }}
        >
          <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center shadow-sm">
            <span className="px-3 text-xs font-medium text-[var(--muted-foreground)]">
              {totalVisualValue > 0 ? "Current mix" : "No data yet"}
            </span>
          </div>
        </div>

        <div
          role="list"
          aria-label="Selected allocation segments"
          className="max-h-80 space-y-3 overflow-auto pr-2"
        >
          {segments.length > 0 ? (
            segments.map((segment) => (
              <div key={segment.label} role="listitem">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2 font-medium text-[var(--foreground)]">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span className="truncate">{segment.label}</span>
                  </span>
                  <span className="shrink-0 text-[var(--muted-foreground)]">
                    {formatPercent(segment.percent)}
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.max(segment.percent, 2)}%`,
                      backgroundColor: segment.color
                    }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                  {maskValue(formatCurrency(segment.balance))}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--muted-foreground)]">
              Add holdings to see your household allocation.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

function PortfolioLensBreakdown({
  segments,
  lensLabel,
  selectedFocus,
  onFocusChange
}: {
  segments: PortfolioLensSegment[];
  lensLabel: string;
  selectedFocus: string;
  onFocusChange: (focus: string) => void;
}) {
  const maskValue = useMaskCurrency();

  return (
    <section
      aria-label="Portfolio lens breakdown"
      className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">
            {lensLabel} comparison
          </h3>
          <p className="text-sm text-[var(--muted-foreground)]">
            Use these chips to focus the stats, allocation, and holdings table.
          </p>
        </div>
        <button
          type="button"
          className={`min-h-9 rounded-md border px-3 text-sm font-medium ${
            selectedFocus === "all"
              ? "border-[var(--primary)] bg-[var(--primary)] text-white"
              : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
          onClick={() => onFocusChange("all")}
        >
          All selected scope
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {segments.length > 0 ? (
          segments.map((segment) => (
            <button
              key={segment.id}
              type="button"
              className={`rounded-lg border p-3 text-left transition ${
                selectedFocus === segment.id
                  ? "border-[var(--primary)] bg-[var(--green-50)]"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
              onClick={() => onFocusChange(selectedFocus === segment.id ? "all" : segment.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="min-w-0 truncate font-semibold text-[var(--foreground)]">
                  {segment.label}
                </span>
                <span className="shrink-0 text-sm font-semibold text-[var(--foreground)]">
                  {formatPercent(segment.percent)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.max(segment.percent, 2)}%`,
                    backgroundColor: segment.color
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">
                {maskValue(formatCurrency(segment.balance))} across {segment.itemCount} row
                {segment.itemCount === 1 ? "" : "s"}
              </p>
            </button>
          ))
        ) : (
          <p className="text-sm text-[var(--muted-foreground)]">
            Add holdings to compare this lens.
          </p>
        )}
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="sticky top-0 z-10 bg-gray-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
      {children}
    </th>
  );
}

function SortableTh({
  columnId,
  label,
  sort,
  onSort
}: {
  columnId: PortfolioTableColumnId;
  label: string;
  sort: PortfolioTableSort | null;
  onSort: (columnId: PortfolioTableColumnId) => void;
}) {
  const active = sort?.columnId === columnId;
  const directionText = active ? (sort.direction === "asc" ? "ASC" : "DESC") : "";

  return (
    <th
      aria-sort={
        active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
      }
      className="sticky top-0 z-10 bg-gray-50 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted-foreground)]"
    >
      <button
        type="button"
        aria-label={`Sort by ${label}`}
        className="inline-flex min-h-9 items-center gap-1 rounded px-1 text-left font-semibold uppercase hover:bg-gray-100"
        onClick={() => onSort(columnId)}
      >
        <span aria-hidden="true">{label}</span>
        {directionText ? (
          <span
            aria-hidden="true"
            className="rounded bg-[var(--muted)] px-1 text-[10px] font-semibold text-[var(--foreground)]"
          >
            {directionText}
          </span>
        ) : null}
      </button>
    </th>
  );
}

function Td({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-3 align-top tabular-nums ${className ?? ""}`}>{children}</td>;
}

function getAnalyzedPortfolioItems(items: Phase1PortfolioItem[], scope: PortfolioScope) {
  if (scope === "fire") {
    return items.filter((item) => countsTowardFireAssets(item));
  }

  return items;
}

function summarizeDashboardPortfolio(items: Phase1PortfolioItem[]) {
  return items.reduce(
    (summary, item) => {
      const balance = calculatePortfolioItemBalance(item);

      if (balance >= 0) {
        summary.totalAssets += balance;
      } else {
        summary.totalLiabilities += balance;
      }

      summary.totalNetBalance += balance;

      if (countsTowardFireAssets(item)) {
        summary.includedInFire += balance;
      }

      summary.itemCount += 1;
      return summary;
    },
    {
      totalAssets: 0,
      totalLiabilities: 0,
      totalNetBalance: 0,
      includedInFire: 0,
      itemCount: 0
    }
  );
}

function buildLensSegments(
  items: Phase1PortfolioItem[],
  lens: PortfolioLens,
  collections: Phase1PanelProps["workbook"]["portfolioCollections"],
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"]
): PortfolioLensSegment[] {
  const groupById = new Map<
    string,
    {
      label: string;
      balance: number;
      itemCount: number;
    }
  >();
  const totalVisualValue = items.reduce(
    (total, item) => total + Math.abs(calculatePortfolioItemBalance(item)),
    0
  );

  for (const item of items) {
    const balance = calculatePortfolioItemBalance(item);
    const groups = getPortfolioLensGroups(item, lens, collections, memberships);

    for (const group of groups) {
      const existing = groupById.get(group.id) ?? {
        label: group.label,
        balance: 0,
        itemCount: 0
      };

      existing.balance += balance;
      existing.itemCount += 1;
      groupById.set(group.id, existing);
    }
  }

  if (totalVisualValue === 0) return [];

  return [...groupById.entries()]
    .map(([id, group], index) => {
      const visualValue = Math.abs(group.balance);

      return {
        id,
        label: group.label,
        balance: group.balance,
        visualValue,
        percent: (visualValue / totalVisualValue) * 100,
        color: allocationColors[index % allocationColors.length],
        itemCount: group.itemCount
      };
    })
    .filter((segment) => segment.visualValue > 0)
    .sort((a, b) => b.visualValue - a.visualValue);
}

function getFocusedPortfolioItems(
  items: Phase1PortfolioItem[],
  lens: PortfolioLens,
  focus: string,
  collections: Phase1PanelProps["workbook"]["portfolioCollections"],
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"]
) {
  if (focus === "all") return items;

  return items.filter((item) =>
    getPortfolioLensGroups(item, lens, collections, memberships).some(
      (group) => group.id === focus
    )
  );
}

function sortPortfolioItems(
  items: Phase1PortfolioItem[],
  sort: PortfolioTableSort | null,
  collections: Phase1PanelProps["workbook"]["portfolioCollections"],
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"]
) {
  if (!sort) return items;

  return [...items].sort((firstItem, secondItem) => {
    const comparison = comparePortfolioSortValues(
      getPortfolioSortValue(firstItem, sort.columnId, collections, memberships),
      getPortfolioSortValue(secondItem, sort.columnId, collections, memberships)
    );

    if (comparison !== 0) {
      return sort.direction === "asc" ? comparison : -comparison;
    }

    return firstItem.name.localeCompare(secondItem.name, undefined, {
      numeric: true,
      sensitivity: "base"
    });
  });
}

function filterPortfolioTableItems(
  items: Phase1PortfolioItem[],
  {
    collectionMemberships,
    collections,
    search,
    selectedItemIds,
    showSelectedOnly
  }: {
    collectionMemberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"];
    collections: Phase1PanelProps["workbook"]["portfolioCollections"];
    search: string;
    selectedItemIds: string[];
    showSelectedOnly: boolean;
  }
) {
  const selectedItemIdSet = new Set(selectedItemIds);
  const normalizedSearch = search.trim().toLowerCase();

  return items.filter((item) => {
    if (showSelectedOnly && !selectedItemIdSet.has(item.id)) return false;
    if (!normalizedSearch) return true;

    const searchableText = [
      item.name,
      item.symbol,
      formatPortfolioEntryType(item.type),
      getHoldingTypeLabel(item),
      getPortfolioItemAccountOwner(item),
      item.accountType,
      item.taxBucket,
      item.includedInFire ? "include in fire yes" : "include in fire no",
      ...getCollectionLabelsForItem(item.id, collections, collectionMemberships)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });
}

function getPortfolioSortValue(
  item: Phase1PortfolioItem,
  columnId: PortfolioTableColumnId,
  collections: Phase1PanelProps["workbook"]["portfolioCollections"],
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"]
) {
  if (columnId === "type") return formatPortfolioEntryType(item.type);
  if (columnId === "holdingType") return getHoldingTypeLabel(item) ?? "";
  if (columnId === "nameSymbol") return `${item.name} ${item.symbol ?? ""}`;
  if (columnId === "accountOwner") return getPortfolioItemAccountOwner(item);
  if (columnId === "accountType") return item.accountType ?? "";
  if (columnId === "taxTreatment") return item.taxBucket;
  if (columnId === "includeInFire") return item.includedInFire ? 1 : 0;
  if (columnId === "unitPrice") return isMarketPricedType(item.type) ? item.unitPrice : null;
  if (columnId === "units") return isMarketPricedType(item.type) ? item.units : null;
  if (columnId === "balance") return calculatePortfolioItemBalance(item);

  return getCollectionLabelsForItem(item.id, collections, memberships).join(" ");
}

function comparePortfolioSortValues(
  firstValue: string | number | null | undefined,
  secondValue: string | number | null | undefined
) {
  const firstEmpty = firstValue === null || firstValue === undefined || firstValue === "";
  const secondEmpty = secondValue === null || secondValue === undefined || secondValue === "";

  if (firstEmpty && secondEmpty) return 0;
  if (firstEmpty) return 1;
  if (secondEmpty) return -1;

  if (typeof firstValue === "number" && typeof secondValue === "number") {
    return firstValue - secondValue;
  }

  return String(firstValue).localeCompare(String(secondValue), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function getPortfolioLensGroups(
  item: Phase1PortfolioItem,
  lens: PortfolioLens,
  collections: Phase1PanelProps["workbook"]["portfolioCollections"],
  memberships: Phase1PanelProps["workbook"]["portfolioCollectionMemberships"]
): PortfolioLensGroup[] {
  if (lens === "accountOwner") {
    const label = getPortfolioItemAccountOwner(item);
    return [{ id: label, label }];
  }

  if (lens === "accountType") {
    const label = item.accountType || "Unassigned account type";
    return [{ id: label, label }];
  }

  if (lens === "taxTreatment") {
    const label = item.taxBucket || "Unassigned tax treatment";
    return [{ id: label, label }];
  }

  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));
  const itemMemberships = memberships.filter(
    (membership) => membership.portfolioItemId === item.id
  );

  if (itemMemberships.length === 0) {
    return [{ id: "collection:unassigned", label: "No collection" }];
  }

  return itemMemberships.map((membership) => ({
    id: membership.collectionId,
    label: collectionById.get(membership.collectionId)?.name ?? "Unknown collection"
  }));
}

function buildAllocationSegments(
  items: Phase1PortfolioItem[],
  allocationView: PortfolioAllocationView
): AllocationSegment[] {
  const balanceByLabel = new Map<string, number>();

  for (const item of items) {
    const label =
      allocationView === "holdings"
        ? getHoldingAllocationLabel(item)
        : getHoldingTypeLabel(item, { riskExposureOnly: true });
    if (!label) continue;

    const balance = calculatePortfolioItemBalance(item);

    balanceByLabel.set(label, (balanceByLabel.get(label) ?? 0) + balance);
  }

  const totalVisualValue = [...balanceByLabel.values()].reduce(
    (total, balance) => total + Math.abs(balance),
    0
  );

  if (totalVisualValue === 0) return [];

  return [...balanceByLabel.entries()]
    .map(([label, balance], index) => ({
      label,
      balance,
      visualValue: Math.abs(balance),
      percent: (Math.abs(balance) / totalVisualValue) * 100,
      color: allocationColors[index % allocationColors.length]
    }))
    .filter((segment) => segment.visualValue > 0)
    .sort((a, b) => b.visualValue - a.visualValue);
}

function getHoldingAllocationLabel(item: Phase1PortfolioItem) {
  return item.symbol?.trim().toUpperCase() || item.name;
}

function getSelectedFocusLabel(focus: string, segments: PortfolioLensSegment[]) {
  if (focus === "all") return "all selected scope";

  return segments.find((segment) => segment.id === focus)?.label ?? "all selected scope";
}

function buildConicGradient(segments: AllocationSegment[]) {
  if (segments.length === 0) return "#eff0eb";

  let cursor = 0;
  const stops = segments.map((segment) => {
    const start = cursor;
    const end = cursor + segment.percent * 3.6;
    cursor = end;
    return `${segment.color} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function getPortfolioStatusPresentation(status: string | null | undefined) {
  const fallback = "Import, export, or refresh portfolio rows when ready.";

  if (!status) return { message: fallback, note: undefined };

  const updatedMatch = status.match(/^EOD refresh updated (\d+) symbol\(s\)(?:, with warning: (.*))?$/);
  if (updatedMatch) {
    const count = Number(updatedMatch[1]);
    return {
      message: `${count} price${count === 1 ? "" : "s"} updated`,
      note: cleanProviderWarning(updatedMatch[2])
    };
  }

  const checkedMatch = status.match(/^EOD refresh checked, but no prices were updated: (.*)$/);
  if (checkedMatch) {
    return {
      message: "Price refresh checked",
      note: cleanProviderWarning(checkedMatch[1])
    };
  }

  return { message: status, note: undefined };
}

function cleanProviderWarning(warning: string | undefined) {
  const trimmed = warning?.trim();
  if (!trimmed) return undefined;
  return trimmed;
}

function closeFileMenu(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.closest("details")?.removeAttribute("open");
}

function buildImportMessage(importedCount: number, errors: string[]) {
  const base = `Imported ${importedCount} valid row(s).`;
  if (errors.length === 0) return base;

  return `${base} Skipped ${errors.length} invalid row(s): ${errors.slice(0, 3).join(" ")}`;
}

function formatImportError(error: { rowNumber: number; message: string }) {
  return `Row ${error.rowNumber}: ${error.message}`;
}

function appendImportedPortfolioResult(
  currentWorkbook: Phase1PanelProps["workbook"],
  result: PortfolioImportResult
): Phase1PanelProps["workbook"] {
  const now = new Date().toISOString();
  const nextCollections = [...currentWorkbook.portfolioCollections];
  const collectionByName = new Map(
    nextCollections.map((collection) => [normalizeCollectionName(collection.name), collection.id])
  );
  const existingCollectionIds = new Set(nextCollections.map((collection) => collection.id));
  const currentCollectionIds = new Set(nextCollections.map((collection) => collection.id));
  const collectionIdByImportedId = new Map<string, string>();

  for (const importedCollection of result.collections) {
    const normalizedName = normalizeCollectionName(importedCollection.name);
    const existingCollectionId = collectionByName.get(normalizedName);

    if (existingCollectionId) {
      collectionIdByImportedId.set(importedCollection.id, existingCollectionId);
      continue;
    }

    const collectionId = createCollectionId(importedCollection.name, existingCollectionIds);
    existingCollectionIds.add(collectionId);
    collectionByName.set(normalizedName, collectionId);
    collectionIdByImportedId.set(importedCollection.id, collectionId);
    nextCollections.push({
      ...importedCollection,
      id: collectionId,
      name: importedCollection.name.trim(),
      createdAt: importedCollection.createdAt || now,
      updatedAt: importedCollection.updatedAt || now
    });
  }

  const itemIdByImportedId = new Map<string, string>();
  const importedItems = result.items.map((item) => {
    const itemId = createItemId();
    itemIdByImportedId.set(item.id, itemId);
    return normalizePortfolioItemBalance({
      ...item,
      id: itemId
    });
  });
  const nextMemberships = [...currentWorkbook.portfolioCollectionMemberships];
  const membershipKeys = new Set(
    nextMemberships.map((membership) =>
      getMembershipKey(membership.collectionId, membership.portfolioItemId)
    )
  );

  for (const membership of result.memberships) {
    const collectionId =
      collectionIdByImportedId.get(membership.collectionId) ??
      (currentCollectionIds.has(membership.collectionId) ? membership.collectionId : undefined);
    const portfolioItemId = itemIdByImportedId.get(membership.portfolioItemId);

    if (!collectionId || !portfolioItemId) continue;

    const membershipKey = getMembershipKey(collectionId, portfolioItemId);
    if (membershipKeys.has(membershipKey)) continue;

    nextMemberships.push({ collectionId, portfolioItemId });
    membershipKeys.add(membershipKey);
  }

  return {
    ...currentWorkbook,
    updatedAt: now,
    portfolioItems: [...currentWorkbook.portfolioItems, ...importedItems],
    portfolioCollections: nextCollections,
    portfolioCollectionMemberships: nextMemberships
  };
}

function downloadFile(data: string | ArrayBuffer, filename: string, type: string) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createCollectionId(name: string, existingIds: Set<string>) {
  const baseId = `collection-${slugify(name) || "collection"}`;
  let id = baseId;
  let index = 2;

  while (existingIds.has(id)) {
    id = `${baseId}-${index}`;
    index += 1;
  }

  return id;
}

function getMembershipKey(collectionId: string, itemId: string) {
  return `${collectionId}:${itemId}`;
}

function normalizeCollectionName(name: string) {
  return name.trim().toLowerCase();
}

function getPortfolioItemAccountOwner(item: Phase1PortfolioItem) {
  if (isHouseholdSharedAssetType(item.type)) {
    return householdSharedOwner;
  }

  return item.accountOwner || "Unassigned owner";
}

function getHoldingTypeLabel(
  item: Phase1PortfolioItem,
  options: { riskExposureOnly?: boolean } = {}
) {
  if (item.type === "cash") return "Cash";
  if (item.type === "stock") return "Stock";
  if (item.type === "crypto") return "Crypto";
  if (item.type === "bond") return "Bond / Fixed Income";
  if (item.type === "etf") {
    return isFixedIncomeHolding(item) ? "Bond / Fixed Income" : "ETF";
  }
  if (item.type === "mutual_fund") {
    return isFixedIncomeHolding(item) ? "Bond / Fixed Income" : "Mutual Fund";
  }

  return options.riskExposureOnly ? null : formatAssetType(item.type);
}

function isFixedIncomeHolding(item: Phase1PortfolioItem) {
  const symbol = item.symbol?.trim().toUpperCase() ?? "";
  const text = `${symbol} ${item.name}`.toLowerCase();
  const knownFixedIncomeSymbols = new Set([
    "BND",
    "BNDX",
    "AGG",
    "TLT",
    "IEF",
    "SHY",
    "SGOV",
    "BIL",
    "VGIT",
    "VCLT",
    "VCIT",
    "MUB",
    "TIP"
  ]);

  if (knownFixedIncomeSymbols.has(symbol.replace(/\..*$/, ""))) return true;

  return [
    "bond",
    "treasury",
    "t-bill",
    "tbill",
    "fixed income",
    "municipal",
    "muni",
    "corporate bond",
    "high yield",
    "government",
    "aggregate bond"
  ].some((keyword) => text.includes(keyword));
}

function loadPortfolioTableColumnPreferences(): PortfolioTableColumnId[] {
  if (typeof window === "undefined") return defaultPortfolioTableColumnIds;

  try {
    const storedValue = window.localStorage.getItem(portfolioTableColumnsStorageKey);
    if (!storedValue) return defaultPortfolioTableColumnIds;

    const parsedValue = JSON.parse(storedValue) as unknown;
    if (!Array.isArray(parsedValue)) return defaultPortfolioTableColumnIds;

    const validColumnIds = new Set(defaultPortfolioTableColumnIds);
    const storedColumnIds = parsedValue.filter(
      (columnId): columnId is PortfolioTableColumnId =>
        typeof columnId === "string" && validColumnIds.has(columnId as PortfolioTableColumnId)
    );

    return storedColumnIds.length > 0 ? storedColumnIds : defaultPortfolioTableColumnIds;
  } catch {
    return defaultPortfolioTableColumnIds;
  }
}

function savePortfolioTableColumnPreferences(columnIds: PortfolioTableColumnId[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(portfolioTableColumnsStorageKey, JSON.stringify(columnIds));
  } catch {
    // Local preferences are nice to have. The table should still work if storage is blocked.
  }
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatPortfolioEntryType(type: Phase1AssetType) {
  const entryType = getPortfolioEntryType(type);

  return (
    portfolioEntryTypes.find((portfolioEntryType) => portfolioEntryType.value === entryType)
      ?.label ?? formatAssetType(type)
  );
}

function shouldShowRowPriceWarning(warning: string | undefined) {
  return Boolean(warning && warning !== genericMarketDataWarning);
}

function getVisibleWorkbookStatus(status: string | undefined) {
  if (status?.startsWith("Deleted ")) return null;
  return status;
}

function formatCurrency(value: number) {
  return value.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });
}

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: 6
  });
}

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

// EOD prices are end-of-day figures, so we show the date only (no time).
function formatEodDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

