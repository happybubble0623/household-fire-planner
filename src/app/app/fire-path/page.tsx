import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Early Retirement & FIRE Calculator",
  description:
    "A private, guided workspace to plan early retirement and financial independence across your whole household — every account, no brokerage login, nothing leaves your device unless you choose to create an account to sync.",
  alternates: { canonical: "/app/fire-path" }
};

export default function FirePathPage() {
  return <Phase1Workspace activeTab="fire" />;
}
