import { describe, expect, it, vi } from "vitest";
import {
  pullWorkbook,
  pushWorkbook,
  reconcileWorkbook,
  resolveWorkbookConflict,
  workbookHasData,
  workbooksDiffer
} from "@/lib/storage/workbook-sync";
import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type { Phase1Workbook } from "@/types/phase1";

// A workbook that normalizes back to the default (no meaningful user data).
function emptyWorkbook(updatedAt: string): Phase1Workbook {
  return { ...defaultPhase1Workbook, updatedAt };
}

// A workbook carrying meaningful user data — a non-default expense figure makes
// it differ from the default in a user-meaningful (non-volatile) field.
function dataWorkbook(updatedAt: string, annualExpenses: number): Phase1Workbook {
  return {
    ...defaultPhase1Workbook,
    updatedAt,
    fireInputs: { ...defaultPhase1Workbook.fireInputs, annualExpenses }
  };
}

function makeClient(cloud: Phase1Workbook | null) {
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

describe("workbook cloud sync — pull/push scoping", () => {
  it("pulls only the signed-in user's workbook", async () => {
    const cloud = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const mock = makeClient(cloud);

    const result = await pullWorkbook("user-1", mock.client);

    expect(mock.from).toHaveBeenCalledWith("user_workbooks");
    expect(mock.select).toHaveBeenCalledWith("data");
    expect(mock.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toBe(cloud);
  });

  it("returns null when the user has no cloud workbook yet", async () => {
    const mock = makeClient(null);
    expect(await pullWorkbook("user-1", mock.client)).toBeNull();
  });

  it("upserts the workbook scoped to the user, keyed on user_id", async () => {
    const mock = makeClient(null);
    const workbook = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);

    await pushWorkbook("user-1", workbook, mock.client);

    expect(mock.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", data: workbook, updated_at: "2026-06-10T00:00:00.000Z" },
      { onConflict: "user_id" }
    );
  });
});

describe("workbookHasData", () => {
  it("treats a brand-new default workbook as having no data", () => {
    expect(workbookHasData(emptyWorkbook("2026-06-10T00:00:00.000Z"))).toBe(false);
  });

  it("detects meaningful user data", () => {
    expect(workbookHasData(dataWorkbook("2026-06-10T00:00:00.000Z", 123456))).toBe(true);
  });

  it("ignores volatile fields when comparing workbooks", () => {
    const a = emptyWorkbook("2026-06-10T00:00:00.000Z");
    const b = emptyWorkbook("2026-06-11T09:00:00.000Z");
    expect(workbooksDiffer(a, b)).toBe(false);
  });
});

describe("workbook reconcile — never silently overwrites real data", () => {
  it("BRANCH 1: cloud empty + local has data → push local up (adopt local)", async () => {
    const mock = makeClient(null);
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ status: "adopt-local", workbook: local });
    expect(mock.upsert).toHaveBeenCalledTimes(1);
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", data: local }),
      { onConflict: "user_id" }
    );
  });

  it("BRANCH 2: cloud has data + local empty/default → adopt cloud (no overwrite)", async () => {
    const cloud = dataWorkbook("2026-06-11T00:00:00.000Z", 222222);
    const local = emptyWorkbook("2026-06-10T00:00:00.000Z");
    const mock = makeClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ status: "adopt-cloud", workbook: cloud });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("BRANCH 3: both have meaningful data AND differ → conflict, nothing overwritten", async () => {
    const cloud = dataWorkbook("2026-06-11T00:00:00.000Z", 222222);
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const mock = makeClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ status: "conflict", local, cloud });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("BRANCH 4: effectively identical (ignoring timestamps) → in-sync, no prompt", async () => {
    const cloud = dataWorkbook("2026-06-11T00:00:00.000Z", 111111);
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const mock = makeClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ status: "in-sync", workbook: cloud });
    expect(mock.upsert).not.toHaveBeenCalled();
  });

  it("local has data, cloud row exists but is default → adopt local (push up)", async () => {
    const cloud = emptyWorkbook("2026-06-11T00:00:00.000Z");
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const mock = makeClient(cloud);

    const result = await reconcileWorkbook("user-1", local, mock.client);

    expect(result).toEqual({ status: "adopt-local", workbook: local });
    expect(mock.upsert).toHaveBeenCalledTimes(1);
  });
});

describe("resolveWorkbookConflict — applies the user's explicit choice", () => {
  it("'local' pushes the device's plan up, replacing the cloud copy", async () => {
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const cloud = dataWorkbook("2026-06-11T00:00:00.000Z", 222222);
    const mock = makeClient(cloud);

    const result = await resolveWorkbookConflict("user-1", "local", local, cloud, mock.client);

    expect(result).toEqual({ status: "adopt-local", workbook: local });
    expect(mock.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "user-1", data: local }),
      { onConflict: "user_id" }
    );
  });

  it("'cloud' adopts the account's plan without pushing", async () => {
    const local = dataWorkbook("2026-06-10T00:00:00.000Z", 111111);
    const cloud = dataWorkbook("2026-06-11T00:00:00.000Z", 222222);
    const mock = makeClient(cloud);

    const result = await resolveWorkbookConflict("user-1", "cloud", local, cloud, mock.client);

    expect(result).toEqual({ status: "adopt-cloud", workbook: cloud });
    expect(mock.upsert).not.toHaveBeenCalled();
  });
});
