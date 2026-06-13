import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Early Retirement Planning Guide: The Complete FIRE Roadmap | Plan My FIRE",
  description:
    "A step-by-step guide to planning early retirement — your FIRE number, savings, Social Security, housing, healthcare, and how to draw it all down. Free tools for each step.",
  keywords: [
    "plan early retirement",
    "early retirement planning",
    "FIRE",
    "how much do I need to retire early",
    "health insurance before 65",
    "early retirement guide",
    "FIRE roadmap"
  ],
  alternates: { canonical: "/early-retirement-guide" }
};

// Table-of-contents entries — each maps to a section id below. Server-rendered as
// a sticky sidebar on desktop and a boxed list on mobile.
const toc = [
  { id: "overview", label: "What this guide covers" },
  { id: "fire-number", label: "Start with your FIRE number" },
  { id: "stages", label: "The journey, in three stages" },
  { id: "pieces", label: "The pieces to plan" },
  { id: "models", label: "Choose how you'll fund it" },
  { id: "mistakes", label: "What people get wrong" },
  { id: "faq", label: "FAQ" },
  { id: "start", label: "Start planning, free" }
] as const;

// FAQ source — rendered visibly and as FAQPage JSON-LD from the same array so the
// markup and structured data never drift apart.
const faqs = [
  {
    q: "How much do I need to retire early?",
    a: "Roughly 25 times your annual spending — so $40,000 a year means about $1,000,000. Run your own numbers in the investment calculator."
  },
  {
    q: "What about health insurance before 65?",
    a: "You buy ACA marketplace coverage until Medicare begins at 65. The healthcare calculator projects the cost of those gap years."
  },
  {
    q: "What's a safe withdrawal rate?",
    a: "The 4% rule is the common starting point: withdraw 4% of your portfolio the first year, then adjust for inflation. The Portfolio Drawdown model tests it on your numbers."
  },
  {
    q: "When should I claim Social Security?",
    a: "Your benefit grows for each year you delay from 62 to 70. The Social Security calculator compares the timing side by side."
  }
] as const;

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The complete guide to planning your early retirement",
  description:
    "A step-by-step guide to planning early retirement: your FIRE number, savings, Social Security, housing, healthcare, and how to draw it all down.",
  about: "Early retirement planning (FIRE)",
  inLanguage: "en",
  isAccessibleForFree: true,
  mainEntityOfPage: `${siteUrl}/early-retirement-guide`,
  author: { "@type": "Organization", name: "Plan My FIRE", url: siteUrl },
  publisher: { "@type": "Organization", name: "Plan My FIRE", url: siteUrl }
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
    {
      "@type": "ListItem",
      position: 2,
      name: "Early Retirement Guide",
      item: `${siteUrl}/early-retirement-guide`
    }
  ]
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a }
  }))
};

const sectionHeadingClass =
  "scroll-mt-24 text-2xl font-bold tracking-[-0.01em] text-gray-900 sm:text-[1.7rem]";
const proseClass = "max-w-3xl space-y-4 text-base leading-relaxed text-gray-600";
const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm";

