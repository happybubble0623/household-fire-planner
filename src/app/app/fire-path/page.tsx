import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Path to FIRE",
  description:
    "Compare three FIRE strategies — portfolio drawdown, principal-preserving, and income-stream — to find your earliest financial-independence age.",
  alternates: { canonical: "/app/fire-path" }
};

export default function FirePathPage() {
  return <Phase1Workspace activeTab="fire" />;
}
