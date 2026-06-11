import { describe, expect, it } from "vitest";
import { samplePlan } from "@/lib/data/sample-plan";
import { importPlanFromJson, serializePlanForExport } from "@/lib/storage/plan-io";

describe("plan export and import", () => {
  it("round trips a plan document through JSON export and import", () => {
    const exported = serializePlanForExport(samplePlan);
    const imported = importPlanFromJson(exported);

    expect(imported.id).toBe(samplePlan.id);
    expect(imported.marketPositions[0]?.quantitySnapshots).toHaveLength(2);
    expect(imported.cashAccounts[0]?.balanceSnapshots).toHaveLength(2);
    expect(imported.savedPaths[0]?.assumptions.fireRuleMode).toBe("withdrawal_rate");
  });
});
