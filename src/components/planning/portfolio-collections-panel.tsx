"use client";

import { useMemo, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import {
  addItemsToCollection,
  deletePortfolioCollection
} from "@/lib/phase1/collections";
import type { Phase1PortfolioCollection } from "@/types/phase1";

export type PortfolioCollectionsPanelProps = {
  workbook: Phase1PanelProps["workbook"];
  selectedItemIds: string[];
  onChange: Phase1PanelProps["onChange"];
  onClearSelection: () => void;
  setUiStatus: (status: string) => void;
};

type CollectionDraft = {
  name: string;
  purpose: string;
};

const duplicateCollectionNameStatus = "A collection with this name already exists.";

export function PortfolioCollectionsPanel({
  workbook,
  selectedItemIds,
  onChange,
  onClearSelection,
  setUiStatus
}: PortfolioCollectionsPanelProps) {
  const [draft, setDraft] = useState<CollectionDraft>(createEmptyDraft);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CollectionDraft>(createEmptyDraft);

  const membershipCountByCollectionId = useMemo(() => {
    const counts = new Map<string, number>();

    for (const membership of workbook.portfolioCollectionMemberships) {
      counts.set(membership.collectionId, (counts.get(membership.collectionId) ?? 0) + 1);
    }

    return counts;
  }, [workbook.portfolioCollectionMemberships]);
  const availableCollectionId =
    selectedCollectionId &&
    workbook.portfolioCollections.some((collection) => collection.id === selectedCollectionId)
      ? selectedCollectionId
      : workbook.portfolioCollections[0]?.id ?? "";

  const handleCreateCollection = () => {
    const name = draft.name.trim();
    if (!name) {
      setUiStatus("Enter a collection name before creating it.");
      return;
    }

    if (hasDuplicateCollectionName(workbook.portfolioCollections, name)) {
      setUiStatus(duplicateCollectionNameStatus);
      return;
    }

    const now = new Date().toISOString();
    const collection: Phase1PortfolioCollection = {
      id: createCollectionId(
        name,
        new Set(workbook.portfolioCollections.map((currentCollection) => currentCollection.id))
      ),
      name,
      purpose: optionalString(draft.purpose),
      createdAt: now,
      updatedAt: now
    };

    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: now,
      portfolioCollections: [...currentWorkbook.portfolioCollections, collection],
      lastImportExportStatus: `Created collection ${collection.name}.`
    }));
    setSelectedCollectionId(collection.id);
    setDraft(createEmptyDraft());
    setUiStatus(`Created collection ${collection.name}.`);
  };

  const handleAddSelectedToCollection = () => {
    if (!availableCollectionId) {
      setUiStatus("Create a collection before adding selected rows.");
      return;
    }

    const availableItemIds = new Set(workbook.portfolioItems.map((item) => item.id));
    const itemIds = selectedItemIds.filter((itemId) => availableItemIds.has(itemId));
    if (itemIds.length === 0) {
      setUiStatus("Select one or more portfolio rows before adding them to a collection.");
      return;
    }

    const collectionName =
      workbook.portfolioCollections.find((collection) => collection.id === availableCollectionId)
        ?.name ?? "collection";
    const now = new Date().toISOString();

    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: now,
      portfolioCollectionMemberships: addItemsToCollection(
        currentWorkbook.portfolioCollectionMemberships,
        availableCollectionId,
        itemIds
      ),
      lastImportExportStatus: `Added ${itemIds.length} selected row(s) to ${collectionName}.`
    }));
    onClearSelection();
    setUiStatus(`Added ${itemIds.length} selected row(s) to ${collectionName}.`);
  };

  const handleStartEdit = (collection: Phase1PortfolioCollection) => {
    setEditingCollectionId(collection.id);
    setEditDraft({
      name: collection.name,
      purpose: collection.purpose ?? ""
    });
  };

  const handleSaveCollection = (collectionId: string) => {
    const name = editDraft.name.trim();
    if (!name) {
      setUiStatus("Enter a collection name before saving it.");
      return;
    }

    if (hasDuplicateCollectionName(workbook.portfolioCollections, name, collectionId)) {
      setUiStatus(duplicateCollectionNameStatus);
      return;
    }

    const now = new Date().toISOString();
    onChange((currentWorkbook) => ({
      ...currentWorkbook,
      updatedAt: now,
      portfolioCollections: currentWorkbook.portfolioCollections.map((collection) =>
        collection.id === collectionId
          ? {
              ...collection,
              name,
              purpose: optionalString(editDraft.purpose),
              updatedAt: now
            }
          : collection
      ),
      lastImportExportStatus: `Updated collection ${name}.`
    }));
    setEditingCollectionId(null);
    setEditDraft(createEmptyDraft());
    setUiStatus(`Updated collection ${name}.`);
  };

  const handleDeleteCollection = (collection: Phase1PortfolioCollection) => {
    const now = new Date().toISOString();

    onChange((currentWorkbook) => {
      const deleted = deletePortfolioCollection(
        currentWorkbook.portfolioCollections,
        currentWorkbook.portfolioCollectionMemberships,
        collection.id
      );

      return {
        ...currentWorkbook,
        updatedAt: now,
        portfolioCollections: deleted.collections,
        portfolioCollectionMemberships: deleted.memberships,
        lastImportExportStatus: `Deleted collection ${collection.name}.`
      };
    });
    if (editingCollectionId === collection.id) {
      setEditingCollectionId(null);
      setEditDraft(createEmptyDraft());
    }
    setUiStatus(`Deleted collection ${collection.name}.`);
  };

  return (
    <section className="mt-5 border-t border-[var(--border)] pt-5">
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
          <Field label="Collection name">
            <input
              type="text"
              value={draft.name}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) =>
                setDraft((currentDraft) => ({ ...currentDraft, name: event.target.value }))
              }
            />
          </Field>
          <Field label="Collection purpose">
            <input
              type="text"
              value={draft.purpose}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
              onChange={(event) =>
                setDraft((currentDraft) => ({ ...currentDraft, purpose: event.target.value }))
              }
            />
          </Field>
          <button
            type="button"
            className="min-h-11 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white"
            onClick={handleCreateCollection}
          >
            Create Collection
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <Field label="Add selected rows to collection">
            <select
              value={availableCollectionId}
              className="min-h-11 w-full rounded-md border border-[var(--border)] px-3 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={workbook.portfolioCollections.length === 0}
              onChange={(event) => setSelectedCollectionId(event.target.value)}
            >
              {workbook.portfolioCollections.length === 0 ? (
                <option value="">No collections yet</option>
              ) : (
                workbook.portfolioCollections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))
              )}
            </select>
          </Field>
          <button
            type="button"
            className="min-h-11 rounded-md border border-[var(--border)] px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={workbook.portfolioCollections.length === 0}
            onClick={handleAddSelectedToCollection}
          >
            Add Selected To Collection
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {workbook.portfolioCollections.length === 0 ? (
            <p className="py-3 text-sm text-[var(--muted-foreground)]">
              No collections yet.
            </p>
          ) : (
            workbook.portfolioCollections.map((collection) => {
              const isEditing = editingCollectionId === collection.id;
              const assignedRowCount = membershipCountByCollectionId.get(collection.id) ?? 0;

              return (
                <article key={collection.id} className="py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-[var(--foreground)]">
                        {collection.name}
                      </h3>
                      {collection.purpose ? (
                        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                          {collection.purpose}
                        </p>
                      ) : null}
                      <p className="mt-2 text-sm text-[var(--muted-foreground)]">
                        {assignedRowCount} row{assignedRowCount === 1 ? "" : "s"} assigned
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        aria-label={`Edit collection ${collection.name}`}
                        onClick={() => handleStartEdit(collection)}
                      >
                        <Pencil aria-hidden="true" size={16} />
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-red-700 hover:bg-red-50"
                        aria-label={`Delete collection ${collection.name}`}
                        onClick={() => handleDeleteCollection(collection)}
                      >
                        <Trash2 aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] md:items-end">
                      <Field label="Edit collection name">
                        <input
                          type="text"
                          value={editDraft.name}
                          className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                          onChange={(event) =>
                            setEditDraft((currentDraft) => ({
                              ...currentDraft,
                              name: event.target.value
                            }))
                          }
                        />
                      </Field>
                      <Field label="Collection purpose">
                        <input
                          type="text"
                          value={editDraft.purpose}
                          className="min-h-11 w-full rounded-md border border-[var(--border)] px-3"
                          onChange={(event) =>
                            setEditDraft((currentDraft) => ({
                              ...currentDraft,
                              purpose: event.target.value
                            }))
                          }
                        />
                      </Field>
                      <button
                        type="button"
                        className="min-h-11 rounded-md bg-[var(--foreground)] px-4 text-sm font-semibold text-white"
                        onClick={() => handleSaveCollection(collection.id)}
                      >
                        Save Collection
                      </button>
                      <button
                        type="button"
                        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
                        aria-label={`Cancel editing collection ${collection.name}`}
                        onClick={() => {
                          setEditingCollectionId(null);
                          setEditDraft(createEmptyDraft());
                        }}
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    </div>
                  ) : null}

                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-[var(--foreground)]">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function createEmptyDraft(): CollectionDraft {
  return {
    name: "",
    purpose: ""
  };
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

function hasDuplicateCollectionName(
  collections: Phase1PortfolioCollection[],
  name: string,
  excludeCollectionId?: string
) {
  const normalizedName = normalizeCollectionName(name);

  return collections.some(
    (collection) =>
      collection.id !== excludeCollectionId &&
      normalizeCollectionName(collection.name) === normalizedName
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeCollectionName(value: string) {
  return value.trim().toLowerCase();
}

function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}
