import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Early Retirement & FIRE Calculator",
  description:
    "An all-in-one, free early-retirement (FIRE) planner for your whole household — calculators, FIRE models, a portfolio tracker, and healthcare costs others skip.",
  alternates: { canonical: "/app/fire-path" }
};

export default function FirePathPage() {
  return <Phase1Workspace activeTab="fire" />;
}
