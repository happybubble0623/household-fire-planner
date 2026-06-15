// Pure draft <-> portfolio-item logic for the "Add asset or liability" form.
// Extracted from PortfolioPanel so the SAME logic powers both the inline form
// (bottom of the portfolio page) and the dedicated Add Holdings page. Keeping
// these as the single source of truth guarantees identical fields, defaults,
// validation, and balance math no matter where the form renders.

import type { MarketSymbolSearchResult, MarketSymbolSearchType } from "@/types/market-data";
import type { Phase1AssetType, Phase1PortfolioItem } from "@/types/phase1";
import {
  getDefaultIncludedInFire,
  isMarketPricedType,
  normalizePortfolioItemBalance
} from "@/lib/phase1/portfolio";

export type PortfolioEntryType = "market" | "cash" | "home" | "liability" | "other_asset";

export type PortfolioDraft = {
  type: Phase1AssetType;
  symbol: string;
  name: string;
  noPublicTicker: boolean;
  accountOwner: string;
  accountType: string;
  taxBucket: string;
  includedInFire: boolean;
  unitPrice: string;
  units: string;
  balance: string;
  customGroup: string;
};

export const portfolioEntryTypes: { value: PortfolioEntryType; label: string }[] = [
  { value: "market", label: "Market Holding" },
  { value: "cash", label: "Cash" },
  { value: "home", label: "Home" },
  { value: "liability", label: "Liability" },
  { value: "other_asset", label: "Other Asset" }
];

export const planOnlyHoldingTypes: {
  value: Extract<Phase1AssetType, "stock" | "etf" | "mutual_fund" | "crypto" | "bond">;
  label: string;
}[] = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "mutual_fund", label: "Mutual Fund / Trust" },
  { value: "crypto", label: "Crypto" },
  { value: "bond", label: "Bond / Fixed Income" }
];

export const directNameOptions: Partial<Record<Phase1AssetType, string[]>> = {
  home: ["Primary Residence", "Second Home", "Rental Property", "Land"],
  liability: [
    "Mortgage",
    "Credit Card",
    "Student Loan",
    "Auto Loan",
    "Personal Loan",
    "Other Debt"
  ],
  other_asset: ["Vehicle", "Private Equity", "Business Equity", "Collectible", "Other Asset"]
};

export const accountOwnerOptions = ["User 1", "User 2", "Joint", "Child"] as const;
export const householdSharedOwner = "Household shared";
export const accountTypeOptions = [
  "Taxable Investment Account",
  "Traditional 401(k)",
  "Traditional IRA",
  "Roth 401(k)",
  "Roth IRA",
  "HSA",
  "Cash Account",
  "Crypto Account / Wallet",
  "Real Estate / Home",
  "Liability / Loan",
  "Other Asset"
] as const;
export const taxTreatments = [
  "Taxable",
  "Tax-Deferred / Pre-tax",
  "Roth / After-tax",
  "HSA",
  "Not Applicable",
  "Property / Other",
  "Other"
] as const;

export function getPortfolioEntryType(type: Phase1AssetType): PortfolioEntryType {
  if (isMarketPricedType(type)) return "market";
  if (type === "cash" || type === "home" || type === "liability" || type === "other_asset") {
    return type;
  }

  return "market";
}

export function isHouseholdSharedAssetType(type: Phase1AssetType) {
  return type === "home" || type === "liability";
}

export function getDefaultAccountTypeForAssetType(type: Phase1AssetType) {
  if (type === "cash") return "Cash Account";
  if (type === "home") return "Real Estate / Home";
  if (type === "liability") return "Liability / Loan";
  if (type === "other_asset") return "Other Asset";
  return "Taxable Investment Account";
}

export function getDefaultTaxTreatmentForAccountType(accountType: string) {
  if (accountType === "Traditional 401(k)" || accountType === "Traditional IRA") {
    return "Tax-Deferred / Pre-tax";
  }

  if (accountType === "Roth 401(k)" || accountType === "Roth IRA") {
    return "Roth / After-tax";
  }

  if (accountType === "HSA") return "HSA";
  if (accountType === "Cash Account" || accountType === "Liability / Loan") {
    return "Not Applicable";
  }
  if (accountType === "Real Estate / Home") return "Property / Other";
  if (accountType === "Other Asset") return "Other";

  return "Taxable";
}

export function normalizeAccountOwner(owner: string | undefined, assetType?: Phase1AssetType) {
  if (assetType && isHouseholdSharedAssetType(assetType)) {
    return householdSharedOwner;
  }

  return accountOwnerOptions.includes(owner as (typeof accountOwnerOptions)[number])
    ? owner!
    : "User 1";
}

export function normalizeAccountType(accountType: string | undefined, assetType: Phase1AssetType) {
  return accountTypeOptions.includes(accountType as (typeof accountTypeOptions)[number])
    ? accountType!
    : getDefaultAccountTypeForAssetType(assetType);
}

export function normalizeTaxTreatment(
  taxTreatment: string | undefined,
  accountType: string | undefined,
  assetType: Phase1AssetType
) {
  if (taxTreatments.includes(taxTreatment as (typeof taxTreatments)[number])) {
    return taxTreatment!;
  }

  if (taxTreatment === "Traditional") return "Tax-Deferred / Pre-tax";
  if (taxTreatment === "Roth") return "Roth / After-tax";
  if (taxTreatment === "Cash") return "Not Applicable";

  return getDefaultTaxTreatmentForAccountType(normalizeAccountType(accountType, assetType));
}

