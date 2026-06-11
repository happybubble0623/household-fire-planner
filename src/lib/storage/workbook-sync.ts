import { getSupabaseClient } from "@/lib/storage/supabase-sync";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import { normalizePhase1Workbook } from "@/lib/phase1/workbook";
import type { Phase1Workbook } from "@/types/phase1";

const USER_WORKBOOKS_TABLE = "user_workbooks";

// Minimal structural type so callers (and tests) can pass a hand-rolled mock
// without depending on the full supabase-js client surface.
type WorkbookSyncClient = {
  from: (table: typeof USER_WORKBOOKS_TABLE) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => PromiseLike<{
          data: { data: Phase1Workbook } | null;
          error: unknown;
        }>;
      };
    };
    upsert: (
      values: { user_id: string; data: Phase1Workbook; updated_at: string },
      options: { onConflict: string }
    ) => PromiseLike<{ error: unknown }>;
  };
};

function resolveClient(client: WorkbookSyncClient | null): WorkbookSyncClient | null {
  return client ?? (getSupabaseClient() as unknown as WorkbookSyncClient | null);
}

/**
 * Read the signed-in user's cloud workbook. Returns null when there is no row
 * yet (first login) or when Supabase is not configured.
 */
export async function pullWorkbook(
  userId: string,
  client: WorkbookSyncClient | null = null
): Promise<Phase1Workbook | null> {
  const supabase = resolveClient(client);
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from(USER_WORKBOOKS_TABLE)
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.data ?? null;
}

/**
 * Upsert the signed-in user's cloud workbook (one row per user, keyed on
 * user_id). The JSON document's own updatedAt is mirrored into the column so
 * cloud ordering matches the document's last-write timestamp.
 */
export async function pushWorkbook(
  userId: string,
  workbook: Phase1Workbook,
  client: WorkbookSyncClient | null = null
): Promise<void> {
  const supabase = resolveClient(client);
  if (!supabase) {
    throw new Error("Supabase is not configured. Guest mode remains available.");
  }

  const { error } = await supabase.from(USER_WORKBOOKS_TABLE).upsert(
    {
      user_id: userId,
      data: workbook,
      updated_at: workbook.updatedAt ?? new Date().toISOString()
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

// Fields that change without the user editing anything (timestamps, transient
// refresh/import status). They must be ignored when deciding whether a workbook
// holds real user data or whether two workbooks meaningfully differ.
const VOLATILE_FIELDS = ["updatedAt", "lastEodRefreshAt", "lastImportExportStatus"] as const;

// Stable, key-sorted serialization so two structurally-equal workbooks compare
// equal regardless of property insertion order.
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function canonicalizeWorkbook(workbook: Phase1Workbook): string {
  const copy: Record<string, unknown> = { ...normalizePhase1Workbook(workbook) };
  for (const field of VOLATILE_FIELDS) {
    delete copy[field];
  }
  return stableStringify(copy);
}

/**
 * True when the workbook holds meaningful user-entered data — i.e. it differs
 * from the default/empty workbook in something other than a volatile field. A
 * brand-new local default does NOT count as data.
 */
export function workbookHasData(workbook: Phase1Workbook): boolean {
  return canonicalizeWorkbook(workbook) !== canonicalizeWorkbook(defaultPhase1Workbook);
}

/** True when two workbooks differ in any non-volatile (user-meaningful) field. */
export function workbooksDiffer(a: Phase1Workbook, b: Phase1Workbook): boolean {
  return canonicalizeWorkbook(a) !== canonicalizeWorkbook(b);
}

export type WorkbookReconcileResult =
  // Local was adopted and pushed to the cloud (cloud was empty/default, or it
  // is a first-time seed). Caller keeps its current local workbook.
  | { status: "adopt-local"; workbook: Phase1Workbook }
  // Cloud was adopted. Caller writes it into Dexie and renders it.
  | { status: "adopt-cloud"; workbook: Phase1Workbook }
  // Both sides are effectively identical — nothing to do.
  | { status: "in-sync"; workbook: Phase1Workbook }
  // Both sides hold meaningful data AND they differ. The caller MUST prompt the
  // user to choose; nothing has been overwritten on either side.
  | { status: "conflict"; local: Phase1Workbook; cloud: Phase1Workbook };

/**
 * Reconcile the local workbook with the user's cloud workbook on login, WITHOUT
 * ever silently overwriting real data.
 *
 * - Cloud empty/absent: push local up (adopt local). No prompt.
 * - Cloud has data, local is empty/default: adopt cloud. No prompt.
 * - Local has data, cloud is empty/default: push local up (adopt local). No prompt.
 * - Effectively identical: nothing to do (in-sync). No prompt.
 * - Both hold meaningful data and they differ: return a "conflict" for the
 *   caller to resolve via resolveWorkbookConflict — no side is touched.
 */
export async function reconcileWorkbook(
  userId: string,
  localWorkbook: Phase1Workbook,
  client: WorkbookSyncClient | null = null
): Promise<WorkbookReconcileResult> {
  const supabase = resolveClient(client);
  const cloudWorkbook = await pullWorkbook(userId, supabase);

  // No cloud row yet: seed it from local (whether local is real data or just a
  // default — there is nothing in the cloud to lose).
  if (!cloudWorkbook) {
    await pushWorkbook(userId, localWorkbook, supabase);
    return { status: "adopt-local", workbook: localWorkbook };
  }

  // Identical content: nothing to resolve, no write needed.
  if (!workbooksDiffer(localWorkbook, cloudWorkbook)) {
    return { status: "in-sync", workbook: cloudWorkbook };
  }

  const localHasData = workbookHasData(localWorkbook);
  const cloudHasData = workbookHasData(cloudWorkbook);

  // Cloud has data, local is empty/default → safe to pull cloud down.
  if (cloudHasData && !localHasData) {
    return { status: "adopt-cloud", workbook: cloudWorkbook };
  }

  // Local has data, cloud is empty/default → safe to push local up.
  if (localHasData && !cloudHasData) {
    await pushWorkbook(userId, localWorkbook, supabase);
    return { status: "adopt-local", workbook: localWorkbook };
  }

  // Both sides hold meaningful data and they differ → the user must choose.
  return { status: "conflict", local: localWorkbook, cloud: cloudWorkbook };
}

export type WorkbookConflictChoice = "local" | "cloud";

export type WorkbookConflictResolution = {
  workbook: Phase1Workbook;
  status: "adopt-local" | "adopt-cloud";
};

/**
 * Apply the user's explicit choice from a sync conflict. "local" pushes the
 * device's workbook up (replacing the cloud copy); "cloud" adopts the account's
 * workbook (the caller writes it into Dexie, replacing the local copy).
 */
export async function resolveWorkbookConflict(
  userId: string,
  choice: WorkbookConflictChoice,
  localWorkbook: Phase1Workbook,
  cloudWorkbook: Phase1Workbook,
  client: WorkbookSyncClient | null = null
): Promise<WorkbookConflictResolution> {
  const supabase = resolveClient(client);

  if (choice === "local") {
    await pushWorkbook(userId, localWorkbook, supabase);
    return { workbook: localWorkbook, status: "adopt-local" };
  }

  return { workbook: cloudWorkbook, status: "adopt-cloud" };
}
