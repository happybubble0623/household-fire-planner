import type { Metadata } from "next";
import { ExpenseCalculator } from "@/components/planning/expense-calculator";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { ToolGuideSections } from "@/components/planning/tool-guide-sections";
import {
  expensesCrossLinks,
  expensesFaq,
  expensesHowItWorks,
  expensesIntroParagraphs,
  expensesKeyConcepts,
  expensesSourcedDefaults
} from "@/lib/data/expenses-faq";

export const metadata: Metadata = {
  title: "Living Expense Calculator",
  description:
    "Estimate your total annual and monthly living expenses by category — housing, utilities, groceries, transportation, healthcare, and more. Enter amounts monthly or annually. Free, private, no login.",
  keywords: [
    "living expense calculator",
    "annual expenses calculator",
    "monthly expenses calculator",
    "cost of living calculator",
    "household budget calculator",
    "how much do I spend a year",
    "FIRE expenses calculator"
  ],
  alternates: { canonical: "/app/fire-path/tools/expenses" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: expensesFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default function ExpensesToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <ExpenseCalculator />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section aria-labelledby="expenses-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2
            id="expenses-guide-heading"
            className="text-2xl font-bold tracking-tight text-gray-900"
          >
            How to estimate your annual living expenses
          </h2>
          {expensesIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <ToolGuideSections
          howItWorks={expensesHowItWorks}
          keyConcepts={expensesKeyConcepts}
          sourcedDefaults={expensesSourcedDefaults}
          crossLinks={expensesCrossLinks}
        />

        <div className="space-y-5">
          <h2 id="expenses-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <FaqAccordion items={expensesFaq} />
        </div>
      </section>
    </section>
  );
}