export default function EarlyRetirementGuidePage() {
  return (
    <AppShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/app/fire-path" className="hover:text-gray-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-700">Early Retirement Guide</li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
            ● Step-by-step FIRE roadmap
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            The complete guide to planning your early retirement
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            This guide walks you through early retirement planning end to end — from your FIRE
            number to drawing it all down. Every step links to a free tool, so you can plan the
            whole thing in one place.
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav aria-label="On this page" className={cardClass + " lg:p-5"}>
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                On this page
              </p>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((item, index) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex gap-2 text-gray-600 transition-colors hover:text-[var(--primary)]"
                    >
                      <span aria-hidden="true" className="text-gray-400 tabular-nums">
                        {index + 1}.
                      </span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="min-w-0 space-y-12">
            <section aria-labelledby="overview" className="space-y-4">
              <h2 id="overview" className={sectionHeadingClass}>
                What this guide covers
              </h2>
              <p className={proseClass}>
                Planning early retirement means lining up a handful of moving parts: your target
                number, your savings, Social Security, housing, and healthcare. Below is the order
                to tackle them — each with the free calculator that does the math.
              </p>
            </section>

            <section aria-labelledby="fire-number" className="space-y-4">
              <h2 id="fire-number" className={sectionHeadingClass}>
                Start with your FIRE number
              </h2>
              <p className={proseClass}>
                Your FIRE number is roughly <strong className="text-gray-900">25× your annual
                spending</strong> — save that, and a ~4% withdrawal covers your costs. New to this?
                Start with{" "}
                <Link href="/what-is-fire" className="font-medium text-[var(--primary)] hover:underline">
                  What is FIRE
                </Link>
                ; any unfamiliar term lives in the{" "}
                <Link href="/fire-glossary" className="font-medium text-[var(--primary)] hover:underline">
                  glossary
                </Link>
                .
              </p>
            </section>

            <section aria-labelledby="stages" className="space-y-4">
              <h2 id="stages" className={sectionHeadingClass}>
                The journey, in three stages
              </h2>
              <ol className="max-w-3xl space-y-3 text-base leading-relaxed text-gray-600">
                <li>
                  <strong className="text-gray-900">Accumulation</strong> — save and invest until
                  your portfolio reaches your FIRE number.
                </li>
                <li>
                  <strong className="text-gray-900">The pre-65 ACA gap</strong> — retire before 65
                  and you self-fund health insurance through the ACA marketplace until Medicare
                  starts.
                </li>
                <li>
                  <strong className="text-gray-900">Medicare at 65</strong> — coverage shifts to
                  Medicare, with new premiums and IRMAA surcharges to plan for.
                </li>
              </ol>
            </section>

            <section aria-labelledby="pieces" className="space-y-4">
              <h2 id="pieces" className={sectionHeadingClass}>
                The pieces to plan
              </h2>

              <div className={cardClass + " border-[var(--primary)] bg-[var(--soft)]"}>
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
                  ● Most early retirees overlook this
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">
                  Retirement healthcare cost calculator
                </h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                  Project medical costs across the pre-65 ACA gap years and Medicare — the single
                  biggest early-retirement wildcard.
                </p>
                <Link
                  href="/app/fire-path/tools/healthcare"
                  className="mt-3 inline-block text-sm font-semibold text-[var(--primary)] hover:underline"
                >
                  Open the healthcare calculator →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    href: "/app/fire-path/tools/investment",
                    title: "Investment calculator",
                    body: "Project how your savings grow toward your FIRE number."
                  },
                  {
                    href: "/app/fire-path/tools/social-security",
                    title: "Social Security calculator",
                    body: "Estimate your benefit at 62, full retirement age, and 70."
                  },
                  {
                    href: "/app/fire-path/tools/mortgage",
                    title: "Mortgage calculator",
                    body: "See your true monthly housing cost and payoff timeline."
                  }
                ].map((tool) => (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                  >
                    <h3 className="text-base font-semibold text-gray-900">{tool.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{tool.body}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
                      Open calculator →
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="models" className="space-y-4">
              <h2 id="models" className={sectionHeadingClass}>
                Choose how you&rsquo;ll fund it
              </h2>

              <Link
                href="/app/fire-path/withdrawal-rate"
                className="group block rounded-2xl border border-[var(--primary)] bg-[var(--soft)] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
                  ● Most popular — start here
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">Portfolio Drawdown</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                  Best for most people — spend your portfolio down using the 4% rule.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
                  Run this model →
                </span>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    href: "/app/fire-path/principal-preserving",
                    title: "Principal-Preserving",
                    body: "Best for leaving a legacy — live on investment income and never touch the principal."
                  },
                  {
                    href: "/app/fire-path/income-stream",
                    title: "Income Stream",
                    body: "Best for pensions or rentals — cover costs with steady income, no portfolio to draw down."
                  }
                ].map((model) => (
                  <Link
                    key={model.href}
                    href={model.href}
                    className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                  >
                    <h3 className="text-base font-semibold text-gray-900">{model.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{model.body}</p>
                    <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
                      Run this model →
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section aria-labelledby="mistakes" className="space-y-4">
              <h2 id="mistakes" className={sectionHeadingClass}>
                What people get wrong
              </h2>
              <ul className="max-w-3xl space-y-3 text-base leading-relaxed text-gray-600">
                <li>
                  <strong className="text-gray-900">The pre-65 healthcare gap</strong> —
                  underbudgeting the years of self-paid insurance before Medicare.
                </li>
                <li>
                  <strong className="text-gray-900">Sequence-of-returns risk</strong> — an early
                  market drop can sink a portfolio the average return would have sustained.
                </li>
                <li>
                  <strong className="text-gray-900">Taxes and IRMAA</strong> — withdrawals lift your
                  tax bill and can trigger Medicare premium surcharges.
                </li>
              </ul>
            </section>

            <section aria-labelledby="faq" className="space-y-4">
              <h2 id="faq" className={sectionHeadingClass}>
                FAQ
              </h2>
              <dl className="max-w-3xl space-y-4">
                {faqs.map((item) => (
                  <div key={item.q} className={cardClass}>
                    <dt className="text-base font-semibold text-gray-900">{item.q}</dt>
                    <dd className="mt-2 text-base leading-relaxed text-gray-600">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section aria-labelledby="start" className="space-y-4">
              <h2 id="start" className={sectionHeadingClass}>
                Start planning, free
              </h2>
              <div className={cardClass + " max-w-3xl bg-[var(--soft)]"}>
                <p className="text-base leading-relaxed text-gray-700">
                  Put it together in the{" "}
                  <Link
                    href="/app/fire-path"
                    className="font-semibold text-[var(--primary)] hover:underline"
                  >
                    free FIRE planner
                  </Link>{" "}
                  — private, no login, your earliest retirement age from your own numbers.
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
