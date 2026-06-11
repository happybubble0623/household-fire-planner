import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Portfolio Drawdown FIRE Calculator",
  description:
    "Find the earliest age your liquid investments can stop receiving savings, begin withdrawals, and still last through life expectancy. Primary home excluded.",
  alternates: { canonical: "/app/fire-path/withdrawal-rate" }
};

export default function WithdrawalRateFirePage() {
  return <Phase1Workspace activeTab="fire" fireView="withdrawal" />;
}
