# SEO Action Plan — Household FIRE Planner

Status legend: **planned** (not started) · **in progress** · **done**.
Last updated: 2026-06-11.

This is the execution plan that turns the findings in [`SEO_AUDIENCE_RESEARCH.md`](./SEO_AUDIENCE_RESEARCH.md)
into shipped work. The research doc explains *who* we're targeting and *which words* win;
this doc lists *what we build* and tracks status. The healthcare calculator is being used as the
**template pass** — the patterns proven there (sourced/visible defaults, a real Q&A section with
FAQPage structured data, and server-rendered intro + FAQ) are then rolled out to every other
calculator.

---

## 1. Content (the biggest lever)

Search engines reward unique, helpful, question-shaped text. The product is mostly an interactive
client app today, so it is thin on crawlable prose — this is where most of the ranking upside is.

1. **FAQ / Q&A + FAQPage schema on every calculator.** — *in progress (started on healthcare)*
   Each calculator gets a real "Questions & answers" section written as the exact questions a user
   would search ("How much does health insurance cost before Medicare?", "What does Medicare cost at
   65?"), with matching FAQPage JSON-LD so the pages are eligible for rich results and "People Also
   Ask." Healthcare is the first implementation and the template for the rest (Social Security,
   mortgage, investment, and the three FIRE strategy calculators).

2. **A "What is FIRE?" explainer page + glossary.** — *planned*
   A dedicated, indexable explainer that defines FIRE warmly (per research §4.7) and a glossary that
   is the SEO home for the informational jargon keywords: safe withdrawal rate (SWR), coast FIRE,
   IRMAA, drawdown, the 4% rule, sequence-of-returns risk, Roth conversion ladder, ACA subsidy cliff.
   Pulling this traffic onto its own URL lets the hero stay jargon-light while still ranking for the
   terms.

3. **Short plain-language guides for high-volume, non-FIRE queries.** — *planned*
   Standalone guide pages aimed at the mainstream (Segment E) phrasing harvested in
   `SEO_AUDIENCE_RESEARCH.md` — e.g. "how much do I need to retire at 55", "early retirement health
   insurance", and "Roth conversion ladder explained." Each guide answers the question in plain
   English and links into the relevant calculator (the healthcare guide → healthcare calculator, the
   "retire at 55" guide → the FIRE strategy calculators), turning informational traffic into tool use.

4. **A unique, server-rendered intro paragraph on each calculator.** — *in progress (started on
   healthcare)*
   Every calculator page gets its own distinct, keyword-appropriate intro paragraph rendered in the
   initial HTML (not injected after hydration), so each page has unique crawlable copy rather than
   sharing boilerplate. Healthcare leads.

---

## 2. Technical SEO

5. **Server-render the hero + explainer content.** — *in progress (started on healthcare)*
   The calculator panels are React client components (`"use client"`). The static intro paragraphs,
   Q&A text, and JSON-LD are extracted into the server-rendered route/page wrappers so crawlers see
   the words in the initial HTML without executing JavaScript. Healthcare is the first page converted;
   apply the same wrapper pattern to the others.

6. **Structured data (schema.org JSON-LD).** — *in progress*
   - **FAQPage** — on every calculator (started on healthcare). *in progress*
   - **SoftwareApplication** — describe the planner itself (free, finance category, no login). *planned*
   - **WebSite + Organization** — site-level identity, enables sitelinks/search box. *planned*
   - **BreadcrumbList** — reflect the hub → calculator hierarchy for breadcrumb rich results. *planned*

7. **Unique `<title>` + meta description per calculator.** — *in progress (home done)*
   The home page title/description are finalized. Each calculator needs its own unique, keyword-led
   title and meta (healthcare updated to lead with "early retirement / pre-65 health insurance /
   Medicare costs"); roll the same per-page treatment to the remaining calculators.

8. **Complete sitemap, robots.txt, canonical tags, OpenGraph/Twitter cards.** — *planned*
   A `sitemap.xml` and `robots.ts` already exist and list the public routes; canonical tags exist per
   calculator. Remaining: keep the sitemap in sync as guide/glossary pages are added, confirm every
   page sets a canonical, and add OpenGraph + Twitter (summary_large_image) card metadata site-wide
   with a branded share image.

9. **Keep Core Web Vitals fast + mobile-friendly.** — *planned (ongoing)*
   Preserve the current fast, mobile-first build: server-render static text, avoid layout shift,
   keep client bundles lean, and verify LCP/CLS/INP stay green on mobile as content pages are added.

10. **Internal linking hub ↔ calculators ↔ guides ↔ glossary.** — *planned*
    Build a deliberate internal-link graph: the Path-to-FIRE hub links to every calculator (exists);
    each calculator links back to the hub and across to siblings (exists via "More planning tools");
    add links from calculators into the relevant guides and glossary terms, and from guides/glossary
    back into the calculators, so authority flows and users can move between learn-surfaces and tools.

---

## 3. Ongoing / off-page

11. **Search Console + Bing Webmaster Tools.** — *planned*
    Verify the production domain in Google Search Console and Bing Webmaster Tools, submit the
    sitemap, and monitor indexing/coverage and query performance to guide the content roadmap.

12. **Backlinks via owned angles.** — *planned*
    Earn links by leaning into the differentiators competitors can't easily match (research §3.2):
    household / two-spouse multi-account modeling, pre-65 healthcare depth (ACA cliff + Medicare/
    IRMAA), and no-login local-first privacy. These are the angles worth pitching to FIRE blogs,
    communities, and roundups.

13. **Keep yearly figures current.** — *planned (annual)*
    Healthcare and tax numbers are date-stamped and centralized (e.g. `healthcare-data.ts`). Refresh
    them each plan year — 2026 IRMAA brackets, the 2026 ACA subsidy cliff / applicable-percentage
    table, ACA out-of-pocket maximums, and Medicare Part B/Part D figures — both because accuracy is
    the product promise and because timely, current-year figures are themselves a content/SEO edge.

---

## Reference

- [`SEO_AUDIENCE_RESEARCH.md`](./SEO_AUDIENCE_RESEARCH.md) — audience segments, keyword map (plain-language
  vs FIRE-jargon split), competitive whitespace, and home-page wording recommendations that this plan
  executes against.
