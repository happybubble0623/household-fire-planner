import { calculatePortfolioItemBalance } from "@/lib/phase1/portfolio";
import type {
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1PortfolioItem
} from "@/types/phase1";

export type PortfolioCollectionHoldingSummary = {
  itemId: string;
  name: string;
  symbol?: string;
  accountOwner?: string;
  accountType?: string;
  taxBucket: string;
  balance: number;
  mixPercent: number;
};

export type PortfolioCollectionSummary = {
  collection: Phase1PortfolioCollection;
  collectionBalance: number;
  percentOfNetWorth: number;
  percentOfFireAssets: number;
  holdings: PortfolioCollectionHoldingSummary[];
};

type CollectionSummaryInput = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
};

export function addItemsToCollection(
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string,
  itemIds: string[]
) {
  const nextMemberships = [...memberships];
  const membershipKeys = new Set(
    memberships.map((membership) => getMembershipKey(membership.collectionId, membership.portfolioItemId))
  );

  for (const itemId of itemIds) {
    const membershipKey = getMembershipKey(collectionId, itemId);

    if (!membershipKeys.has(membershipKey)) {
      nextMemberships.push({ collectionId, portfolioItemId: itemId });
      membershipKeys.add(membershipKey);
    }
  }

  return nextMemberships;
}

export function removeItemFromCollection(
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string,
  itemId: string
) {
  return memberships.filter(
    (membership) =>
      !(membership.collectionId === collectionId && membership.portfolioItemId === itemId)
  );
}

export function deletePortfolioCollection(
  collections: Phase1PortfolioCollection[],
  memberships: Phase1PortfolioCollectionMembership[],
  collectionId: string
) {
  return {
    collections: collections.filter((collection) => collection.id !== collectionId),
    memberships: memberships.filter((membership) => membership.collectionId !== collectionId)
  };
}

export function getCollectionLabelsForItem(
  itemId: string,
  collections: Phase1PortfolioCollection[],
  memberships: Phase1PortfolioCollectionMembership[]
) {
  const collectionById = new Map(collections.map((collection) => [collection.id, collection]));

  return memberships
    .filter((membership) => membership.portfolioItemId === itemId)
    .map((membership) => collectionById.get(membership.collectionId)?.name)
    .filter((name): name is string => Boolean(name));
}

export function summarizePortfolioCollections({
  items,
  collections,
  memberships
}: CollectionSummaryInput): PortfolioCollectionSummary[] {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const totalNetWorth = items.reduce(
    (total, item) => total + calculatePortfolioItemBalance(item),
    0
  );
  const totalFireAssets = items.reduce(
    (total, item) =>
      item.includedInFire ? total + calculatePortfolioItemBalance(item) : total,
    0
  );

  return collections.map((collection) => {
    const collectionItemIds = new Set<string>();
    const collectionItems: Phase1PortfolioItem[] = [];

    for (const membership of memberships) {
      if (
        membership.collectionId !== collection.id ||
        collectionItemIds.has(membership.portfolioItemId)
      ) {
        continue;
      }

      collectionItemIds.add(membership.portfolioItemId);

      const item = itemById.get(membership.portfolioItemId);
      if (item) {
        collectionItems.push(item);
      }
    }

    const holdings = collectionItems.map((item) => ({
      item,
      balance: calculatePortfolioItemBalance(item)
    }));
    const collectionBalance = holdings.reduce(
      (total, holding) => total + holding.balance,
      0
    );

    return {
      collection,
      collectionBalance,
      percentOfNetWorth: toPercent(collectionBalance, totalNetWorth),
      percentOfFireAssets: toPercent(collectionBalance, totalFireAssets),
      holdings: holdings.map(({ item, balance }) => ({
        itemId: item.id,
        name: item.name,
        symbol: item.symbol,
        accountOwner: item.accountOwner,
        accountType: item.accountType,
        taxBucket: item.taxBucket,
        balance,
        mixPercent: toPercent(balance, collectionBalance)
      }))
    };
  });
}

function getMembershipKey(collectionId: string, itemId: string) {
  return `${collectionId}:${itemId}`;
}

function toPercent(numerator: number, denominator: number) {
  if (denominator === 0) return 0;
  return (numerator / denominator) * 100;
}
