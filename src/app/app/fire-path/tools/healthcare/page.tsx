import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ChevronDown } from "lucide-react";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { CollapsibleSection } from "@/components/planning/collapsible-section";
import { APP_MODE_COOKIE } from "@/lib/app-mode";
import { healthcareFaq, healthcareIntroParagraphs } from "@/lib/data/healthcare-faq";

const earlyRetirementHeading = "Health insurance and Medicare costs in early retirement";

export const metadata: Metadata = {
  title: "Early Retirement Health Insurance & Medicare Cost Calculator",
  description:
    "Estimate health insurance costs before 65 (ACA gap years, subsidies, and the 2026 subsidy cliff) and Medicare costs at 65+ (Part B, IRMAA, Medigap, Part D, HSA, and travel). Free, private, no login.",
  keywords: [
    "early retirement health insurance",
    "health insurance before 65",
    "pre-65 health insurance calculator",
    "ACA subsidy calculator",
    "Medicare cost calculator",
    "IRMAA calculator",
    "retirement healthcare costs"
  ],
  alternates: { canonical: "/app/fire-path/tools/healthcare" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: healthcareFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default async function HealthcareToolPage() {
  // App-only: read the persisted app-mode cookie server-side (same signal the
  // root layout uses) so this relocation ships in the SSR HTML with no flash.
  const isAppMode = (await cookies()).get(APP_MODE_COOKIE)?.value === "1";

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PlanningToolPanel tool="healthcare" />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section
        aria-labelledby={isAppMode ? "healthcare-qa-heading" : "healthcare-guide-heading"}
        className="mt-12 space-y-10"
      >
        {/* Website: the early-retirement explainer is a standalone, always-visible
            section. App mode relocates it INTO Q&A as a collapsed entry (below),
            so it's omitted here. */}
        {isAppMode ? null : (
          <div className="space-y-4">
            <h2
              id="healthcare-guide-heading"
              className="text-2xl font-bold tracking-tight text-gray-900"
            >
              {earlyRetirementHeading}
            </h2>
            {healthcareIntroParagraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
                {paragraph}
              </p>
            ))}
          </div>
        )}

        <CollapsibleSection heading="Questions & answers" headingId="healthcare-qa-heading">
          {isAppMode ? (
            <div className="space-y-3">
              {/* App-only: the early-retirement explainer, relocated here as a
                  collapsed Q&A entry (same content/copy). Styled to match the
                  FaqAccordion items, but with the section's multi-paragraph body. */}
              <details className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-colors hover:border-gray-300">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-base font-semibold text-gray-900 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[var(--accent,#2563eb)] group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
                  <span>{earlyRetirementHeading}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="space-y-3 px-5 pb-5">
                  {healthcareIntroParagraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 32)}
                      className="max-w-3xl text-sm leading-relaxed text-gray-600"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </details>
              <FaqAccordion items={healthcareFaq} />
            </div>
          ) : (
            <FaqAccordion items={healthcareFaq} />
          )}
        </CollapsibleSection>
      </section>
    </section>
  );
}
