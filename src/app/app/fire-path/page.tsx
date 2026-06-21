import type { Metadata } from "next";
import { Phase1Workspace } from "@/components/planning/phase1-workspace";

export const metadata: Metadata = {
  title: "Early Retirement & FIRE Calculator",
  description:
    "An all-in-one, free early-retirement (FIRE) planner for your whole household — calculators, FIRE models, a portfolio tracker, and healthcare costs others skip.",
  // Canonicalize to the homepage "/", which renders this same workspace. Keeps
  // the two identical URLs from competing as duplicates. This route stays live
  // because the iOS app loads it directly.
  alternates: { canonical: "/" }
};

export default function FirePathPage() {
  return <Phase1Workspace activeTab="fire" />;
}
