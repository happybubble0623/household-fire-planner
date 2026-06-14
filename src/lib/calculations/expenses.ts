// Pure model + math for the living-expense estimator.
//
// Framework-free (no "use client") so the totals logic can be unit tested
// directly and the category structure shared between the interactive panel and
// any server-rendered copy. The calculator is a structured adder: many line
// items, each grouped under a category header, each carrying its OWN
// monthly/annual frequency. An item entered monthly contributes ×12 to the
// annual total; an item entered annually contributes as-is.

export type ItemFrequency = "monthly" | "annual";

// A single spending line item with a sourced/placeholder default. The default
// is expressed in `defaultFrequency` so it shows in its most natural basis
// (e.g. groceries monthly, property tax or travel annually).
export type ExpenseItem = {
  id: string;
  label: string;
  defaultAmount: number;
  defaultFrequency: ItemFrequency;
  step: number;
  // Short, always-visible basis note shown under the field (sourced defaults
  // mirror the BLS-style notes on the sibling calculators). Optional — the more
  // personal lines ship empty and carry no note.
  note?: string;
};

// A category header with its line items. Each group renders a subtotal.
export type ExpenseGroup = {
  id: string;
  label: string;
  items: ExpenseItem[];
};

// The live, user-editable value for one item: an amount in a chosen basis.
export type ExpenseEntry = { amount: number; frequency: ItemFrequency };

// Rounded placeholders in the ballpark of US national-average household
// spending (BLS Consumer Expenditure Survey). Starting points, not a budget —
// the more personal lines (HOA, childcare, debt, giving) ship empty.
export const EXPENSE_GROUPS: ExpenseGroup[] = [
  {
    id: "housing",
    label: "Housing",
    items: [
      {
        id: "rent-mortgage",
        label: "Rent / mortgage",
        defaultAmount: 1_500,
        defaultFrequency: "monthly",
        step: 50,
        note: "The biggest line for most households — varies a lot by region (BLS CE avg, rounded)."
      },
      {
        id: "property-tax",
        label: "Property tax",
        defaultAmount: 3_000,
        defaultFrequency: "annual",
        step: 100,
        note: "Homeowners only — roughly 0.5%–2% of home value a year. Renters: leave at 0."
      },
      {
        id: "home-insurance",
        label: "Home / renters insurance",
        defaultAmount: 1_500,
        defaultFrequency: "annual",
        step: 100,
        note: "Homeowners ~$1,500–$3,000/yr; renters far less. Use your premium."
      },
      {
        id: "hoa",
        label: "HOA / condo fees",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 25,
        note: "Condo or community dues, if any. Leave at 0 if none."
      },
      {
        id: "home-maintenance",
        label: "Maintenance & repairs",
        defaultAmount: 150,
        defaultFrequency: "monthly",
        step: 25,
        note: "Upkeep, lawn, small fixes — lumpy in practice; a monthly average works."
      }
    ]
  },
  {
    id: "utilities",
    label: "Utilities",
    items: [
      {
        id: "electricity",
        label: "Electricity",
        defaultAmount: 130,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "gas-heating",
        label: "Gas / heating",
        defaultAmount: 70,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "water-sewer-trash",
        label: "Water / sewer / trash",
        defaultAmount: 80,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "internet",
        label: "Internet",
        defaultAmount: 70,
        defaultFrequency: "monthly",
        step: 5
      },
      {
        id: "mobile-phone",
        label: "Mobile phone",
        defaultAmount: 100,
        defaultFrequency: "monthly",
        step: 5
      }
    ]
  },
  {
    id: "food",
    label: "Food",
    items: [
      {
        id: "groceries",
        label: "Groceries",
        defaultAmount: 500,
        defaultFrequency: "monthly",
        step: 25,
        note: "Food eaten at home. Scale up for more people or higher-cost areas (BLS CE avg, rounded)."
      },
      {
        id: "dining-out",
        label: "Dining out",
        defaultAmount: 300,
        defaultFrequency: "monthly",
        step: 25,
        note: "Restaurants and takeout — discretionary and easy to flex."
      }
    ]
  },
  {
    id: "transportation",
    label: "Transportation",
    items: [
      {
        id: "car-payment",
        label: "Car payment",
        defaultAmount: 400,
        defaultFrequency: "monthly",
        step: 25,
        note: "Loan or lease payment. Leave at 0 if you own outright."
      },
      {
        id: "fuel",
        label: "Fuel",
        defaultAmount: 200,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "auto-insurance",
        label: "Auto insurance",
        defaultAmount: 150,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "auto-maintenance",
        label: "Maintenance / repairs",
        defaultAmount: 100,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "public-transit",
        label: "Public transit",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 10,
        note: "Transit passes or fares, if you use them."
      },
      {
        id: "parking-tolls",
        label: "Parking / tolls",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 10
      }
    ]
  },
  {
    id: "healthcare",
    label: "Healthcare",
    items: [
      {
        id: "health-premiums",
        label: "Insurance premiums",
        defaultAmount: 450,
        defaultFrequency: "monthly",
        step: 25,
        note: "Your share of premiums. Rises sharply before Medicare — see the healthcare calculator."
      },
      {
        id: "health-out-of-pocket",
        label: "Out-of-pocket / copays",
        defaultAmount: 100,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "dental-vision",
        label: "Dental & vision",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "prescriptions",
        label: "Prescriptions",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 10
      }
    ]
  },
  {
    id: "insurance-other",
    label: "Insurance (other)",
    items: [
      {
        id: "life-insurance",
        label: "Life insurance",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 10,
        note: "Term-life premium, if any. Excludes health, auto, and home (counted above)."
      },
      {
        id: "umbrella-other",
        label: "Umbrella / other",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 10,
        note: "Disability, umbrella liability, or any policy not already counted."
      }
    ]
  },
  {
    id: "personal",
    label: "Personal",
    items: [
      {
        id: "clothing",
        label: "Clothing",
        defaultAmount: 120,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "personal-care",
        label: "Personal care",
        defaultAmount: 70,
        defaultFrequency: "monthly",
        step: 10,
        note: "Haircuts, toiletries, and grooming."
      },
      {
        id: "fitness",
        label: "Fitness / gym",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 5
      }
    ]
  },
  {
    id: "entertainment",
    label: "Entertainment & leisure",
    items: [
      {
        id: "subscriptions",
        label: "Streaming / subscriptions",
        defaultAmount: 80,
        defaultFrequency: "monthly",
        step: 5,
        note: "Streaming, software, and memberships. Small each, easy to under-count in total."
      },
      {
        id: "hobbies",
        label: "Hobbies",
        defaultAmount: 100,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "travel",
        label: "Travel / vacations",
        defaultAmount: 2_400,
        defaultFrequency: "annual",
        step: 100,
        note: "Flights, hotels, and trips — easier to enter as an annual amount."
      }
    ]
  },
  {
    id: "family",
    label: "Family & dependents",
    items: [
      {
        id: "childcare",
        label: "Childcare",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 50,
        note: "Daycare, nanny, or after-school care. A large line for households with young kids."
      },
      {
        id: "education",
        label: "Education / tuition",
        defaultAmount: 0,
        defaultFrequency: "annual",
        step: 100,
        note: "Tuition, school fees, or 529 outflows. Often easiest annually."
      },
      {
        id: "pet-care",
        label: "Pet care",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 10
      }
    ]
  },
  {
    id: "other",
    label: "Other",
    items: [
      {
        id: "debt-payments",
        label: "Debt payments (non-mortgage)",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 25,
        note: "Student loans, credit cards, or other loans beyond your mortgage."
      },
      {
        id: "charitable-giving",
        label: "Charitable giving",
        defaultAmount: 0,
        defaultFrequency: "monthly",
        step: 25
      },
      {
        id: "gifts",
        label: "Gifts",
        defaultAmount: 50,
        defaultFrequency: "monthly",
        step: 10
      },
      {
        id: "miscellaneous",
        label: "Miscellaneous",
        defaultAmount: 100,
        defaultFrequency: "monthly",
        step: 25,
        note: "Anything that doesn't fit above — a buffer for the costs you can't categorize."
      }
    ]
  }
];

