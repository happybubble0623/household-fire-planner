import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";

export const metadata: Metadata = {
  title: "Investment Growth Calculator",
  description:
    "Project how a portfolio grows from starting assets, monthly contributions, expected return, and time.",
  alternates: { canonical: "/app/fire-path/tools/investment" }
};

export default function InvestmentToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlanningToolPanel tool="investment" />
    </section>
  );
}
