import Dexie, { type Table } from "dexie";
import { samplePlan } from "@/lib/data/sample-plan";
import type { PlanDocument } from "@/types/plan";

export type StoredPlanDocument = {
  id: string;
  title: string;
  updatedAt: string;
  data: PlanDocument;
};

class FreedomPathDb extends Dexie {
  plans!: Table<StoredPlanDocument, string>;

  constructor() {
    super("freedom-path");
    this.version(1).stores({
      plans: "id, title, updatedAt"
    });
  }
}

let db: FreedomPathDb | null = null;

export function getFreedomPathDb() {
  if (!db) {
    db = new FreedomPathDb();
  }
  return db;
}

export async function saveLocalPlan(plan: PlanDocument) {
  const updatedPlan = {
    ...plan,
    updatedAt: new Date().toISOString()
  };

  await getFreedomPathDb().plans.put({
    id: updatedPlan.id,
    title: updatedPlan.title,
    updatedAt: updatedPlan.updatedAt,
    data: updatedPlan
  });

  return updatedPlan;
}

export async function listLocalPlans() {
  return getFreedomPathDb().plans.orderBy("updatedAt").reverse().toArray();
}

export async function loadLocalPlan(id: string) {
  const stored = await getFreedomPathDb().plans.get(id);
  return stored?.data ?? null;
}

export async function deleteLocalPlan(id: string) {
  await getFreedomPathDb().plans.delete(id);
}

export async function ensureSamplePlan() {
  const existing = await loadLocalPlan(samplePlan.id);
  if (existing) return existing;
  return saveLocalPlan(samplePlan);
}
