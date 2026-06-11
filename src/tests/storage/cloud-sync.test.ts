import { describe, expect, it, vi } from "vitest";
import { deleteCloudPlan } from "@/lib/storage/supabase-sync";

describe("cloud plan sync", () => {
  it("deletes only the signed-in user's selected cloud plan", async () => {
    const eqUserId = vi.fn().mockResolvedValue({ error: null });
    const eqPlanId = vi.fn(() => ({ eq: eqUserId }));
    const deleteQuery = vi.fn(() => ({ eq: eqPlanId }));
    const from = vi.fn(() => ({ delete: deleteQuery }));
    const client = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-1" } },
          error: null
        })
      },
      from
    };

    await deleteCloudPlan("plan-1", client);

    expect(from).toHaveBeenCalledWith("plan_documents");
    expect(deleteQuery).toHaveBeenCalled();
    expect(eqPlanId).toHaveBeenCalledWith("id", "plan-1");
    expect(eqUserId).toHaveBeenCalledWith("user_id", "user-1");
  });
});
