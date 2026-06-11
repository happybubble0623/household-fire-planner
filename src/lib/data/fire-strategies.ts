// Single source of truth for the three FIRE strategy pages. Consumed by the
// home hub (strategy cards + nav dropdown in path-to-fire-panel) and the
// global header (app-shell), so every nav surface stays in sync.

export type FireStrategyMeta = {
  href: string;
  eyebrow: string;
  title: string;
  navLabel: string;
  description: string;
  featured: boolean;
};

export const FIRE_STRATEGIES: FireStrategyMeta[] = [
  {
    href: "/app/fire-path/income-stream",
    eyebrow: "Most cautious",
    title: "Income Stream FIRE",
    navLabel: "Income Stream FIRE",
    description: "Live on guaranteed income alone — Social Security, pension, or rental.",
    featured: false
  },
  {
    href: "/app/fire-path/principal-preserving",
    eyebrow: "Keep your nest egg",
    title: "Principal-Preserving",
    navLabel: "Principal-Preserving FIRE",
    description: "Live off income and earnings, never touching your principal.",
    featured: false
  },
  {
    href: "/app/fire-path/withdrawal-rate",
    eyebrow: "Most flexible · popular",
    title: "Portfolio Drawdown",
    navLabel: "Portfolio Drawdown FIRE",
    description: "Spend down savings to retire at the earliest possible age.",
    featured: true
  }
];
