import { describe, expect, it } from "vitest";
import {
  socialSecurityCrossLinks,
  socialSecurityFaq,
  socialSecurityHowItWorks,
  socialSecurityIntroParagraphs,
  socialSecurityKeyConcepts,
  socialSecuritySourcedDefaults
} from "@/lib/data/social-security-faq";
import {
  mortgageCrossLinks,
  mortgageFaq,
  mortgageHowItWorks,
  mortgageIntroParagraphs,
  mortgageKeyConcepts,
  mortgageSourcedDefaults
} from "@/lib/data/mortgage-faq";
import {
  investmentCrossLinks,
  investmentFaq,
  investmentHowItWorks,
  investmentIntroParagraphs,
  investmentKeyConcepts,
  investmentSourcedDefaults
} from "@/lib/data/investment-faq";

// Guards the server-rendered SEO "guide" content the calculator route pages
// rely on: every tool must ship substantive how-it-works prose, defined key
// concepts, sourced defaults, a real FAQ, and internal cross-links — and the
// copy must honor the project's plain-language rule (no bare "nominal").

const tools = [
  {
    name: "social-security",
    intro: socialSecurityIntroParagraphs,
    howItWorks: socialSecurityHowItWorks,
    keyConcepts: socialSecurityKeyConcepts,
    sourcedDefaults: socialSecuritySourcedDefaults,
    crossLinks: socialSecurityCrossLinks,
    faq: socialSecurityFaq
  },
  {
    name: "mortgage",
    intro: mortgageIntroParagraphs,
    howItWorks: mortgageHowItWorks,
    keyConcepts: mortgageKeyConcepts,
    sourcedDefaults: mortgageSourcedDefaults,
    crossLinks: mortgageCrossLinks,
    faq: mortgageFaq
  },
  {
    name: "investment",
    intro: investmentIntroParagraphs,
    howItWorks: investmentHowItWorks,
    keyConcepts: investmentKeyConcepts,
    sourcedDefaults: investmentSourcedDefaults,
    crossLinks: investmentCrossLinks,
    faq: investmentFaq
  }
];

function collectText(tool: (typeof tools)[number]): string {
  return [
    ...tool.intro,
    tool.howItWorks.heading,
    ...tool.howItWorks.sections.flatMap((section) => [section.heading, ...section.paragraphs]),
    tool.keyConcepts.heading,
    ...tool.keyConcepts.items.flatMap((item) => [item.term, item.definition]),
    tool.sourcedDefaults.heading,
    ...tool.sourcedDefaults.items.flatMap((item) => [item.value, item.label, item.source]),
    tool.crossLinks.heading,
    ...tool.crossLinks.links.flatMap((link) => [link.label, link.blurb]),
    ...tool.faq.flatMap((item) => [item.question, item.answer])
  ].join("\n");
}

describe("calculator guide content", () => {
  for (const tool of tools) {
    describe(tool.name, () => {
      it("has substantive how-it-works prose grounded in real sections", () => {
        expect(tool.howItWorks.sections.length).toBeGreaterThanOrEqual(3);
        for (const section of tool.howItWorks.sections) {
          expect(section.heading.length).toBeGreaterThan(0);
          expect(section.paragraphs.length).toBeGreaterThan(0);
          for (const paragraph of section.paragraphs) {
            expect(paragraph.length).toBeGreaterThan(120);
          }
        }
      });

      it("defines several key concepts in plain language", () => {
        expect(tool.keyConcepts.items.length).toBeGreaterThanOrEqual(6);
        for (const item of tool.keyConcepts.items) {
          expect(item.term.length).toBeGreaterThan(0);
          expect(item.definition.length).toBeGreaterThan(40);
        }
      });

      it("lists sourced default values", () => {
        expect(tool.sourcedDefaults.items.length).toBeGreaterThanOrEqual(4);
        for (const item of tool.sourcedDefaults.items) {
          expect(item.value.length).toBeGreaterThan(0);
          expect(item.label.length).toBeGreaterThan(0);
          expect(item.source.length).toBeGreaterThan(10);
        }
      });

      it("cross-links to other on-site content with relative hrefs", () => {
        expect(tool.crossLinks.links.length).toBeGreaterThanOrEqual(3);
        for (const link of tool.crossLinks.links) {
          expect(link.href.startsWith("/")).toBe(true);
          expect(link.blurb.length).toBeGreaterThan(30);
        }
        const hrefs = tool.crossLinks.links.map((link) => link.href.split("#")[0]);
        // Each calculator points to the glossary and/or the what-is-FIRE primer.
        expect(
          hrefs.some((href) => href === "/fire-glossary" || href === "/what-is-fire")
        ).toBe(true);
      });

      it("ships a real FAQ for the FAQPage schema", () => {
        expect(tool.faq.length).toBeGreaterThanOrEqual(5);
        for (const item of tool.faq) {
          expect(item.question.length).toBeGreaterThan(0);
          expect(item.answer.length).toBeGreaterThan(80);
        }
      });

      it("uses plain language — never the unexplained word 'nominal'", () => {
        expect(collectText(tool).toLowerCase()).not.toContain("nominal");
      });
    });
  }

  it("does not duplicate intro or how-it-works copy across calculators", () => {
    const intros = tools.map((tool) => tool.intro.join("\n"));
    expect(new Set(intros).size).toBe(intros.length);

    const howItWorks = tools.map((tool) =>
      tool.howItWorks.sections.flatMap((section) => section.paragraphs).join("\n")
    );
    expect(new Set(howItWorks).size).toBe(howItWorks.length);
  });
});
