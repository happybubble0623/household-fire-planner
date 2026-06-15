import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Add Holdings",
  description:
    "Add an account or holding to your household portfolio — search a ticker or enter a balance, set owner and account, and mark whether it counts toward FIRE.",
  alternates: { canonical: "/app/portfolio-lab/add" }
};

export default function AddHoldingsPage() {
  return <Phase1Workspace activeTab="portfolio" portfolioView="add" />;
}
