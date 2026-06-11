import Dexie, { type Table } from "dexie";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import type { Phase1Workbook } from "@/types/phase1";

type StoredPhase1Workbook = {
  id: string;
  updatedAt: string;
  data: Phase1Workbook;
};

class Phase1Db extends Dexie {
  workbooks!: Table<StoredPhase1Workbook, string>;

  constructor() {
    super("freedom-path-phase1");
    this.version(1).stores({
      workbooks: "id, updatedAt"
    });
  }
}

let db: Phase1Db | null = null;

export function getPhase1Db() {
  if (!db) {
    db = new Phase1Db();
  }
  return db;
}

export async function savePhase1Workbook(workbook: Phase1Workbook) {
  const updatedWorkbook = {
    ...normalizePhase1Workbook(workbook),
    updatedAt: new Date().toISOString()
  };

  await getPhase1Db().workbooks.put({
    id: updatedWorkbook.id,
    updatedAt: updatedWorkbook.updatedAt,
    data: updatedWorkbook
  });

  return updatedWorkbook;
}

/**
 * Persist a workbook into Dexie *preserving* its updatedAt. Used when adopting
 * a cloud workbook during sync reconcile — we must not bump the timestamp, or
 * the freshly pulled cloud copy would look newer than itself on the next push.
 */
export async function persistPhase1Workbook(workbook: Phase1Workbook) {
  const normalizedWorkbook = normalizePhase1Workbook(workbook);

  await getPhase1Db().workbooks.put({
    id: normalizedWorkbook.id,
    updatedAt: normalizedWorkbook.updatedAt,
    data: normalizedWorkbook
  });

  return normalizedWorkbook;
}

export async function loadPhase1Workbook(id = defaultPhase1Workbook.id) {
  const stored = await getPhase1Db().workbooks.get(id);
  return stored ? normalizePhase1Workbook(stored.data) : null;
}

export async function ensurePhase1Workbook() {
  const existing = await loadPhase1Workbook(defaultPhase1Workbook.id);
  if (existing) return existing;
  return savePhase1Workbook(defaultPhase1Workbook);
}
