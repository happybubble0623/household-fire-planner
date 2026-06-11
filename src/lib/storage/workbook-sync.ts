import { getSupabaseClient } from "@/lib/storage/supabase-sync";
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

export type WorkbookReconcileSource = "local-pushed" | "cloud" | "local";

export type WorkbookReconcileResult = {
  /** The winning workbook the caller should adopt. */
  workbook: Phase1Workbook;
  source: WorkbookReconcileSource;
};

function toTimestamp(value: string | undefined): number {
  const parsed = Date.parse(value ?? "");
  return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Last-write-wins reconcile by updatedAt between the local workbook and the
 * cloud workbook for a user.
 *
 * - Cloud empty (first login): push the local workbook up, keep local.
 * - Cloud newer-or-equal: cloud wins (caller writes it into Dexie).
 * - Local newer: push the local workbook up, keep local.
 */
export async function reconcileWorkbook(
  userId: string,
  localWorkbook: Phase1Workbook,
  client: WorkbookSyncClient | null = null
): Promise<WorkbookReconcileResult> {
  const supabase = resolveClient(client);
  const cloudWorkbook = await pullWorkbook(userId, supabase);

  if (!cloudWorkbook) {
    await pushWorkbook(userId, localWorkbook, supabase);
    return { workbook: localWorkbook, source: "local-pushed" };
  }

  if (toTimestamp(cloudWorkbook.updatedAt) >= toTimestamp(localWorkbook.updatedAt)) {
    return { workbook: cloudWorkbook, source: "cloud" };
  }

  await pushWorkbook(userId, localWorkbook, supabase);
  return { workbook: localWorkbook, source: "local" };
}
