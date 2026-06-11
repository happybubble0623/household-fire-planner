import type { PlanDocument } from "@/types/plan";

const timestamp = "2026-06-06T22:00:00.000Z";

export const samplePlan: PlanDocument = {
  schemaVersion: "1.4",
  id: "sample-plan-freedom-path",
  title: "Sample Household FIRE Plan",
  createdAt: timestamp,
  updatedAt: timestamp,
  settings: {
    currency: "USD",
    planningMode: "individual",
    defaultSavedPathId: "path-base"
  },
  people: [
    {
      id: "person-primary",
      label: "Primary",
      birthDate: "1985-01-01",
      lifeExpectancy: 92,
      isPrimary: true
    }
  ],
  portfolioGroups: [
    {
      id: "group-brokerage",
      name: "Brokerage",
      description: "Market-sensitive investable assets"
    },
    {
      id: "group-cash",
      name: "Cash"
    },
    {
      id: "group-home",
      name: "Home"
    }
  ],
  marketPositions: [
    {
      id: "position-aapl",
      symbol: "AAPL",
      name: "Apple Inc.",
      assetType: "stock",
      portfolioGroupId: "group-brokerage",
      includedInFire: true,
      taxBucket: "taxable",
      quantitySnapshots: [
        {
          id: "aapl-2024-06-01",
          effectiveDate: "2024-06-01",
          quantity: 100,
          source: "manual",
          notes: "Initial backfill",
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: "aapl-2025-06-01",
          effectiveDate: "2025-06-01",
          quantity: 50,
          source: "manual",
          notes: "Updated holding",
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ],
      manualPriceOverrides: [
        {
          id: "aapl-price-2024-12-31",
          priceDate: "2024-12-31",
          price: 192,
          notes: "Sample historical close for local testing",
          createdAt: timestamp
        },
        {
          id: "aapl-price-2025-12-31",
          priceDate: "2025-12-31",
          price: 210,
          notes: "Sample historical close for local testing",
          createdAt: timestamp
        }
      ]
    }
  ],
  cashAccounts: [
    {
      id: "cash-emergency",
      name: "Emergency Cash",
      portfolioGroupId: "group-cash",
      includedInFire: true,
      taxBucket: "cash",
      balanceSnapshots: [
        {
          id: "cash-2024-06-01",
          effectiveDate: "2024-06-01",
          balance: 30000,
          notes: "Initial cash balance",
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: "cash-2025-06-01",
          effectiveDate: "2025-06-01",
          balance: 42000,
          notes: "Updated cash balance",
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    }
  ],
  manualAssets: [
    {
      id: "asset-home",
      name: "Primary Residence",
      assetType: "home",
      portfolioGroupId: "group-home",
      includedInFire: false,
      valuationSnapshots: [
        {
          id: "home-2025-01-01",
          effectiveDate: "2025-01-01",
          value: 500000,
          notes: "Starting home value",
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: "home-2025-12-31",
          effectiveDate: "2025-12-31",
          value: 525000,
          notes: "Year-end estimate",
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    }
  ],
  liabilityAccounts: [
    {
      id: "liability-mortgage",
      name: "Mortgage",
      liabilityType: "mortgage",
      includedInNetWorth: true,
      balanceSnapshots: [
        {
          id: "mortgage-2025-01-01",
          effectiveDate: "2025-01-01",
          balance: 320000,
          notes: "Starting mortgage balance",
          createdAt: timestamp,
          updatedAt: timestamp
        },
        {
          id: "mortgage-2025-12-31",
          effectiveDate: "2025-12-31",
          balance: 305000,
          notes: "Year-end mortgage balance",
          createdAt: timestamp,
          updatedAt: timestamp
        }
      ]
    }
  ],
  savedPaths: [
    {
      id: "path-base",
      name: "Base Path",
      description: "Default sample Saved Path",
      isDefault: true,
      isArchived: false,
      assumptions: {
        withdrawalRate: 0.05,
        globalInflationRate: 0.03,
        annualSavings: 24000,
        fireAssetBasis: "investable_only",
        includeHomeEquity: false,
        fireRuleMode: "withdrawal_rate"
      },
      planningEvents: [
        {
          id: "event-healthcare-65",
          name: "Healthcare Transition",
          eventType: "healthcare_transition",
          timing: {
            type: "exact_date",
            date: "2050-01-01"
          }
        }
      ],
      expenses: [
        {
          id: "expense-living",
          name: "Living expenses",
          category: "Living",
          amount: 7000,
          frequency: "monthly",
          startTiming: {
            type: "exact_date",
            date: "2026-01-01"
          },
          inflationAdjusted: true,
          isEssential: true,
          includedInFirePath: true
        }
      ],
      incomeStreams: [
        {
          id: "income-social-security",
          name: "Estimated Social Security",
          incomeType: "social_security",
          incomeCategory: "guaranteed",
          amount: 2600,
          frequency: "monthly",
          startTiming: {
            type: "exact_date",
            date: "2052-01-01"
          },
          endTiming: "lifetime",
          inflationAdjusted: true,
          taxable: true,
          includedInFirePath: true,
          personId: "person-primary"
        }
      ],
      socialSecurity: [
        {
          id: "ss-direct-primary",
          personId: "person-primary",
          entryMode: "direct_entry",
          monthlyBenefitTodayDollars: 2600,
          claimingTiming: {
            type: "exact_date",
            date: "2052-01-01"
          },
          inflationAdjusted: true,
          includedInFirePlan: true
        }
      ],
      taxSettings: {
        mode: "simple_blended",
        simpleEffectiveTaxRate: 0.15,
        accountWithdrawalMethod: "pro_rata"
      },
      allocation: {
        stockPercent: 70,
        bondEquivalentPercent: 20,
        cashPercent: 10,
        rebalanceFrequency: "annual"
      }
    }
  ]
};
