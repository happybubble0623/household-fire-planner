import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";
import { StrategyFaqSection } from "@/components/planning/strategy-faq-section";
import { withdrawalRateFaq } from "@/lib/data/fire-strategy-faq";
import { ToolUseTracker } from "@/components/analytics/tool-use-tracker";

export const metadata: Metadata = {
  title: "Portfolio Drawdown FIRE Calculator",
  description:
    "Find the earliest age your liquid investments can stop receiving savings, begin withdrawals, and still last through life expectancy. Primary home excluded.",
  alternates: { canonical: "/app/fire-path/withdrawal-rate" }
};

export default function WithdrawalRateFirePage() {
  return (
    <>
      <ToolUseTracker toolName="fire_drawdown" />
      <Phase1Workspace activeTab="fire" fireView="withdrawal" />
      <StrategyFaqSection
        heading="Portfolio Drawdown FIRE — questions & answers"
        items={withdrawalRateFaq}
      />
    </>
  );
}
