"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState
} from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { isMarketPricedType, upsertPhase1PortfolioItem } from "@/lib/phase1/portfolio";
import {
  accountOwnerOptions,
  accountTypeOptions,
  buildSymbolInputLabel,
  createDefaultDraft,
  createStickyDefaultDraft,
  directNameOptions,
  draftToPortfolioItem,
  draftToSymbolOption,
  getDefaultTaxTreatmentForAccountType,
  getPortfolioEntryType,
  householdSharedOwner,
  includeCurrentSymbolOption,
  isHouseholdSharedAssetType,
  normalizeAccountOwner,
  parseDraftNumber,
  planOnlyHoldingTypes,
  portfolioEntryTypes,
  portfolioItemToDraft,
  taxTreatments,
  formatAssetType,
  type PortfolioDraft,
  type PortfolioEntryType
} from "@/lib/phase1/portfolio-draft";
import type { MarketSymbolSearchResult } from "@/types/market-data";
import type { Phase1AssetType, Phase1PortfolioItem, Phase1Workbook } from "@/types/phase1";

// The single, shared "Add asset or liability" form. Owns its own draft +
// symbol-search state and the add/edit logic, so the EXACT same component (and
// therefore the exact same field set, validation, and balance math) renders
// both inline at the bottom of PortfolioPanel and on the dedicated
// /app/portfolio-lab/add page. The numbers are never reimplemented — they come
// from src/lib/phase1/portfolio-draft + src/lib/phase1/portfolio.

export type AddHoldingFormHandle = {
  // Load an existing row into the form for editing (used by the table's edit
  // button in the inline placement). Scrolls the form into view.
  editItem: (item: Phase1PortfolioItem) => void;
  // Tell the form some rows were removed; if one is being edited, reset back to
  // a clean add draft so the form doesn't keep a deleted row open.
  notifyItemsRemoved: (itemIds: string[]) => void;
};

type AddHoldingFormProps = {
  onChange: React.Dispatch<React.SetStateAction<Phase1Workbook>>;
  // Optional status sink — PortfolioPanel passes its setUiStatus so add/edit
  // confirmations surface in the overview status line exactly as before. The
  // dedicated page omits it and shows its own confirmation instead.
  onStatusChange?: (status: string | null) => void;
  // Called after a row is successfully added (not on edit). Lets the dedicated
  // page show a "saved" confirmation / offer navigation without changing the
  // inline behavior.
  onItemAdded?: (item: Phase1PortfolioItem) => void;
  // Hide the section chrome (border/background/heading) when the host page
  // provides its own card — keeps the inline placement visually identical.
  bare?: boolean;
};

