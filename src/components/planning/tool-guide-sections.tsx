import Link from "next/link";
import { CollapsibleSection } from "@/components/planning/collapsible-section";
import type {
  CrossLink,
  HowItWorksSection,
  KeyConcept,
  SourcedDefault
} from "@/lib/data/tool-guide";

// Server-rendered explainer sections that sit between a calculator's intro and
// its Q&A. Intentionally framework-free (no "use client") so every word ships
// in the initial HTML — crawlers and readers without JavaScript get the full,
// substantive page, not just the interactive widget. Each block is optional so
// a page can render only the sections it has content for.
//
// The longer explanatory blocks (how-it-works and key-concepts) render inside
// CollapsibleSection — collapsed by default via native <details> — to keep the
// page clean. The content still ships in the server HTML (only visually hidden),
// so this is purely presentational and does not affect SEO or the JSON-LD.
//
// Layout mirrors the healthcare page's prose blocks (max-w-3xl body copy, the
// same heading scale) and stacks cleanly on mobile.
export function ToolGuideSections({
  howItWorks,
  keyConcepts,
  sourcedDefaults,
  crossLinks
}: {
  howItWorks?: { heading: string; sections: HowItWorksSection[] };
  keyConcepts?: { heading: string; intro?: string; items: KeyConcept[] };
  sourcedDefaults?: { heading: string; intro?: string; items: SourcedDefault[] };
  crossLinks?: { heading: string; intro?: string; links: CrossLink[] };
}) {
  return (
    <>
      {howItWorks ? (
        <CollapsibleSection heading={howItWorks.heading} headingId="tool-how-it-works-heading">
          <div className="space-y-6">
            {howItWorks.sections.map((section) => (
              <div key={section.heading} className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">{section.heading}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 32)}
                    className="max-w-3xl text-base leading-relaxed text-gray-600"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ) : null}

      {keyConcepts ? (
        <CollapsibleSection heading={keyConcepts.heading} headingId="tool-key-concepts-heading">
          {keyConcepts.intro ? (
            <p className="max-w-3xl text-base leading-relaxed text-gray-600">{keyConcepts.intro}</p>
          ) : null}
          <dl className="grid gap-4 sm:grid-cols-2">
            {keyConcepts.items.map((item) => (
              <div
                key={item.term}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              >
                <dt className="text-base font-semibold text-gray-900">{item.term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-gray-600">{item.definition}</dd>
              </div>
            ))}
          </dl>
        </CollapsibleSection>
      ) : null}

      {sourcedDefaults ? (
        <section aria-labelledby="tool-defaults-heading" className="space-y-5">
          <h2
            id="tool-defaults-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            {sourcedDefaults.heading}
          </h2>
          {sourcedDefaults.intro ? (
            <p className="max-w-3xl text-base leading-relaxed text-gray-600">
              {sourcedDefaults.intro}
            </p>
          ) : null}
          <ul className="grid gap-3 sm:grid-cols-2">
            {sourcedDefaults.items.map((item) => (
              <li
                key={item.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
              >
                <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-base font-semibold tabular-nums text-gray-900">
                    {item.value}
                  </span>
                  <span className="text-sm font-medium text-gray-700">{item.label}</span>
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{item.source}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {crossLinks ? (
        <section aria-labelledby="tool-cross-links-heading" className="space-y-5">
          <h2
            id="tool-cross-links-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            {crossLinks.heading}
          </h2>
          {crossLinks.intro ? (
            <p className="max-w-3xl text-base leading-relaxed text-gray-600">{crossLinks.intro}</p>
          ) : null}
          <ul className="grid gap-4 sm:grid-cols-2">
            {crossLinks.links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group block h-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                >
                  <span className="block text-base font-semibold text-gray-900 transition group-hover:text-[var(--primary)]">
                    {link.label}
                  </span>
                  <span className="mt-2 block text-sm leading-relaxed text-gray-600">
                    {link.blurb}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