export function createDefaultDraft(type: Phase1AssetType): PortfolioDraft {
  const accountType = getDefaultAccountTypeForAssetType(type);

  return {
    type,
    symbol: "",
    name: "",
    noPublicTicker: false,
    accountOwner: isHouseholdSharedAssetType(type) ? householdSharedOwner : "User 1",
    accountType,
    taxBucket: getDefaultTaxTreatmentForAccountType(accountType),
    includedInFire: getDefaultIncludedInFire(type),
    unitPrice: "",
    units: "",
    balance: "",
    customGroup: ""
  };
}

export function createStickyDefaultDraft(currentDraft: PortfolioDraft): PortfolioDraft {
  const defaultDraft = createDefaultDraft(currentDraft.type);

  return {
    ...defaultDraft,
    accountOwner: isHouseholdSharedAssetType(currentDraft.type)
      ? householdSharedOwner
      : normalizeAccountOwner(currentDraft.accountOwner),
    accountType: currentDraft.accountType,
    taxBucket: currentDraft.taxBucket,
    includedInFire: currentDraft.includedInFire,
    noPublicTicker: currentDraft.noPublicTicker,
    customGroup: currentDraft.customGroup
  };
}

export function draftToPortfolioItem(
  draft: PortfolioDraft,
  itemId = createItemId()
): Phase1PortfolioItem | null {
  const name = draft.name.trim();
  if (!name) return null;

  const marketPriced = isMarketPricedType(draft.type);
  const planOnlyMarket = marketPriced && draft.noPublicTicker;
  const unitPrice = marketPriced && !planOnlyMarket ? parseDraftNumber(draft.unitPrice) : undefined;
  const units = marketPriced && !planOnlyMarket ? parseDraftNumber(draft.units) : undefined;
  const directBalance =
    marketPriced && !planOnlyMarket ? undefined : parseDraftNumber(draft.balance);

  if (marketPriced && !planOnlyMarket && !draft.symbol.trim()) return null;
  if (marketPriced && !planOnlyMarket && units === null) return null;
  if ((!marketPriced || planOnlyMarket) && directBalance === null) return null;

  const savedUnitPrice = marketPriced && !planOnlyMarket ? unitPrice ?? undefined : undefined;
  const savedUnits = marketPriced && !planOnlyMarket ? units ?? 0 : undefined;
  const balance = marketPriced && !planOnlyMarket
    ? (savedUnitPrice ?? 0) * (savedUnits ?? 0)
    : directBalance ?? 0;

  return normalizePortfolioItemBalance({
    id: itemId,
    type: draft.type,
    name,
    symbol:
      marketPriced && !planOnlyMarket ? optionalString(draft.symbol.toUpperCase()) : undefined,
    accountOwner: getDraftAccountOwner(draft),
    accountType: optionalString(draft.accountType),
    taxBucket: draft.taxBucket,
    includedInFire: draft.includedInFire,
    unitPrice: savedUnitPrice,
    units: savedUnits,
    balance: draft.type === "liability" ? -Math.abs(balance) : balance,
    customGroup: optionalString(draft.customGroup),
    priceStatus: planOnlyMarket ? "manual" : undefined
  });
}

export function portfolioItemToDraft(item: Phase1PortfolioItem): PortfolioDraft {
  const marketPriced = isMarketPricedType(item.type);

  return {
    type: item.type,
    symbol: item.symbol ?? "",
    name: item.name,
    noPublicTicker: marketPriced && !item.symbol,
    accountOwner: normalizeAccountOwner(item.accountOwner, item.type),
    accountType: normalizeAccountType(item.accountType, item.type),
    taxBucket: normalizeTaxTreatment(item.taxBucket, item.accountType, item.type),
    includedInFire: item.includedInFire,
    unitPrice: marketPriced ? String(item.unitPrice ?? "") : "",
    units: marketPriced ? String(item.units ?? "") : "",
    balance: marketPriced && item.symbol ? "" : String(item.balance),
    customGroup: item.customGroup ?? ""
  };
}

export function parseDraftNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const numberValue = Number(trimmed);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function getDraftAccountOwner(draft: PortfolioDraft) {
  return isHouseholdSharedAssetType(draft.type)
    ? householdSharedOwner
    : optionalString(draft.accountOwner);
}

export function draftToSymbolOption(draft: PortfolioDraft): MarketSymbolSearchResult | null {
  const symbol = draft.symbol.trim();
  if (!symbol || !isMarketPricedType(draft.type)) return null;

  return {
    symbol,
    name: draft.name.trim() || symbol,
    type: draft.type as MarketSymbolSearchType
  };
}

export function buildSymbolInputLabel(symbol: string | undefined, name: string) {
  const trimmedSymbol = symbol?.trim();
  const trimmedName = name.trim();

  if (trimmedSymbol && trimmedName) return `${trimmedSymbol} - ${trimmedName}`;
  return trimmedSymbol ?? trimmedName;
}

export function includeCurrentSymbolOption(
  options: MarketSymbolSearchResult[],
  currentOption: MarketSymbolSearchResult | null
) {
  if (!currentOption) return options;

  const currentSymbol = currentOption.symbol.toUpperCase();
  if (options.some((option) => option.symbol.toUpperCase() === currentSymbol)) {
    return options;
  }

  return [currentOption, ...options];
}

export function createItemId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}`;
}

export function optionalString(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function formatAssetType(type: Phase1AssetType) {
  const labels: Partial<Record<Phase1AssetType, string>> = {
    etf: "ETF",
    mutual_fund: "Mutual Fund",
    other_asset: "Other Asset"
  };

  if (labels[type]) return labels[type]!;

  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
