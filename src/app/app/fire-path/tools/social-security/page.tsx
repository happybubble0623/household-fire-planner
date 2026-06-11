import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";

export const metadata: Metadata = {
  title: "Social Security Benefit Calculator",
  description:
    "Estimate your Social Security worker benefit from covered earnings and compare claiming at 62, full retirement age, and 70.",
  alternates: { canonical: "/app/fire-path/tools/social-security" }
};

export default function SocialSecurityToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PlanningToolPanel tool="social-security" />
    </section>
  );
}
