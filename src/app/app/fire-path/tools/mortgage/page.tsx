import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";

export const metadata: Metadata = {
  title: "Mortgage Calculator",
  description:
    "Estimate your full monthly mortgage payment — principal, interest, taxes, insurance, PMI, and HOA — and see the payoff schedule over time.",
  alternates: { canonical: "/app/fire-path/tools/mortgage" }
};

export default function MortgageToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlanningToolPanel tool="mortgage" />
    </section>
  );
}
