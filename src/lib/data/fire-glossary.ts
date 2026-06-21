// Single source of truth for the FIRE glossary page (/fire-glossary).
//
// Framework-free (no "use client") so the route's server component renders every
// term and definition in the initial HTML — crawlers and "People Also Ask" see
// the full text without running JavaScript — and builds the DefinedTermSet /
// DefinedTerm JSON-LD from the SAME source, keeping the visible list and the
// structured data in lockstep.
//
// Each term carries a stable `id` used as the anchor (#id) so individual terms
// can be deep-linked, and an optional `link` to the most relevant calculator or
// strategy page for internal cross-linking.

export type GlossaryLink = { href: string; label: string };

export type GlossaryTerm = {
  id: string;
  term: string;
  // Optional short form shown in muted text next to the term (e.g. "FI", "SWR").
  abbr?: string;
  definition: string;
  link?: GlossaryLink;
};

// Ordered alphabetically (numerals first), the way a reader scans an A–Z list.
// Definitions are plain language: every term that needs one explains the idea in
// everyday words, and any second term it leans on is explained too.
export const FIRE_GLOSSARY: GlossaryTerm[] = [
  {
    id: "four-percent-rule",
    term: "4% rule",
    definition:
      "A simple rule of thumb for how much you can safely spend from your savings each year in retirement. It says you can withdraw about 4% of your investments in your first year, then adjust that dollar amount for inflation each year after, and your money should last roughly 30 years. Flip it around and it tells you your target: save about 25 times your yearly spending. It is a starting guide, not a guarantee — markets vary, so many people adjust as they go.",
    link: { href: "/app/fire-path/withdrawal-rate", label: "Portfolio Drawdown calculator" }
  },
  {
    id: "aca",
    term: "ACA",
    abbr: "Affordable Care Act",
    definition:
      "A U.S. law that created the health-insurance marketplace where you can buy your own coverage if you do not get it through a job. For people who retire before 65 (when Medicare starts), an ACA plan is the usual way to stay insured during the gap years. Depending on your income you may qualify for a subsidy (a discount) that lowers the monthly cost.",
    link: { href: "/app/fire-path/tools/healthcare", label: "Healthcare cost calculator" }
  },
  {
    id: "barista-fire",
    term: "Barista FIRE",
    definition:
      "A middle path where you quit your main career but keep a part-time or lower-stress job — the classic example being a coffee-shop barista — often to get employer health insurance and a bit of income. Your savings cover most of your costs, and the part-time work covers the rest, so you can step back from full-time work sooner.",
    link: { href: "/what-is-fire#flavors", label: "FIRE flavors explained" }
  },
  {
    id: "coast-fire",
    term: "Coast FIRE",
    definition:
      "The point where you have already invested enough that, even if you never save another dollar, your existing savings should grow on their own to fund a normal-age retirement. After reaching it you only need to earn enough to cover today's bills — you can \"coast\" because the long-term retirement saving is already done.",
    link: { href: "/app/fire-path/coast-fire", label: "Coast FIRE calculator" }
  },
  {
    id: "drawdown",
    term: "Drawdown",
    definition:
      "Spending money out of your investments to live on, instead of adding to them. During your working years you build savings up; in retirement you draw them down. A drawdown plan is simply the schedule for how much you take out each year so the money lasts as long as you need it.",
    link: { href: "/app/fire-path/withdrawal-rate", label: "Portfolio Drawdown calculator" }
  },
  {
    id: "expense-ratio",
    term: "Expense ratio",
    definition:
      "The yearly fee a fund (like an index fund or ETF) charges, shown as a percent of the money you have invested in it. An expense ratio of 0.05% means $5 a year for every $10,000 invested. It is taken out automatically, so you never see a bill — but lower fees leave more of the growth with you, which matters a lot over decades.",
    link: { href: "/app/fire-path/tools/investment", label: "Investment calculator" }
  },
  {
    id: "fat-fire",
    term: "Fat FIRE",
    definition:
      "A version of FIRE aimed at a comfortable, higher-spending lifestyle rather than a bare-bones one. It needs a much larger amount saved because your yearly spending target is higher — think keeping (or growing) a full lifestyle in retirement instead of trimming it down.",
    link: { href: "/what-is-fire#flavors", label: "FIRE flavors explained" }
  },
  {
    id: "financial-independence",
    term: "Financial Independence",
    abbr: "FI",
    definition:
      "Having enough money — from savings, investments, or steady income — that you no longer need a paycheck to cover your living costs. Work becomes a choice rather than a requirement. It is the \"FI\" in FIRE, and you can reach it without retiring early if you simply want the security of not depending on a job.",
    link: { href: "/what-is-fire", label: "What is FIRE? — beginner guide" }
  },
  {
    id: "fire",
    term: "FIRE",
    abbr: "Financial Independence, Retire Early",
    definition:
      "A way of planning your money so you can stop needing a job much earlier than the usual retirement age. The idea: save a meaningful share of your income, invest it so it grows, and build up enough that the savings (and any steady income) can cover your living costs for the rest of your life.",
    link: { href: "/what-is-fire", label: "What is FIRE? — beginner guide" }
  },
  {
    id: "fire-number",
    term: "FIRE number",
    definition:
      "The total amount of money you are aiming to save before you can retire early. A common way to estimate it is to take your expected yearly spending and multiply by about 25 (the flip side of the 4% rule). For example, $40,000 a year of spending points to a FIRE number of roughly $1,000,000.",
    link: { href: "/app/fire-path/withdrawal-rate", label: "Portfolio Drawdown calculator" }
  },
  {
    id: "irmaa",
    term: "IRMAA",
    abbr: "Income-Related Monthly Adjustment Amount",
    definition:
      "An extra charge added to your Medicare premiums if your income is above certain limits. In plain terms: higher-income retirees pay more for the same Medicare coverage. It is based on your tax return from two years earlier, so a one-time spike in income can raise your Medicare cost later.",
    link: { href: "/app/fire-path/tools/healthcare", label: "Healthcare cost calculator" }
  },
  {
    id: "lean-fire",
    term: "Lean FIRE",
    definition:
      "Reaching financial independence on a smaller, carefully managed budget. Because your yearly spending is low, the amount you need to save is lower too — so you can retire sooner, with the trade-off of a leaner, more frugal lifestyle.",
    link: { href: "/what-is-fire#flavors", label: "FIRE flavors explained" }
  },
  {
    id: "medigap",
    term: "Medigap",
    definition:
      "A private insurance plan you can buy to fill the \"gaps\" in basic Medicare — the deductibles, copays, and other amounts Medicare does not pay. It gives you more predictable health costs in retirement, in exchange for an extra monthly premium.",
    link: { href: "/app/fire-path/tools/healthcare", label: "Healthcare cost calculator" }
  },
  {
    id: "rmd",
    term: "RMD",
    abbr: "Required Minimum Distribution",
    definition:
      "The minimum amount the government requires you to withdraw each year from certain retirement accounts (like a traditional 401(k) or IRA) once you reach a set age. The point is that these accounts grew tax-deferred, so eventually you must take money out and pay tax on it — you cannot leave it untouched forever."
  },
  {
    id: "swr",
    term: "Safe Withdrawal Rate",
    abbr: "SWR",
    definition:
      "The percent of your savings you can take out in your first year of retirement with good confidence the money will last. The well-known starting point is about 4% (see the 4% rule), but the \"safe\" rate depends on how long you need the money to last, how your money is invested, and how flexible you can be if markets fall.",
    link: { href: "/app/fire-path/withdrawal-rate", label: "Portfolio Drawdown calculator" }
  },
  {
    id: "sepp-72t",
    term: "SEPP / 72(t)",
    definition:
      "A rule (named after a section of the U.S. tax code) that lets you take money out of a retirement account before the usual age of 59½ without the normal early-withdrawal penalty. The catch: you must take equal payments on a fixed schedule for several years. Early retirees sometimes use it to tap retirement savings during the years before they would otherwise be allowed to."
  }
];
