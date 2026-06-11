// Single source of truth for the Path-to-FIRE planning tools. Consumed by the
// tools grid on the hub (path-to-fire-panel), the per-tool "More planning
// tools" footer (planning-tool-panel), and the routes under
// /app/fire-path/tools. Add a tool here and it appears in every nav surface.

export type PlanningTool = "mortgage" | "investment" | "social-security" | "healthcare";

export type PlanningToolMeta = {
  slug: PlanningTool;
  href: string;
  title: string;
  description: string;
};

export const PLANNING_TOOLS: PlanningToolMeta[] = [
  {
    slug: "social-security",
    href: "/app/fire-path/tools/social-security",
    title: "Social Security benefit calculator",
    description:
      "Compare unofficial worker-benefit estimates at age 62, full retirement age, and age 70."
  },
  {
    slug: "healthcare",
    href: "/app/fire-path/tools/healthcare",
    title: "Retirement healthcare cost calculator",
    description:
      "Estimate medical costs across the pre-Medicare ACA gap years and Medicare, with subsidies, IRMAA, HSA, and travel."
  },
  {
    slug: "mortgage",
    href: "/app/fire-path/tools/mortgage",
    title: "Mortgage calculator",
    description: "Estimate monthly principal and interest, total interest, and payoff cost."
  },
  {
    slug: "investment",
    href: "/app/fire-path/tools/investment",
    title: "Investment calculator",
    description: "Project a balance from starting assets, contributions, return, and time."
  }
];

export function relatedPlanningTools(current: PlanningTool): PlanningToolMeta[] {
  return PLANNING_TOOLS.filter((tool) => tool.slug !== current);
}
