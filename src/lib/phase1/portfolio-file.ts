import * as XLSX from "xlsx";
import type {
  Phase1AssetType,
  Phase1PortfolioCollection,
  Phase1PortfolioCollectionMembership,
  Phase1PortfolioItem,
  PortfolioImportResult
} from "@/types/phase1";
import { getDefaultIncludedInFire, isMarketPricedType } from "@/lib/phase1/portfolio";

export const portfolioFileHeaders = [
  "type",
  "name",
  "symbol",
  "account_owner",
  "account_name",
  "account_type",
  "tax_bucket",
  "include_in_fire",
  "unit_price",
  "units",
  "balance",
  "collections"
] as const;

export type PortfolioFileHeader = (typeof portfolioFileHeaders)[number];
export type PortfolioExportRow = Record<PortfolioFileHeader, string | number>;
export type PortfolioFileExportInput = {
  items: Phase1PortfolioItem[];
  collections: Phase1PortfolioCollection[];
  memberships: Phase1PortfolioCollectionMembership[];
};

type LegacyPortfolioFileHeader = "custom_group";
type PortfolioImportHeader = PortfolioFileHeader | LegacyPortfolioFileHeader;
type RawPortfolioRow = Partial<Record<PortfolioImportHeader, string>>;
let importIdCounter = 0;
let importCollectionIdCounter = 0;

const typeAliases: Record<string, Phase1AssetType> = {
  stock: "stock",
  stocks: "stock",
  etf: "etf",
  mutual_fund: "mutual_fund",
  mutualfund: "mutual_fund",
  crypto: "crypto",
  cryptocurrency: "crypto",
  bond: "bond",
  bonds: "bond",
  fixed_income: "bond",
  fixedincome: "bond",
  "fixed-income": "bond",
  t_bill: "bond",
  tbill: "bond",
  treasury: "bond",
  cash: "cash",
  home: "home",
  house: "home",
  liability: "liability",
  debt: "liability",
  other: "other_asset",
  other_asset: "other_asset"
};

export function parsePortfolioCsv(csv: string): PortfolioImportResult {
  const workbook = XLSX.read(csv, { type: "string" });
  return parseWorkbook(workbook);
}

export function parsePortfolioXlsx(buffer: ArrayBuffer): PortfolioImportResult {
  const workbook = XLSX.read(buffer, { type: "array" });
  return parseWorkbook(workbook);
}

export function exportPortfolioCsv(input: PortfolioFileExportInput): string {
  return XLSX.utils.sheet_to_csv(rowsToSheet(portfolioItemsToRows(input)), {
    FS: ",",
    RS: "\n"
  });
}

export function exportPortfolioXlsx(input: PortfolioFileExportInput): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, rowsToSheet(portfolioItemsToRows(input)), "Portfolio");
  return XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function portfolioItemsToRows(input: PortfolioFileExportInput): PortfolioExportRow[] {
  const collectionNamesByItemId = mapCollectionNamesByItemId(input);

  return input.items.map((item) => ({
    type: item.type,
    name: item.name,
    symbol: item.symbol ?? "",
    account_owner: getExportAccountOwner(item),
    account_name: item.accountName ?? "",
    account_type: item.accountType ?? "",
    tax_bucket: item.taxBucket,
    include_in_fire: item.includedInFire ? "yes" : "no",
    unit_price: item.unitPrice ?? "",
    units: item.units ?? "",
    balance: item.type === "liability" ? -Math.abs(item.balance) : item.balance,
    collections: collectionNamesByItemId.get(item.id)?.join("; ") ?? ""
  }));
}

