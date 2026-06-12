import { FaqAccordion } from "@/components/planning/faq-accordion";
import type { FaqItem } from "@/lib/data/healthcare-faq";

// Shared server-rendered FAQ block for the three FIRE strategy pages. It emits
// the FAQPage JSON-LD and the visible Q&A from the SAME `items` array, so the
// structured data and the on-page text can never drift apart — the same pattern
// the calculator tool pages use. Rendered below the (client) strategy workspace.
export function StrategyFaqSection({
  heading,
  items
}: {
  heading: string;
  items: FaqItem[];
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer }
    }))
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">{heading}</h2>
        <FaqAccordion items={items} />
      </div>
    </section>
  );
}
