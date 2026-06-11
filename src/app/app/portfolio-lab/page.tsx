import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Understand Your Portfolio",
  description:
    "Track household accounts, mark which assets count toward FIRE, and analyze allocation across owners and tax buckets.",
  alternates: { canonical: "/app/portfolio-lab" }
};

export default function PortfolioLabPage() {
  return <Phase1Workspace activeTab="portfolio" />;
}