// Flat list of every item, in display order — handy for building the default
// entry map and for tests.
export const EXPENSE_ITEMS: ExpenseItem[] = EXPENSE_GROUPS.flatMap((group) => group.items);

// Annualise one entry: monthly amounts contribute ×12, annual amounts as-is.
// Non-finite or negative amounts are treated as 0 so a half-typed field can't
// poison the totals.
export function annualizeEntry(entry: ExpenseEntry): number {
  const amount = Number.isFinite(entry.amount) && entry.amount > 0 ? entry.amount : 0;
  return entry.frequency === "monthly" ? amount * 12 : amount;
}

export type ExpenseGroupTotal = {
  id: string;
  label: string;
  annual: number;
  monthly: number;
};

export type ExpenseTotals = {
  totalAnnual: number;
  totalMonthly: number;
  groups: ExpenseGroupTotal[];
  // Label of the category group with the largest annual subtotal (for the
  // "largest category" context line). Empty when nothing is entered.
  largestGroupLabel: string;
};

// Roll the per-item entries up into per-group subtotals and grand totals,
// correctly mixing per-item monthly/annual frequencies. The monthly total is
// just the annual total / 12 — every item is normalised to an annual figure
// first, so a mix of monthly and annual items totals correctly either way.
export function computeExpenseTotals(
  entries: Record<string, ExpenseEntry>,
  groups: ExpenseGroup[] = EXPENSE_GROUPS
): ExpenseTotals {
  const groupTotals = groups.map((group) => {
    const annual = group.items.reduce((sum, item) => {
      const entry = entries[item.id];
      return sum + (entry ? annualizeEntry(entry) : 0);
    }, 0);
    return { id: group.id, label: group.label, annual, monthly: annual / 12 };
  });

  const totalAnnual = groupTotals.reduce((sum, group) => sum + group.annual, 0);
  const largest = groupTotals.reduce(
    (top, group) => (group.annual > top.annual ? group : top),
    { id: "", label: "", annual: 0, monthly: 0 } as ExpenseGroupTotal
  );

  return {
    totalAnnual,
    totalMonthly: totalAnnual / 12,
    groups: groupTotals,
    largestGroupLabel: largest.annual > 0 ? largest.label : ""
  };
}

// Build the initial entry map from the category defaults.
export function defaultExpenseEntries(): Record<string, ExpenseEntry> {
  return Object.fromEntries(
    EXPENSE_ITEMS.map((item) => [
      item.id,
      { amount: item.defaultAmount, frequency: item.defaultFrequency }
    ])
  );
}