export const AddHoldingForm = forwardRef<AddHoldingFormHandle, AddHoldingFormProps>(
  function AddHoldingForm({ onChange, onStatusChange, onItemAdded, bare = false }, ref) {
    const formRef = useRef<HTMLDivElement>(null);
    const [draft, setDraft] = useState<PortfolioDraft>(() => createDefaultDraft("stock"));
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [symbolQuery, setSymbolQuery] = useState("");
    const [symbolOptions, setSymbolOptions] = useState<MarketSymbolSearchResult[]>([]);
    const [symbolStatus, setSymbolStatus] = useState<string | null>(null);
    const [isSearchingSymbols, setIsSearchingSymbols] = useState(false);

    const draftEntryType = getPortfolioEntryType(draft.type);
    const marketEntrySelected = isMarketPricedType(draft.type);
    const planOnlyMarketEntrySelected = marketEntrySelected && draft.noPublicTicker;
    const householdSharedEntry = isHouseholdSharedAssetType(draft.type);
    const selectedHoldingLabel = buildSymbolInputLabel(draft.symbol, draft.name);
    const nameOptions = directNameOptions[draft.type] ?? [];
    const nameOptionsListId =
      nameOptions.length > 0 ? `portfolio-name-options-${draft.type}` : undefined;
    const shouldShowSymbolOptions =
      marketEntrySelected &&
      !planOnlyMarketEntrySelected &&
      symbolOptions.length > 0 &&
      symbolQuery.trim().length >= 2 &&
      symbolQuery !== selectedHoldingLabel;

    const setStatus = (status: string | null) => {
      onStatusChange?.(status);
    };

    useEffect(() => {
      const query = symbolQuery.trim();
      if (
        !marketEntrySelected ||
        planOnlyMarketEntrySelected ||
        query.length < 2 ||
        query === selectedHoldingLabel
      ) {
        return;
      }

      const controller = new AbortController();
      const timeout = window.setTimeout(() => {
        const currentSymbolOption = draftToSymbolOption(draft);
        setIsSearchingSymbols(true);
        setSymbolStatus(null);

        void fetch(`/api/symbols?query=${encodeURIComponent(query)}`, {
          signal: controller.signal
        })
          .then(async (response) => {
            const payload = (await response.json()) as {
              symbols: MarketSymbolSearchResult[];
              warning: string | null;
            };

            if (!response.ok) {
              throw new Error(payload.warning ?? "Symbol search failed.");
            }

            const options = includeCurrentSymbolOption(payload.symbols, currentSymbolOption);
            setSymbolOptions(options);
            setSymbolStatus(
              payload.warning ?? (options.length === 0 ? "No matching symbols found." : null)
            );
          })
          .catch((error) => {
            if (controller.signal.aborted) return;

            setSymbolOptions(currentSymbolOption ? [currentSymbolOption] : []);
            setSymbolStatus(error instanceof Error ? error.message : "Symbol search failed.");
          })
          .finally(() => {
            if (!controller.signal.aborted) {
              setIsSearchingSymbols(false);
            }
          });
      }, 350);

      return () => {
        window.clearTimeout(timeout);
        controller.abort();
      };
    }, [draft, marketEntrySelected, planOnlyMarketEntrySelected, selectedHoldingLabel, symbolQuery]);

    const resetDraftAfterEdit = () => {
      setDraft(createDefaultDraft(draft.type));
      setEditingItemId(null);
      setSymbolQuery("");
      setSymbolOptions([]);
      setSymbolStatus(null);
      setIsSearchingSymbols(false);
    };

    const handleDraftEntryTypeChange = (entryType: PortfolioEntryType) => {
      const type = entryType === "market" ? "stock" : entryType;

      setDraft((currentDraft) => {
        const nextDefaultDraft = createDefaultDraft(type);
        const shouldUseTypeDefaults = isHouseholdSharedAssetType(type);

        return {
          ...nextDefaultDraft,
          accountOwner: shouldUseTypeDefaults
            ? householdSharedOwner
            : normalizeAccountOwner(currentDraft.accountOwner),
          accountType: shouldUseTypeDefaults ? nextDefaultDraft.accountType : currentDraft.accountType,
          taxBucket: shouldUseTypeDefaults ? nextDefaultDraft.taxBucket : currentDraft.taxBucket,
          includedInFire: currentDraft.includedInFire,
          customGroup: currentDraft.customGroup,
          noPublicTicker: entryType === "market" ? currentDraft.noPublicTicker : false
        };
      });
      setSymbolQuery("");
      setSymbolOptions([]);
      setSymbolStatus(null);
      setIsSearchingSymbols(false);
    };

    const handleAddOrSaveItem = () => {
      if (marketEntrySelected && !draft.noPublicTicker && !draft.symbol) {
        setStatus("Choose a holding from the search results before saving this row.");
        return;
      }

      if (marketEntrySelected && !draft.noPublicTicker && parseDraftNumber(draft.units) === null) {
        setStatus("Enter units for this market holding before saving.");
        return;
      }

      if (planOnlyMarketEntrySelected && parseDraftNumber(draft.balance) === null) {
        setStatus("Enter a current balance for this plan-only holding before saving.");
        return;
      }

      const item = draftToPortfolioItem(draft, editingItemId ?? undefined);
      if (!item) {
        setStatus("Add an item with a name and valid numeric values.");
        return;
      }

      // Editing a row updates it visibly in the table, so the old "Updated
      // portfolio row." confirmation was redundant noise — adds still report a
      // status, but edits surface none (message stays null).
      const wasEditing = Boolean(editingItemId);
      const message: string | null = wasEditing
        ? null
        : planOnlyMarketEntrySelected
          ? "Added plan-only holding. EOD refresh will skip this row."
          : isMarketPricedType(item.type) && item.unitPrice === undefined
          ? "Added market holding. Use Update today's prices to fill unit price."
          : "Added portfolio item.";

      onChange((currentWorkbook) => ({
        ...currentWorkbook,
        updatedAt: new Date().toISOString(),
        portfolioItems: upsertPhase1PortfolioItem(currentWorkbook.portfolioItems, item),
        ...(message ? { lastImportExportStatus: message } : {})
      }));
      setDraft(createStickyDefaultDraft(draft));
      setEditingItemId(null);
      setSymbolQuery("");
      setSymbolOptions([]);
      setSymbolStatus(null);
      setIsSearchingSymbols(false);
      setStatus(message);
      if (!wasEditing) {
        onItemAdded?.(item);
      }
    };

    const handleEditItem = (item: Phase1PortfolioItem) => {
      const nextDraft = portfolioItemToDraft(item);

      setDraft(nextDraft);
      setEditingItemId(item.id);
      setSymbolQuery(
        isMarketPricedType(item.type) ? buildSymbolInputLabel(item.symbol, item.name) : ""
      );
      setSymbolOptions(
        isMarketPricedType(item.type)
          ? includeCurrentSymbolOption([], draftToSymbolOption(nextDraft))
          : []
      );
      setSymbolStatus(null);
      setStatus(`Editing ${item.name}.`);
      window.setTimeout(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    };

    const handleCancelEdit = () => {
      resetDraftAfterEdit();
      setStatus("Edit cancelled.");
    };

    const handleSymbolSelect = (selectedOption: MarketSymbolSearchResult) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        type: selectedOption.type,
        symbol: selectedOption.symbol,
        name: selectedOption.name,
        noPublicTicker: false
      }));
      setSymbolQuery(buildSymbolInputLabel(selectedOption.symbol, selectedOption.name));
      setSymbolOptions([selectedOption]);
      setSymbolStatus(null);
    };

    const handleSymbolQueryChange = (query: string) => {
      setSymbolQuery(query);

      if (query.trim().length < 2) {
        const currentSymbolOption = draftToSymbolOption(draft);

        setSymbolOptions(currentSymbolOption ? [currentSymbolOption] : []);
        setSymbolStatus(null);
        setIsSearchingSymbols(false);
      }

      if (query !== selectedHoldingLabel) {
        setDraft((currentDraft) =>
          isMarketPricedType(currentDraft.type)
            ? {
                ...currentDraft,
                symbol: "",
                name: ""
              }
            : currentDraft
        );
      }
    };

    useImperativeHandle(
      ref,
      () => ({
        editItem: handleEditItem,
        notifyItemsRemoved: (itemIds: string[]) => {
          if (editingItemId && itemIds.includes(editingItemId)) {
            resetDraftAfterEdit();
          }
        }
      }),
      // handleEditItem / resetDraftAfterEdit are stable closures over state
      // setters and the current draft.type; editingItemId is the only value the
      // removal check reads.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [editingItemId, draft.type]
    );

    const heading = editingItemId ? "Edit portfolio row" : "Add asset or liability";

    const body = (
      <>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">{heading}</h2>
          {editingItemId ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
              onClick={handleCancelEdit}
            >
              <X aria-hidden="true" size={16} />
              Cancel
            </button>
          ) : null}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Type">
            <select
              value={draftEntryType}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) =>
                handleDraftEntryTypeChange(event.target.value as PortfolioEntryType)
              }
            >
              {portfolioEntryTypes.map((entryType) => (
                <option key={entryType.value} value={entryType.value}>
                  {entryType.label}
                </option>
              ))}
            </select>
          </Field>
          {marketEntrySelected ? (
            <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3 text-sm font-medium text-[var(--foreground)]">
              <input
                type="checkbox"
                aria-label="No public ticker / plan-only holding"
                checked={draft.noPublicTicker}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    noPublicTicker: event.target.checked,
                    symbol: event.target.checked ? "" : currentDraft.symbol,
                    unitPrice: event.target.checked ? "" : currentDraft.unitPrice,
                    units: event.target.checked ? "" : currentDraft.units
                  }))
                }
              />
              <span>No public ticker</span>
            </label>
          ) : null}
          {marketEntrySelected && !planOnlyMarketEntrySelected ? (
            <div className="relative block text-sm font-medium text-[var(--foreground)] md:col-span-2">
              <label htmlFor="portfolio-symbol-search">Holding</label>
              <div className="mt-1">
                <input
                  id="portfolio-symbol-search"
                  type="text"
                  value={symbolQuery}
                  placeholder="Search by symbol or name"
                  className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                  onChange={(event) => handleSymbolQueryChange(event.target.value)}
                />
                {shouldShowSymbolOptions ? (
                  <div className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-[var(--border)] bg-white p-1 shadow-lg">
                    {symbolOptions.map((option) => (
                      <button
                        key={`${option.symbol}-${option.type}`}
                        type="button"
                        className="grid min-h-11 w-full gap-0.5 rounded px-3 py-2 text-left hover:bg-[var(--muted)]"
                        onClick={() => handleSymbolSelect(option)}
                      >
                        <span className="font-semibold text-[var(--foreground)]">
                          {option.symbol} {option.name} {formatAssetType(option.type)}
                        </span>
                        <span className="text-xs font-normal text-[var(--muted-foreground)]">
                          {[option.exchange, option.currency].filter(Boolean).join(" | ")}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
              {symbolStatus ? (
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                  {symbolStatus}
                </p>
              ) : isSearchingSymbols ? (
                <p className="mt-1 text-xs font-normal text-[var(--muted-foreground)]">
                  Searching...
                </p>
              ) : null}
            </div>
          ) : null}
          {planOnlyMarketEntrySelected ? (
            <Field label="Holding Type">
              <select
                value={draft.type}
                className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    type: event.target.value as Phase1AssetType
                  }))
                }
              >
                {planOnlyHoldingTypes.map((holdingType) => (
                  <option key={holdingType.value} value={holdingType.value}>
                    {holdingType.label}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {planOnlyMarketEntrySelected || !marketEntrySelected ? (
            <Field label="Name">
              <input
                type="text"
                value={draft.name}
                list={planOnlyMarketEntrySelected ? undefined : nameOptionsListId}
                className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                onChange={(event) =>
                  setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
                }
              />
              {nameOptionsListId ? (
                <datalist id={nameOptionsListId}>
                  {nameOptions.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
              ) : null}
            </Field>
          ) : null}
          <div className="block text-sm font-medium text-[var(--foreground)]">
            <span>Account Owner</span>
            {householdSharedEntry ? (
              <div className="mt-1 flex min-h-11 items-center rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 text-sm text-[var(--foreground)]">
                {householdSharedOwner}
              </div>
            ) : (
              <div
                role="group"
                aria-label="Account Owner"
                className="mt-1 grid grid-cols-2 gap-1 rounded-md border border-[var(--border)] p-1"
              >
                {accountOwnerOptions.map((owner) => {
                  const selected = draft.accountOwner === owner;

                  return (
                    <button
                      key={owner}
                      type="button"
                      aria-pressed={selected}
                      className={`min-h-11 rounded px-3 text-sm font-medium ${
                        selected
                          ? "bg-[var(--foreground)] text-white"
                          : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                      }`}
                      onClick={() =>
                        setDraft((currentDraft) => ({
                          ...currentDraft,
                          accountOwner: owner
                        }))
                      }
                    >
                      {owner}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <Field label="Account Type">
            <select
              value={draft.accountType}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  accountType: event.target.value,
                  taxBucket: getDefaultTaxTreatmentForAccountType(event.target.value)
                }))
              }
            >
              {accountTypeOptions.map((accountType) => (
                <option key={accountType} value={accountType}>
                  {accountType}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Tax Treatment">
            <select
              value={draft.taxBucket}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  taxBucket: event.target.value
                }))
              }
            >
              {taxTreatments.map((taxTreatment) => (
                <option key={taxTreatment} value={taxTreatment}>
                  {taxTreatment}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Include in FIRE">
            <label className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--border)] px-3">
              <input
                type="checkbox"
                aria-label="Include in FIRE"
                checked={draft.includedInFire}
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    includedInFire: event.target.checked
                  }))
                }
              />
              <span>{draft.includedInFire ? "Yes" : "No"}</span>
            </label>
          </Field>
          {isMarketPricedType(draft.type) && !planOnlyMarketEntrySelected ? (
            <Field label="Units">
              <input
                type="text"
                inputMode="decimal"
                value={draft.units}
                className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    units: event.target.value
                  }))
                }
              />
            </Field>
          ) : (
            <Field label="Balance">
              <input
                type="text"
                inputMode="decimal"
                value={draft.balance}
                className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                onChange={(event) =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    balance: event.target.value
                  }))
                }
              />
            </Field>
          )}
        </div>
        <button
          type="button"
          className="mt-4 min-h-11 rounded-md bg-[var(--primary)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
          onClick={handleAddOrSaveItem}
        >
          {editingItemId ? "Save Row" : "Add Portfolio Row"}
        </button>
      </>
    );

    if (bare) {
      return <div ref={formRef}>{body}</div>;
    }

    return (
      <section
        ref={formRef}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
      >
        {body}
      </section>
    );
  }
);

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
