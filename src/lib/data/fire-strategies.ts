// Single source of truth for the three FIRE strategy pages. Consumed by the
// home hub (strategy comparison cards + "Help me choose" picker in
// path-to-fire-panel) and the global header (app-shell), so every nav surface
// stays in sync.

export type FireStrategyMeta = {
  href: string;
  eyebrow: string;
  title: string;
  navLabel: string;
  description: string;
  featured: boolean;
  // Home-hub comparison card + picker content (plain language, no jargon).
  tag: string; // small "best known as" pill
  idea: string; // one-line plain-language idea
  bullets: [string, string, string]; // three green-check selling points
  why: string; // one-line reason shown in the "Help me choose" result
};

export const FIRE_STRATEGIES: FireStrategyMeta[] = [
  {
    href: "/app/fire-path/income-stream",
    eyebrow: "Most cautious",
    title: "Income Stream FIRE",
    navLabel: "Income Stream FIRE",
    description: "Live on guaranteed income alone — Social Security, pension, or rental.",
    featured: false,
    tag: "Income-funded",
    idea: "Cover your costs with steady income like pensions, rentals, or Social Security.",
    bullets: [
      "Uses pension / rental / SS income",
      "No need to sell investments",
      "Good if you have steady income"
    ],
    why: "Your costs are already covered by reliable income, so your plan can lean on those streams instead of drawing down a portfolio."
  },
  {
    href: "/app/fire-path/principal-preserving",
    eyebrow: "Keep your nest egg",
    title: "Principal-Preserving",
    navLabel: "Principal-Preserving FIRE",
    description: "Live off income and earnings, never touching your principal.",
    featured: false,
    tag: "Live off income",
    idea: "Live off the income your investments produce — without touching your savings.",
    bullets: [
      "Never spend your savings",
      "Live off investment income",
      "Good if you've saved a lot"
    ],
    why: "You can live on the income your investments produce and leave your savings untouched — so they can last indefinitely."
  },
  {
    href: "/app/fire-path/withdrawal-rate",
    eyebrow: "Most flexible · popular",
    title: "Portfolio Drawdown",
    navLabel: "Portfolio Drawdown FIRE",
    description: "Spend down savings to retire at the earliest possible age.",
    featured: true,
    tag: "The 4% rule",
    idea: "Build up your savings, then spend them down gradually.",
    bullets: [
      "Simplest, most common",
      "Works with index funds",
      "Spend savings gradually"
    ],
    why: "You build up your savings and spend them down gradually — the simplest and most common path, and usually the earliest retirement age."
  }
];

// Comparison cards on the home hub, ordered featured-first to match the approved
// design: Portfolio Drawdown → Principal-Preserving → Income Stream.
const CARD_ORDER = [
  "/app/fire-path/withdrawal-rate",
  "/app/fire-path/principal-preserving",
  "/app/fire-path/income-stream"
] as const;

export const FIRE_STRATEGY_CARDS: FireStrategyMeta[] = CARD_ORDER.map(
  (href) => FIRE_STRATEGIES.find((strategy) => strategy.href === href)!
);
