import { getSupabaseClient } from "@/lib/storage/supabase-sync";

// Durable, per-account marker recording that the one-time "which plan do you
// want to keep?" reconciliation has already happened for this user. Stored in
// the Supabase auth user's `user_metadata` (not the workbook row), so it needs
// no schema migration and travels with the account across devices: once the
// user has reconciled, every subsequent login silently trusts the account plan.
const RECONCILED_METADATA_KEY = "workbookReconciled";

// Minimal structural type so callers (and tests) can pass a hand-rolled mock
// without depending on the full supabase-js client surface.
type AuthMetadataClient = {
  auth: {
    updateUser: (attrs: { data: Record<string, unknown> }) => PromiseLike<{
      error: unknown;
    }>;
  };
};

/**
 * True when the signed-in user has already completed the initial workbook
 * reconciliation. Reads `user_metadata` straight off the session user, so it is
 * synchronous and needs no network call.
 */
export function hasReconciledMetadata(
  user: { user_metadata?: Record<string, unknown> | null } | null | undefined
): boolean {
  return Boolean(user?.user_metadata?.[RECONCILED_METADATA_KEY]);
}

/**
 * Persist the durable per-account marker. Best-effort: a transient network
 * failure must never break login or sync — the worst case is the prompt could
 * reappear on a later login, which the next successful write resolves. Returns
 * whether the marker was written so callers/tests can assert on it.
 */
export async function markWorkbookReconciled(
  client: AuthMetadataClient | null = null
): Promise<boolean> {
  const supabase =
    client ?? (getSupabaseClient() as unknown as AuthMetadataClient | null);
  if (!supabase) return false;

  try {
    const { error } = await supabase.auth.updateUser({
      data: { [RECONCILED_METADATA_KEY]: true }
    });
    return !error;
  } catch {
    return false;
  }
}
