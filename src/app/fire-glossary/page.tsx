import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { FIRE_GLOSSARY } from "@/lib/data/fire-glossary";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "FIRE Glossary — Plain-English Definitions of FIRE & Retirement Terms",
  description:
    "A plain-language glossary of FIRE and early-retirement terms: FIRE number, the 4% rule, safe withdrawal rate, Coast, Barista, Lean and Fat FIRE, drawdown, ACA, IRMAA, Medigap, RMD, SEPP/72(t) and more.",
  keywords: [
    "FIRE glossary",
    "FIRE terms",
    "financial independence glossary",
    "early retirement definitions",
    "4% rule",
    "safe withdrawal rate",
    "Coast FIRE",
    "Barista FIRE"
  ],
  alternates: { canonical: "/fire-glossary" }
};

// DefinedTermSet / DefinedTerm structured data, built from the same source array
// the page renders, so the visible glossary and the schema stay in lockstep.
// Each term gets a stable #id anchor that is also its DefinedTerm url, so search
// engines (and links) can deep-link an individual definition.
const glossaryJsonLd = {
  "@context": "https://schema.org",
  "@type": "DefinedTermSet",
  name: "FIRE Glossary",
  description:
    "Plain-language definitions of FIRE (Financial Independence, Retire Early) and early-retirement terms.",
  url: `${siteUrl}/fire-glossary`,
  hasDefinedTerm: FIRE_GLOSSARY.map((entry) => ({
    "@type": "DefinedTerm",
    "@id": `${siteUrl}/fire-glossary#${entry.id}`,
    name: entry.abbr ? `${entry.term} (${entry.abbr})` : entry.term,
    description: entry.definition,
    url: `${siteUrl}/fire-glossary#${entry.id}`,
    inDefinedTermSet: `${siteUrl}/fire-glossary`
  }))
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "FIRE Glossary", item: `${siteUrl}/fire-glossary` }
  ]
};

export default function FireGlossaryPage() {
  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(glossaryJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/app/fire-path" className="hover:text-gray-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-700">FIRE Glossary</li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
            ● Plain-English definitions
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            FIRE glossary
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            The early-retirement world is full of jargon. Here is every term you are likely to meet
            on this site, explained in everyday language — with a link to the calculator or guide
            that puts it to work. New to the idea? Start with{" "}
            <Link href="/what-is-fire" className="font-medium text-[var(--primary)] hover:underline">
              What is FIRE?
            </Link>
          </p>
        </header>

        {/* Quick jump list — server-rendered anchor links to each term. */}
        <nav
          aria-label="Jump to a term"
          className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm sm:p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
            Jump to a term
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {FIRE_GLOSSARY.map((entry) => (
              <li key={entry.id}>
                <a
                  href={`#${entry.id}`}
                  className="text-gray-600 transition-colors hover:text-[var(--primary)] hover:underline"
                >
                  {entry.term}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <dl className="mt-8 space-y-4">
          {FIRE_GLOSSARY.map((entry) => (
            <div
              key={entry.id}
              id={entry.id}
              className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm"
            >
              <dt className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <a
                  href={`#${entry.id}`}
                  className="text-xl font-bold tracking-[-0.01em] text-gray-900 hover:text-[var(--primary)]"
                >
                  {entry.term}
                </a>
                {entry.abbr ? (
                  <span className="text-sm font-medium text-gray-500">{entry.abbr}</span>
                ) : null}
              </dt>
              <dd className="mt-3 max-w-3xl text-base leading-relaxed text-gray-600">
                {entry.definition}
              </dd>
              {entry.link ? (
                <dd className="mt-3">
                  <Link
                    href={entry.link.href}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--primary)] hover:underline"
                  >
                    {entry.link.label} →
                  </Link>
                </dd>
              ) : null}
            </div>
          ))}
        </dl>

        <div className="mt-10 max-w-3xl rounded-2xl border border-[var(--border)] bg-[var(--soft)] p-6 shadow-sm">
          <p className="text-base leading-relaxed text-gray-700">
            Ready to put these terms to work? Open the{" "}
            <Link
              href="/app/fire-path"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              free FIRE planner
            </Link>{" "}
            or read the beginner&rsquo;s guide,{" "}
            <Link href="/what-is-fire" className="font-medium text-[var(--primary)] hover:underline">
              What is FIRE?
            </Link>
          </p>
        </div>
      </div>
    </AppShell>
  );
}