function parseWorkbook(workbook: XLSX.WorkBook): PortfolioImportResult {
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return {
      items: [],
      collections: [],
      memberships: [],
      errors: [{ rowNumber: 1, message: "Workbook has no sheets." }]
    };
  }

  const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[firstSheetName], {
    header: 1,
    defval: "",
    blankrows: true,
    raw: false
  });
  const [headers = [], ...dataRows] = rows;
  const normalizedHeaders = headers.map((header) => normalizeHeader(String(header)));

  const result = dataRows.reduce<PortfolioImportResult>(
    (result, row, index) => {
      const rowNumber = index + 2;
      if (isBlankRow(row)) {
        return result;
      }

      const parsed = parseRow(rowToRecord(normalizedHeaders, row), rowNumber);
      if (parsed.item) {
        result.items.push(parsed.item);
        addImportedCollections(result, parsed.item.id, parsed.collectionNames);
      }
      if (parsed.message) {
        result.errors.push({ rowNumber, message: parsed.message });
      }
      return result;
    },
    { items: [], collections: [], memberships: [], errors: [] }
  );

  return result;
}

function rowToRecord(headers: string[], row: unknown[]): RawPortfolioRow {
  return row.reduce<RawPortfolioRow>((record, cell, index) => {
    const header = headers[index];
    if (isPortfolioImportHeader(header)) {
      record[header] = String(cell).trim();
    }
    return record;
  }, {});
}

function isBlankRow(row: unknown[]) {
  return row.every((cell) => String(cell).trim() === "");
}

function parseRow(
  row: RawPortfolioRow,
  rowNumber: number
): { item?: Phase1PortfolioItem; collectionNames: string[]; message?: string } {
  const typeResult = parseAssetType(row.type);
  if (!typeResult.type) return { collectionNames: [], message: typeResult.message };

  const name = row.name?.trim() ?? "";
  if (!name) return { collectionNames: [], message: "Name is required." };

  const includeResult = parseIncludedInFire(row.include_in_fire, typeResult.type);
  if (includeResult.message) return { collectionNames: [], message: includeResult.message };

  const unitPrice = parseOptionalNumber(row.unit_price);
  if (unitPrice.message) return { collectionNames: [], message: `Unit price ${unitPrice.message}` };

  const units = parseOptionalNumber(row.units);
  if (units.message) return { collectionNames: [], message: `Units ${units.message}` };

  const importedBalance = parseOptionalNumber(row.balance);
  if (importedBalance.message) return { collectionNames: [], message: `Balance ${importedBalance.message}` };

  const hasUnitBalanceInputs = unitPrice.value !== undefined && units.value !== undefined;
  const hasDirectBalanceInput = importedBalance.value !== undefined;
  if (!hasDirectBalanceInput && !hasUnitBalanceInputs) {
    return { collectionNames: [], message: "Balance or unit price and units are required." };
  }

  const calculatedBalance =
    isMarketPricedType(typeResult.type) && hasUnitBalanceInputs
      ? (unitPrice.value ?? 0) * (units.value ?? 0)
      : importedBalance.value ?? (unitPrice.value ?? 0) * (units.value ?? 0);

  const balance =
    typeResult.type === "liability" ? -Math.abs(calculatedBalance) : calculatedBalance;

  return {
    item: {
      id: createImportId(rowNumber, typeResult.type, name),
      type: typeResult.type,
      name,
      symbol: optionalString(row.symbol),
      accountOwner: getImportedAccountOwner(typeResult.type, row.account_owner),
      accountName: optionalString(row.account_name),
      accountType: optionalString(row.account_type),
      taxBucket: optionalString(row.tax_bucket) ?? "Other",
      includedInFire: includeResult.value,
      unitPrice: unitPrice.value,
      units: units.value,
      balance,
      customGroup: optionalString(row.custom_group)
    },
    collectionNames: parseCollectionNames(row.collections || row.custom_group)
  };
}

function rowsToSheet(rows: PortfolioExportRow[]) {
  return XLSX.utils.json_to_sheet(rows, { header: [...portfolioFileHeaders] });
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase().replace(/\s+/g, "_");
}

function isPortfolioFileHeader(header: string): header is PortfolioFileHeader {
  return portfolioFileHeaders.includes(header as PortfolioFileHeader);
}

function isPortfolioImportHeader(header: string): header is PortfolioImportHeader {
  return isPortfolioFileHeader(header) || header === "custom_group";
}

