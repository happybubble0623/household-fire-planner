import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/data/healthcare-faq";

// Server-rendered FAQ accordion. Intentionally framework-free (no "use client")
// and built on native <details>/<summary>: every question AND answer ships in the
// initial server HTML and stays in the DOM, so crawlers and "People Also Ask" see
// the full text without running JavaScript — it is only visually collapsed.
// Collapsing uses zero JS (no `open` attribute = closed by default), so it can
// never lazy-load or hide content from search engines. The matching FAQPage
// JSON-LD is emitted by each route page from the same source array.
export function FaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm transition-colors hover:border-gray-300"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-base font-semibold text-gray-900 outline-none transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-[var(--accent,#2563eb)] group-open:rounded-b-none [&::-webkit-details-marker]:hidden">
            <span>{item.question}</span>
            <ChevronDown
              aria-hidden="true"
              className="h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
            />
          </summary>
          <p className="max-w-3xl px-5 pb-5 text-sm leading-relaxed text-gray-600">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  );
}
