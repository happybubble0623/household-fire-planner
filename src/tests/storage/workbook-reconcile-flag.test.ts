import { describe, expect, it, vi } from "vitest";
import {
  hasReconciledMetadata,
  markWorkbookReconciled
} from "@/lib/storage/workbook-reconcile-flag";

describe("hasReconciledMetadata — gates the one-time reconcile prompt", () => {
  it("is false for a brand-new account with no metadata", () => {
    expect(hasReconciledMetadata(null)).toBe(false);
    expect(hasReconciledMetadata({ user_metadata: {} })).toBe(false);
    expect(hasReconciledMetadata({ user_metadata: null })).toBe(false);
  });

  it("is true once the durable marker has been written", () => {
    expect(hasReconciledMetadata({ user_metadata: { workbookReconciled: true } })).toBe(
      true
    );
  });

  it("ignores unrelated metadata", () => {
    expect(hasReconciledMetadata({ user_metadata: { displayName: "Ada" } })).toBe(false);
  });
});

describe("markWorkbookReconciled — persists the durable per-account marker", () => {
  it("writes workbookReconciled into the user's auth metadata", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null });
    const client = { auth: { updateUser } };

    const ok = await markWorkbookReconciled(client);

    expect(ok).toBe(true);
    expect(updateUser).toHaveBeenCalledWith({ data: { workbookReconciled: true } });
  });

  it("reports failure (without throwing) when the write errors", async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: new Error("offline") });
    const client = { auth: { updateUser } };

    expect(await markWorkbookReconciled(client)).toBe(false);
  });

  it("reports failure (without throwing) when the write rejects", async () => {
    const updateUser = vi.fn().mockRejectedValue(new Error("network"));
    const client = { auth: { updateUser } };

    expect(await markWorkbookReconciled(client)).toBe(false);
  });

  it("is a no-op when Supabase is not configured (guest mode)", async () => {
    expect(await markWorkbookReconciled(null)).toBe(false);
  });
});
