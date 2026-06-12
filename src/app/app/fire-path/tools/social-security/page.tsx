import type { Metadata } from "next";
import { PlanningToolPanel } from "@/components/planning/planning-tool-panel";
import { FaqAccordion } from "@/components/planning/faq-accordion";
import { ToolGuideSections } from "@/components/planning/tool-guide-sections";
import {
  socialSecurityCrossLinks,
  socialSecurityFaq,
  socialSecurityHowItWorks,
  socialSecurityIntroParagraphs,
  socialSecurityKeyConcepts,
  socialSecuritySourcedDefaults
} from "@/lib/data/social-security-faq";

export const metadata: Metadata = {
  title: "Social Security Benefit & Claiming Age Calculator",
  description:
    "Estimate your Social Security worker benefit from covered earnings and compare claiming at 62, full retirement age, and 70. Uses the official SSA formula and 2026 figures. Free, private, no login.",
  keywords: [
    "Social Security calculator",
    "Social Security benefit calculator",
    "when to claim Social Security",
    "Social Security claiming age",
    "best age to claim Social Security",
    "Social Security at 62 vs 67 vs 70",
    "AIME PIA bend points"
  ],
  alternates: { canonical: "/app/fire-path/tools/social-security" }
};

// FAQPage structured data, built from the same Q&A the page renders below, so
// the visible text and the schema can never drift apart.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: socialSecurityFaq.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer }
  }))
};

export default function SocialSecurityToolPage() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Server-rendered FAQPage JSON-LD — present in the initial HTML for rich results. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PlanningToolPanel tool="social-security" />

      {/* Server-rendered SEO content: unique intro + a real Q&A section. This is
          static prose, so it lives in the server component (not the client panel)
          to guarantee crawlers see it without running JavaScript. */}
      <section aria-labelledby="ss-guide-heading" className="mt-12 space-y-10">
        <div className="space-y-4">
          <h2 id="ss-guide-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Estimating your Social Security benefit and the best age to claim
          </h2>
          {socialSecurityIntroParagraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)} className="max-w-3xl text-base leading-relaxed text-gray-600">
              {paragraph}
            </p>
          ))}
        </div>

        <ToolGuideSections
          howItWorks={socialSecurityHowItWorks}
          keyConcepts={socialSecurityKeyConcepts}
          sourcedDefaults={socialSecuritySourcedDefaults}
          crossLinks={socialSecurityCrossLinks}
        />

        <div className="space-y-5">
          <h2 id="ss-qa-heading" className="text-2xl font-bold tracking-tight text-gray-900">
            Questions &amp; answers
          </h2>
          <FaqAccordion items={socialSecurityFaq} />
        </div>
      </section>
    </section>
  );
}
