import { defaultPhase1Workbook } from "@/lib/phase1/default-workbook";
import type {
  Phase1FireRuleMode,
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1Workbook
} from "@/types/phase1";

const defaultCollectionTimestamp = "2026-06-08T00:00:00.000Z";

type MigratablePhase1Workbook = Partial<Omit<Phase1Workbook, "schemaVersion">> & {
  schemaVersion?: string;
};

export function normalizePhase1Workbook(workbook: Phase1Workbook): Phase1Workbook {
  const migratableWorkbook = workbook as MigratablePhase1Workbook;
  const shouldMigrateCustomGroups =
    (migratableWorkbook.schemaVersion !== "phase1.2" &&
      migratableWorkbook.schemaVersion !== "phase1.3" &&
      migratableWorkbook.schemaVersion !== "phase1.4" &&
      migratableWorkbook.schemaVersion !== "phase1.5" &&
      migratableWorkbook.schemaVersion !== "phase1.6" &&
      migratableWorkbook.schemaVersion !== "phase1.7") ||
    !migratableWorkbook.portfolioCollections ||
    !migratableWorkbook.portfolioCollectionMemberships;
  const portfolioItems = migratableWorkbook.portfolioItems ?? [];
  const portfolioCollections = [...(migratableWorkbook.portfolioCollections ?? [])];
  const portfolioCollectionMemberships = dedupeMemberships(
    migratableWorkbook.portfolioCollectionMemberships ?? []
  );

  if (shouldMigrateCustomGroups) {
    migrateCustomGroupsToCollections(
      portfolioItems,
      portfolioCollections,
      portfolioCollectionMemberships,
      getCollectionTimestamp(migratableWorkbook.updatedAt)
    );
  }

  return {
    ...defaultPhase1Workbook,
    ...migratableWorkbook,
    id: defaultPhase1Workbook.id,
    schemaVersion: "phase1.7",
    fireInputs: {
      ...defaultPhase1Workbook.fireInputs,
      ...migratableWorkbook.fireInputs,
      fireRuleMode: normalizeFireRuleMode(migratableWorkbook.fireInputs?.fireRuleMode)
    },
    portfolioItems,
    portfolioCollections,
    portfolioCollectionMemberships
  };
}

function normalizeFireRuleMode(mode: unknown): Phase1FireRuleMode {
  if (mode === "income_only") return "income_stream";
  if (
    mode === "income_stream" ||
    mode === "principal_preserving" ||
    mode === "withdrawal_rate" ||
    mode === "coast_fire"
  ) {
    return mode;
  }

  return defaultPhase1Workbook.fireInputs.fireRuleMode;
}

function migrateCustomGroupsToCollections(
  portfolioItems: Phase1Workbook["portfolioItems"],
  portfolioCollections: Phase1PortfolioCollection[],
  portfolioCollectionMemberships: Phase1PortfolioCollectionMembership[],
  collectionTimestamp: string
) {
  const collectionByName = new Map(
    portfolioCollections.map((collection) => [normalizeCollectionName(collection.name), collection])
  );
  const existingIds = new Set(portfolioCollections.map((collection) => collection.id));
  const membershipKeys = new Set(
    portfolioCollectionMemberships.map((membership) =>
      membershipKey(membership.collectionId, membership.portfolioItemId)
    )
  );

  for (const item of portfolioItems) {
    const customGroup = item.customGroup?.trim();
    if (!customGroup) continue;

    const normalizedName = normalizeCollectionName(customGroup);
    let collection = collectionByName.get(normalizedName);
    if (!collection) {
      collection = {
        id: createCollectionId(customGroup, existingIds),
        name: customGroup,
        createdAt: collectionTimestamp,
        updatedAt: collectionTimestamp
      };
      portfolioCollections.push(collection);
      collectionByName.set(normalizedName, collection);
      existingIds.add(collection.id);
    }

    const key = membershipKey(collection.id, item.id);
    if (!membershipKeys.has(key)) {
      portfolioCollectionMemberships.push({
        collectionId: collection.id,
        portfolioItemId: item.id
      });
      membershipKeys.add(key);
    }
  }
}

function normalizeCollectionName(name: string) {
  return name.trim().toLowerCase();
}

function getCollectionTimestamp(updatedAt: string | undefined) {
  if (!updatedAt) return defaultCollectionTimestamp;
  const parsedDate = new Date(updatedAt);
  return Number.isNaN(parsedDate.getTime()) ? defaultCollectionTimestamp : updatedAt;
}

function dedupeMemberships(
  memberships: Phase1PortfolioCollectionMembership[]
): Phase1PortfolioCollectionMembership[] {
  const membershipKeys = new Set<string>();
  return memberships.filter((membership) => {
    const key = membershipKey(membership.collectionId, membership.portfolioItemId);
    if (membershipKeys.has(key)) return false;
    membershipKeys.add(key);
    return true;
  });
}

function createCollectionId(name: string, existingIds: Set<string>) {
  const slug =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "collection";

  let index = 1;
  let id = `collection-${slug}-${index}`;
  while (existingIds.has(id)) {
    index += 1;
    id = `collection-${slug}-${index}`;
  }
  return id;
}

function membershipKey(collectionId: string, portfolioItemId: string) {
  return `${collectionId}:${portfolioItemId}`;
}
