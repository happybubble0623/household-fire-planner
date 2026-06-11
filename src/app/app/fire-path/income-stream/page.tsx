import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Income Stream FIRE Calculator",
  description:
    "Check whether Social Security, pensions, rent, and other recurring income can cover your retirement expenses from a chosen FIRE age.",
  alternates: { canonical: "/app/fire-path/income-stream" }
};

export default function IncomeStreamFirePage() {
  return <Phase1Workspace activeTab="fire" fireView="income" />;
}
