import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";
import { StrategyFaqSection } from "@/components/planning/strategy-faq-section";
import { incomeStreamFaq } from "@/lib/data/fire-strategy-faq";
import { ToolUseTracker } from "@/components/analytics/tool-use-tracker";

export const metadata: Metadata = {
  title: "Income Stream FIRE Calculator",
  description:
    "Check whether Social Security, pensions, rent, and other recurring income can cover your retirement expenses from a chosen FIRE age.",
  alternates: { canonical: "/app/fire-path/income-stream" }
};

export default function IncomeStreamFirePage() {
  return (
    <>
      <ToolUseTracker toolName="fire_income_stream" />
      <Phase1Workspace activeTab="fire" fireView="income" />
      <StrategyFaqSection
        heading="Income Stream FIRE — questions & answers"
        items={incomeStreamFaq}
      />
    </>
  );
}
