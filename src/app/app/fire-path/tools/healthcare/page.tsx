import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";

export const metadata: Metadata = {
  title: "Retirement Healthcare Cost Calculator",
  description:
    "Estimate medical costs after you stop working — ACA gap years with subsidies, Medicare with IRMAA, HSA drawdown, and travel coverage.",
  alternates: { canonical: "/app/fire-path/tools/healthcare" }
};

export default function HealthcareToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlanningToolPanel tool="healthcare" />
    </section>
  );
}
