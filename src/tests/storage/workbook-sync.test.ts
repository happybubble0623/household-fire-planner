import { describe, expect, it, vi } from "vitest";
import {
  pullWorkbook,
  pushWorkbook,
  reconcileWorkbook
} from "@/lib/storage/workbook-sync";
import type { Phase1Workbook } from "@/types/phase1";

function makeWorkbook(updatedAt: string): Phase1Workbook {
  // Only the fields the sync layer touches matter here; cast keeps the fixture
  // small while staying type-checked at the call sites that read updatedAt.
  return { id: "phase1-default", updatedAt } as Phase1Workbook;
}

function makePullClient(cloud: Phase1Workbook | null) {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: cloud ? { data: cloud } : null,
    error: null
  });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const from = vi.fn(() => ({ select, upsert }));
  return { client: { from }, from, select, eq, maybeSingle, upsert };
}

describe("workbook cloud sync", () => {
  it("pulls only the signed-in user's workbook", async () => {
    const cloud = makeWorkbook("2026-06-10T00:00:00.000Z");
    const mock = makePullClient(cloud);

    const result = await pullWorkbook("user-1", mock.client);

    expect(mock.from).toHaveBeenCalledWith("user_workbooks");
    expect(mock.select).toHaveBeenCalledWith("data");
    expect(mock.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toBe(cloud);
  });

  it("returns null when the user has no cloud workbook yet", async () => {
    const mock = makePullClient(null);
    const result = await pullWorkbook("user-1", mock.client);
    expect(result).toBeNull();
  });

  it("upserts the workbook scoped to the user, keyed on user_id", async () => {
    const mock = makePullClient(null);
    const workbook = makeWorkbook("2026-06-10T00:00:00.000Z");

    await pushWorkbook("user-1", workbook, mock.client);

    expect(mock.from).toHaveBeenCalledWith("user_workbooks");
    expect(mock.upsert).toHaveBeenCalledWith(
      {
        user_id: "user-1",
        data: workbook,
        updated_at: "2026-06-10T00:00:00.000Z"
      },
      { onConflict: "user_id" }
    );
  });

  it("seeds the cloud from local on first login (cloud empty)", async () => {
    const mock = makePullClient(null);
    const local = makeWorkbook("2026-06-10T00:00:00.000Z");

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ workbook: local, source: "local-pushed" });
    expect(mock.upsert).toHaveBeenCalledTimes(1);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", data: local }),
      { onConflict: "user_id" }
    );
  });

  it("last-write-wins: cloud wins when it is newer and is not re-pushed", async () => {
    const cloud = makeWorkbook("2026-06-11T00:00:00.000Z");
    const local = makeWorkbook("2026-06-10T00:00:00.000Z");
    const mock = makePullClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ workbook: cloud, source: "cloud" });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("last-write-wins: local wins when it is newer and is pushed up", async () => {
    const cloud = makeWorkbook("2026-06-09T00:00:00.000Z");
    const local = makeWorkbook("2026-06-12T00:00:00.000Z");
    const mock = makePullClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ workbook: local, source: "local" });
    expect(mock.upsert).toHaveBeenCalledTimes(1);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", data: local }),
      { onConflict: "user_id" }
    );
  });
});
