import { planDocumentSchema } from "@/lib/validation/plan-schema";
import type { PlanDocument } from "@/types/plan";

export function serializePlanForExport(plan: PlanDocument) {
  const parsed = planDocumentSchema.parse(plan);
  return JSON.stringify(parsed, null, 2);
}

export function importPlanFromJson(json: string) {
  const unknownPlan = JSON.parse(json);
  return planDocumentSchema.parse(unknownPlan);
}
