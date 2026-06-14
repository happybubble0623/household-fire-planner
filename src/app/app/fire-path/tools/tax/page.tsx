import type { Metadata } from "next";
import { TaxCalculator } from "@/components/planning/tax-calculator";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { ToolGuideSections } from "@/components/planning/tool-guide-sections";
import {
  taxCrossLinks,
  taxFaq,
  taxHowItWorks,
  taxIntroParagraphs,
  taxKeyConcepts,
  taxSourcedDefaults
} from "@/lib/data/tax-faq";

export const metadata: Metadata = {
  title: "2026 Federal Income Tax Calculator (Retirement & Capital Gains)",
  description:
    "Estimate your 2026 federal income tax with retirement accounts, long-term capital gains, dependents, and a flat state rate. Uses the official 2026 brackets, standard deduction, and Child Tax Credit (IRS Rev. Proc. 2025-32). Free, private, no login.",
  keywords: [
    "tax calculator",
    "2026 tax calculator",
    "federal income tax calculator",
    "capital gains tax calculator",
    "income tax estimator",
    "retirement tax calculator",
    "child tax credit calculator"
  ],
  alternates: { canonical: "/app/fire-path/tools/tax" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: taxFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default function TaxToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <TaxCalculator />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section aria-labelledby="tax-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2 id="tax-guide-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            How to estimate your 2026 federal income tax
          </h2>
          {taxIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <ToolGuideSections
          howItWorks={taxHowItWorks}
          keyConcepts={taxKeyConcepts}
          sourcedDefaults={taxSourcedDefaults}
          crossLinks={taxCrossLinks}
        />

        <div className="space-y-5">
          <h2 id="tax-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <FaqAccordion items={taxFaq} />
        </div>
      </section>
    </section>
  );
}
