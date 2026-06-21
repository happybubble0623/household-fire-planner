import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { FireHubStatic } from "@/components/planning/fire-hub-static";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The homepage "/" renders the exact same Path-to-FIRE hub as /app/fire-path —
// but as a Server Component, so the hero, strategy cards, and calculators ship
// in the initial HTML (indexable by Google, instant first paint). The shared
// FireHubStatic guarantees the two pages stay visually identical. /app/fire-path
// stays in place (the iOS app loads it) and canonicalizes here.
export const metadata: Metadata = {
  title: {
    absolute: "Plan My FIRE — Free FIRE & Early-Retirement Planner for Your Household"
  },
  description:
    "Plan your whole household's path to financial independence and early retirement. Free FIRE strategies, a daily-updated portfolio tracker, and calculators for healthcare, taxes, and Social Security. No login.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Plan My FIRE — Free FIRE & Early-Retirement Planner",
    description:
      "An all-in-one, free FIRE planner for your whole household — strategies, daily portfolio tracking, and the calculators others skip. Private, no login."
  }
};

export default function HomePage() {
  return (
    <AppShell>
      <FireHubStatic />
    </AppShell>
  );
}
