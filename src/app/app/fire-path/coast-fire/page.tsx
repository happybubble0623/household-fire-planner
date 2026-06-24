import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";
import { StrategyFaqSection } from "@/components/planning/strategy-faq-section";
import { coastFireFaq } from "@/lib/data/fire-strategy-faq";
import { ToolUseTracker } from "@/components/analytics/tool-use-tracker";

export const metadata: Metadata = {
  title: "Coast FIRE Calculator",
  description:
    "Find the earliest age you can stop saving for retirement and let your current investments grow on their own to fund a traditional-age retirement. Primary home excluded.",
  alternates: { canonical: "/app/fire-path/coast-fire" }
};

export default function CoastFirePage() {
  return (
    <>
      <ToolUseTracker toolName="fire_coast" />
      <Phase1Workspace activeTab="fire" fireView="coast" />
      <StrategyFaqSection heading="Coast FIRE — questions & answers" items={coastFireFaq} />
    </>
  );
}
