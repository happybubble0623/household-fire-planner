import { describe, expect, it } from "vitest";
import {
  exportPortfolioCsv,
  exportPortfolioXlsx,
  parsePortfolioCsv,
  parsePortfolioXlsx,
  portfolioItemsToRows
} from "@/lib/phase1/portfolio-file";

describe("portfolio file import/export", () => {
  it("parses CSV rows with tolerant headers and liability normalization", () => {
    const csv = [
      "Type,Name,Symbol,Account Owner,Account Name,Account Type,Tax Bucket,Include In FIRE,Unit Price,Units,Balance,Collections",
      "ETF,Vanguard Total Stock,VTI,Joint,Brokerage,Taxable,Taxable,yes,300,10,,Core",
      "Liability,Mortgage,,Joint,Mortgage,Loan,Other,no,,,250000,Home"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.items).toHaveLength(2);
    expect(result.items[0]).toMatchObject({
      type: "etf",
      name: "Vanguard Total Stock",
      symbol: "VTI",
      accountOwner: "Joint",
      accountName: "Brokerage",
      accountType: "Taxable",
      includedInFire: true,
      balance: 3000
    });
    expect(result.items[1]).toMatchObject({
      type: "liability",
      accountOwner: "Household shared",
      balance: -250000,
      includedInFire: false
    });
  });

  it("forces home and liability imports and exports to household shared ownership", () => {
    const csv = [
      "type,name,account_owner,tax_bucket,include_in_fire,balance",
      "home,Primary Home,User 1,Property / Other,yes,600000",
      "liability,Mortgage,User 2,Not Applicable,yes,250000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.items.map((item) => item.accountOwner)).toEqual([
      "Household shared",
      "Household shared"
    ]);
    expect(
      portfolioItemsToRows({
        items: result.items,
        collections: [],
        memberships: []
      }).map((row) => row.account_owner)
    ).toEqual(["Household shared", "Household shared"]);
  });

  it("reports invalid rows while preserving valid rows", () => {
    const csv = [
      "type,name,include_in_fire,balance",
      "cash,Emergency Fund,yes,10000",
      "home,,no,600000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.items).toHaveLength(1);
    expect(result.errors).toEqual([{ rowNumber: 3, message: "Name is required." }]);
  });

  it("reports real spreadsheet row numbers after blank rows", () => {
    const csv = [
      "type,name,include_in_fire,balance",
      "cash,Emergency Fund,yes,10000",
      "",
      "home,,no,600000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.items).toHaveLength(1);
    expect(result.errors).toEqual([{ rowNumber: 4, message: "Name is required." }]);
  });

  it("exports stable CSV columns that can be reimported", () => {
    const csv = exportPortfolioCsv({
      items: [
        {
          id: "cash",
          type: "cash",
          name: "Emergency Fund",
          taxBucket: "Cash",
          includedInFire: true,
          balance: 10000
        }
      ],
      collections: [],
      memberships: []
    });

    expect(csv.split("\n")[0]).toBe(
      "type,name,symbol,account_owner,account_name,account_type,tax_bucket,include_in_fire,unit_price,units,balance,collections"
    );
    expect(parsePortfolioCsv(csv).items[0].balance).toBe(10000);
  });

  it("exports XLSX that can be reimported", () => {
    const exported = exportPortfolioXlsx({
      items: [
        {
          id: "btc",
          type: "crypto",
          name: "Bitcoin",
          symbol: "BTC-USD.CC",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 100000,
          units: 0.5,
          balance: 50000
        }
      ],
      collections: [],
      memberships: []
    });

    const result = parsePortfolioXlsx(exported);

    expect(result.errors).toEqual([]);
    expect(result.items[0]).toMatchObject({
      type: "crypto",
      symbol: "BTC-USD.CC",
      balance: 50000
    });
  });

  it("maps portfolio items to export rows", () => {
    expect(
      portfolioItemsToRows({
        items: [
          {
            id: "vti",
            type: "etf",
            name: "VTI",
            symbol: "VTI",
            accountOwner: "Joint",
            accountName: "Brokerage",
            accountType: "Taxable",
            taxBucket: "Taxable",
            includedInFire: true,
            unitPrice: 300,
            units: 10,
            balance: 3000
          }
        ],
        collections: [
          {
            id: "core",
            name: "Core",
            createdAt: "2026-06-08T00:00:00.000Z",
            updatedAt: "2026-06-08T00:00:00.000Z"
          }
        ],
        memberships: [{ collectionId: "core", portfolioItemId: "vti" }]
      })
    ).toEqual([
      {
        type: "etf",
        name: "VTI",
        symbol: "VTI",
        account_owner: "Joint",
        account_name: "Brokerage",
        account_type: "Taxable",
        tax_bucket: "Taxable",
        include_in_fire: "yes",
        unit_price: 300,
        units: 10,
        balance: 3000,
        collections: "Core"
      }
    ]);
  });

  it("exports account metadata and semicolon-separated collection names", () => {
    const csv = exportPortfolioCsv({
      items: [
        {
          id: "vti",
          type: "etf",
          name: "VTI",
          symbol: "VTI",
          accountOwner: "Joint",
          accountName: "Brokerage",
          accountType: "Taxable",
          taxBucket: "Taxable",
          includedInFire: true,
          unitPrice: 300,
          units: 10,
          balance: 3000
        }
      ],
      collections: [
        {
          id: "core",
          name: "Core",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z"
        },
        {
          id: "growth",
          name: "Growth",
          createdAt: "2026-06-08T00:00:00.000Z",
          updatedAt: "2026-06-08T00:00:00.000Z"
        }
      ],
      memberships: [
        { collectionId: "core", portfolioItemId: "vti" },
        { collectionId: "growth", portfolioItemId: "vti" }
      ]
    });

    const rows = csv.trim().split("\n");

    expect(rows[0]).toBe(
      "type,name,symbol,account_owner,account_name,account_type,tax_bucket,include_in_fire,unit_price,units,balance,collections"
    );
    expect(rows[1]).toBe("etf,VTI,VTI,Joint,Brokerage,Taxable,Taxable,yes,300,10,3000,Core; Growth");
  });

  it("imports collections and maps memberships to imported row IDs", () => {
    const csv = [
      "type,name,symbol,tax_bucket,include_in_fire,unit_price,units,balance,collections",
      "etf,VTI,VTI,Taxable,yes,300,10,,Core; Growth",
      "stock,Apple,AAPL,Taxable,yes,200,5,,core"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.collections.map((collection) => collection.name)).toEqual(["Core", "Growth"]);
    expect(result.memberships).toEqual([
      { collectionId: result.collections[0].id, portfolioItemId: result.items[0].id },
      { collectionId: result.collections[1].id, portfolioItemId: result.items[0].id },
      { collectionId: result.collections[0].id, portfolioItemId: result.items[1].id }
    ]);
  });

  it("imports legacy custom_group values as collections when collections is blank", () => {
    const csv = [
      "type,name,tax_bucket,include_in_fire,balance,collections,custom_group",
      "cash,Emergency Fund,Cash,yes,10000,,Cash Reserve",
      "home,Primary Home,Real Estate,no,600000,Home Equity,Legacy Home"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.collections.map((collection) => collection.name)).toEqual([
      "Cash Reserve",
      "Home Equity"
    ]);
    expect(result.memberships).toEqual([
      { collectionId: result.collections[0].id, portfolioItemId: result.items[0].id },
      { collectionId: result.collections[1].id, portfolioItemId: result.items[1].id }
    ]);
  });

  it("parses XLSX rows with stable direct balances", () => {
    const exported = exportPortfolioXlsx({
      items: [
        {
          id: "home",
          type: "home",
          name: "Primary Home",
          taxBucket: "Real Estate",
          includedInFire: false,
          balance: 600000
        },
        {
          id: "debt",
          type: "liability",
          name: "Credit Line",
          taxBucket: "Other",
          includedInFire: false,
          balance: -12000
        }
      ],
      collections: [],
      memberships: []
    });

    const result = parsePortfolioXlsx(exported);

    expect(result.errors).toEqual([]);
    expect(result.items.map((item) => item.balance)).toEqual([600000, -12000]);
  });

  it("reports missing balance inputs and invalid include flags", () => {
    const csv = [
      "type,name,include_in_fire,unit_price,units,balance",
      "stocks,Company Shares,maybe,10,,",
      "mutual fund,Index Fund,1,,,1000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].type).toBe("mutual_fund");
    expect(result.errors).toEqual([
      {
        rowNumber: 2,
        message: "Include in FIRE must be yes/no, true/false, or 1/0."
      }
    ]);
  });

  it("keeps options out of Phase 1 imports", () => {
    const csv = [
      "type,name,include_in_fire,unit_price,units,balance",
      "option,AAPL Call,yes,2.50,1,"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.items).toHaveLength(0);
    expect(result.errors).toEqual([
      {
        rowNumber: 2,
        message: 'Type "option" is not supported.'
      }
    ]);
  });

  it("imports direct bonds and fixed-income aliases for manual fallback rows", () => {
    const csv = [
      "type,name,symbol,tax_bucket,include_in_fire,unit_price,units,balance",
      "bond,US Treasury Bill,912797HD4,Tax-Deferred / Pre-tax,yes,98.5,100,",
      "fixed income,Manual Fixed Income Position,,Taxable,yes,,,1000"
    ].join("\n");

    const result = parsePortfolioCsv(csv);

    expect(result.errors).toEqual([]);
    expect(result.items.map((item) => item.type)).toEqual(["bond", "bond"]);
    expect(result.items.map((item) => item.balance)).toEqual([9850, 1000]);
  });
});