function parseAssetType(value: string | undefined): { type?: Phase1AssetType; message?: string } {
  const normalized = normalizeAlias(value);
  if (!normalized) return { message: "Type is required." };

  const type = typeAliases[normalized];
  if (!type) return { message: `Type "${value}" is not supported.` };

  return { type };
}

function parseIncludedInFire(
  value: string | undefined,
  type: Phase1AssetType
): { value: boolean; message?: string } {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return { value: getDefaultIncludedInFire(type) };

  if (["yes", "true", "1"].includes(normalized)) return { value: true };
  if (["no", "false", "0"].includes(normalized)) return { value: false };

  return {
    value: getDefaultIncludedInFire(type),
    message: "Include in FIRE must be yes/no, true/false, or 1/0."
  };
}

function parseOptionalNumber(
  value: string | undefined
): { value?: number; message?: string } {
  const normalized = value?.trim();
  if (!normalized) return {};

  const numberValue = Number(normalized.replace(/[$,]/g, ""));
  if (!Number.isFinite(numberValue)) {
    return { message: "must be a number." };
  }

  return { value: numberValue };
}

function normalizeAlias(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, "_") ?? "";
}

function createImportId(rowNumber: number, type: Phase1AssetType, name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  importIdCounter += 1;
  return `item-${Date.now()}-${importIdCounter}-${rowNumber}-${type}-${slug || "portfolio-item"}`;
}

function createImportCollectionId(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  importCollectionIdCounter += 1;
  return `collection-${Date.now()}-${importCollectionIdCounter}-${slug || "portfolio-collection"}`;
}

function optionalString(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function getImportedAccountOwner(type: Phase1AssetType, accountOwner: string | undefined) {
  if (type === "home" || type === "liability") {
    return "Household shared";
  }

  return optionalString(accountOwner);
}

function getExportAccountOwner(item: Phase1PortfolioItem) {
  if (item.type === "home" || item.type === "liability") {
    return "Household shared";
  }

  return item.accountOwner ?? "";
}

function parseCollectionNames(value: string | undefined) {
  const seenNames = new Set<string>();
  const names: string[] = [];

  for (const name of (value ?? "").split(";")) {
    const trimmed = name.trim();
    const normalized = normalizeCollectionName(trimmed);
    if (!trimmed || seenNames.has(normalized)) continue;
    seenNames.add(normalized);
    names.push(trimmed);
  }

  return names;
}

function addImportedCollections(
  result: PortfolioImportResult,
  portfolioItemId: string,
  collectionNames: string[]
) {
  const collectionsByName = new Map(
    result.collections.map((collection) => [normalizeCollectionName(collection.name), collection])
  );
  const now = new Date().toISOString();

  for (const name of collectionNames) {
    const normalizedName = normalizeCollectionName(name);
    let collection = collectionsByName.get(normalizedName);

    if (!collection) {
      collection = {
        id: createImportCollectionId(name),
        name,
        createdAt: now,
        updatedAt: now
      };
      result.collections.push(collection);
      collectionsByName.set(normalizedName, collection);
    }

    result.memberships.push({
      collectionId: collection.id,
      portfolioItemId
    });
  }
}

function mapCollectionNamesByItemId(input: PortfolioFileExportInput) {
  const collectionsById = new Map(
    input.collections.map((collection) => [collection.id, collection.name])
  );
  const namesByItemId = new Map<string, string[]>();

  for (const membership of input.memberships) {
    const collectionName = collectionsById.get(membership.collectionId);
    if (!collectionName) continue;

    const names = namesByItemId.get(membership.portfolioItemId) ?? [];
    if (!names.some((name) => normalizeCollectionName(name) === normalizeCollectionName(collectionName))) {
      names.push(collectionName);
    }
    namesByItemId.set(membership.portfolioItemId, names);
  }

  return namesByItemId;
}

function normalizeCollectionName(value: string) {
  return value.trim().toLowerCase();
}
