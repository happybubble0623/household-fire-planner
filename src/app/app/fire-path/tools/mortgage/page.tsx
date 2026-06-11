import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { mortgageFaq, mortgageIntroParagraphs } from "@/lib/data/mortgage-faq";

export const metadata: Metadata = {
  title: "Mortgage Payment Calculator",
  description:
    "Estimate your full monthly mortgage payment — principal, interest, taxes, insurance, PMI, and HOA — and see the payoff schedule over time. Free, private, no login.",
  keywords: [
    "mortgage calculator",
    "mortgage payment calculator",
    "how much house can I afford",
    "PMI calculator",
    "mortgage amortization calculator",
    "monthly mortgage payment",
    "mortgage payoff calculator"
  ],
  alternates: { canonical: "/app/fire-path/tools/mortgage" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: mortgageFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default function MortgageToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PlanningToolPanel tool="mortgage" />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section aria-labelledby="mortgage-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2
            id="mortgage-guide-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            How to estimate your monthly mortgage payment
          </h2>
          {mortgageIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-5">
          <h2 id="mortgage-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <FaqAccordion items={mortgageFaq} />
        </div>
      </section>
    </section>
  );
}
