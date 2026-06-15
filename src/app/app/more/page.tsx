import type { Metadata } from "next";
import Link from "next/link";
import { AccountSection } from "@/components/more/account-section";
import { RemindersSection } from "@/components/more/reminders-section";

export const metadata: Metadata = {
  title: "More",
  description: "Account, learning guides, about, and feedback for Plan My FIRE.",
  alternates: { canonical: "/app/more" }
};

// Mirrors the "Learn" dropdown in the header so the in-app More page stays in
// sync with desktop navigation.
const LEARN_LINKS: Array<{ href: string; label: string; blurb: string }> = [
  { href: "/what-is-fire", label: "What is FIRE?", blurb: "Plain-English beginner's guide" },
  {
    href: "/early-retirement-guide",
    label: "Early Retirement Guide",
    blurb: "Step-by-step FIRE planning roadmap"
  },
  { href: "/fire-glossary", label: "Glossary", blurb: "FIRE & retirement terms defined" }
];

const linkCardClass =
  "block rounded-xl border border-[var(--border)] bg-white p-4 transition-colors duration-150 hover:bg-[var(--soft)]";
const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-wide text-gray-500";

function MoreLink({ href, label, blurb }: { href: string; label: string; blurb?: string }) {
  return (
    <Link href={href} className={linkCardClass}>
      <span className="block text-sm font-semibold text-gray-900">{label}</span>
      {blurb ? (
        <span className="mt-1 block text-[13px] leading-relaxed text-gray-600">{blurb}</span>
      ) : null}
    </Link>
  );
}

export default function MorePage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">More</h1>

      {/* Account hub — sign-in / sync / save status. AccountSection reuses
          useSession() (Supabase auth state + signOut) and the /login route, so
          the signed-in / signed-out states match the rest of the app. */}
      <div className="mt-6">
        <p className={sectionLabelClass}>Account</p>
        <div className="mt-2">
          <AccountSection />
        </div>
      </div>

      {/* App-only: renders nothing on the website (useIsAppMode guard). */}
      <RemindersSection />

      <div className="mt-6">
        <p className={sectionLabelClass}>Learn</p>
        <div className="mt-2 space-y-3">
          {LEARN_LINKS.map((link) => (
            <MoreLink key={link.href} href={link.href} label={link.label} blurb={link.blurb} />
          ))}
        </div>
      </div>

      <div className="mt-6">
        <p className={sectionLabelClass}>About</p>
        <div className="mt-2 space-y-3">
          <MoreLink href="/about" label="About Plan My FIRE" blurb="Who builds this and why" />
          <MoreLink
            href="/about#share-feedback"
            label="Send feedback"
            blurb="Share an idea or report a problem"
          />
        </div>
      </div>
    </section>
  );
}
