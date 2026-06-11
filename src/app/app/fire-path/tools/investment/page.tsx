import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { investmentFaq, investmentIntroParagraphs } from "@/lib/data/investment-faq";

export const metadata: Metadata = {
  title: "Investment Growth & Compound Interest Calculator",
  description:
    "Project how a portfolio grows from starting assets, monthly contributions, expected return, and time — with monthly compounding. Free, private, no login.",
  keywords: [
    "investment calculator",
    "investment growth calculator",
    "compound interest calculator",
    "how much will my investments grow",
    "portfolio growth calculator",
    "monthly contribution investment calculator",
    "FIRE investment calculator"
  ],
  alternates: { canonical: "/app/fire-path/tools/investment" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: investmentFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default function InvestmentToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PlanningToolPanel tool="investment" />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section aria-labelledby="investment-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2
            id="investment-guide-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            How investment growth and compounding work
          </h2>
          {investmentIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-5">
          <h2 id="investment-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <dl className="space-y-5">
            {investmentFaq.map((item) => (
              <div
                key={item.question}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
              >
                <dt className="text-base font-semibold text-gray-900">{item.question}</dt>
                <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600">{item.answer}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </section>
  );
}
