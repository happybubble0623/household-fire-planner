import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";
import { StrategyFaqSection } from "@/components/planning/strategy-faq-section";
import { principalPreservingFaq } from "@/lib/data/fire-strategy-faq";

export const metadata: Metadata = {
  title: "Principal-Preserving FIRE Calculator",
  description:
    "Find the earliest age your income streams plus cash yield can cover expenses while never spending down your principal.",
  alternates: { canonical: "/app/fire-path/principal-preserving" }
};

export default function PrincipalPreservingFirePage() {
  return (
    <>
      <Phase1Workspace activeTab="fire" fireView="principal" />
      <StrategyFaqSection
        heading="Principal-Preserving FIRE — questions & answers"
        items={principalPreservingFaq}
      />
    </>
  );
}
