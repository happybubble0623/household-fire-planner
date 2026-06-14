import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// A server-rendered, collapsed-by-default section built on native
// <details>/<summary>. Like FaqAccordion, it ships ALL of its content in the
// initial server HTML and only hides it visually — there is no "use client",
// no `open` attribute (so it starts closed), and no JavaScript gate. Crawlers
// and readers without JavaScript still get every word, and any JSON-LD a route
// emits from the same source stays intact. The collapse is purely presentational.
//
// The section heading lives inside the <summary> (valid: a summary may contain a
// single heading element) so the whole header row is the click target, with a
// chevron that rotates on open — matching the FaqAccordion pattern.
export function CollapsibleSection({
  heading,
  headingId,
  children
}: {
  heading: string;
  headingId?: string;
  children: ReactNode;
}) {
  return (
    <details className="group space-y-5 border-t border-[var(--border)] pt-6">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[var(--accent,#2563eb)] [&::-webkit-details-marker]:hidden">
        <h2
          id={headingId}
          className="text-2xl font-bold tracking-tight text-gray-900 transition-colors group-hover:text-[var(--primary,#2563eb)]"
        >
          {heading}
        </h2>
        <ChevronDown
          aria-hidden="true"
          className="h-6 w-6 shrink-0 text-gray-400 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      {children}
    </details>
  );
}
