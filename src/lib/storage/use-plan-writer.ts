"use client";

import { useCallback } from "react";
import { ensurePhase1Workbook, savePhase1Workbook } from "@/lib/storage/phase1-store";
import { pushWorkbook } from "@/lib/storage/workbook-sync";
import { useSession } from "@/lib/auth/use-session";
import type { Phase1Workbook } from "@/types/phase1";

// The calculators live on their own routes, separate from the Plan workspace
// that owns the in-memory workbook + autosave. To let a calculator result flow
// back into the plan, this hook applies a mutation against the SAME persisted
// workbook the workspace reads on mount: Dexie is the source of truth (anonymous
// users never touch the network), and — exactly like the workspace's autosave
// flush — the saved copy is best-effort pushed to the signed-in user's cloud row
// so a later workspace reconcile sees an in-sync pair (never a stale overwrite).
//
// savePhase1Workbook normalizes and bumps updatedAt, so last-write-wins ordering
// is preserved automatically. Returns the saved workbook.
export function usePlanWorkbookWriter() {
  const { user } = useSession();

  return useCallback(
    async (mutate: (workbook: Phase1Workbook) => Phase1Workbook): Promise<Phase1Workbook> => {
      const current = await ensurePhase1Workbook();
      const saved = await savePhase1Workbook(mutate(current));

      if (user) {
        try {
          await pushWorkbook(user.id, saved);
        } catch {
          // Local-first: the Dexie write already succeeded. Cloud sync catches
          // up on the next workspace flush/reconcile.
        }
      }

      return saved;
    },
    [user]
  );
}
