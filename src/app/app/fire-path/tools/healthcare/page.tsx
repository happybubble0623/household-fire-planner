import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { healthcareFaq, healthcareIntroParagraphs } from "@/lib/data/healthcare-faq";

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

export default function HealthcareToolPage() {
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
      <section aria-labelledby="healthcare-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2
            id="healthcare-guide-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            Health insurance and Medicare costs in early retirement
          </h2>
          {healthcareIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-5">
          <h2 id="healthcare-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <FaqAccordion items={healthcareFaq} />
        </div>
      </section>
    </section>
  );
}
