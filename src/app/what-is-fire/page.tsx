import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "What is FIRE? A Plain-English Guide to Financial Independence",
  description:
    "FIRE means Financial Independence, Retire Early. A beginner-friendly guide that explains the FIRE acronym, the 4% rule and your FIRE number, the main types (Lean, Fat, Coast, Barista), and how to start — no jargon.",
  keywords: [
    "what is FIRE",
    "FIRE meaning",
    "financial independence retire early",
    "FIRE movement explained",
    "4% rule",
    "FIRE number",
    "Coast FIRE",
    "Barista FIRE"
  ],
  alternates: { canonical: "/what-is-fire" }
};

// Table-of-contents entries — each maps to a section id below. Rendered as a
// sticky sidebar on desktop and a simple list on mobile, both server-rendered.
const toc = [
  { id: "what-fire-means", label: "What FIRE means" },
  { id: "core-idea", label: "The one core idea" },
  { id: "fire-number", label: "Your FIRE number & the 4% rule" },
  { id: "flavors", label: "The main flavors of FIRE" },
  { id: "how-to-start", label: "How to start" },
  { id: "try-it", label: "Try it free" }
] as const;

// Article + BreadcrumbList structured data, rendered server-side so it is in the
// initial HTML for rich results. The canonical URL is derived from the same
// env-based site URL the rest of the app uses (no hardcoded domain).
const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What is FIRE? A Plain-English Guide to Financial Independence",
  description:
    "A beginner-friendly explainer of FIRE (Financial Independence, Retire Early): the core idea, your FIRE number and the 4% rule, the main flavors, and how to start.",
  about: "Financial Independence, Retire Early (FIRE)",
  inLanguage: "en",
  isAccessibleForFree: true,
  mainEntityOfPage: `${siteUrl}/what-is-fire`,
  author: { "@type": "Organization", name: "Plan My FIRE", url: siteUrl },
  publisher: { "@type": "Organization", name: "Plan My FIRE", url: siteUrl }
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
    { "@type": "ListItem", position: 2, name: "What is FIRE?", item: `${siteUrl}/what-is-fire` }
  ]
};

const sectionHeadingClass =
  "scroll-mt-24 text-2xl font-bold tracking-[-0.01em] text-gray-900 sm:text-[1.7rem]";
const proseClass = "max-w-3xl space-y-4 text-base leading-relaxed text-gray-600";
const cardClass = "rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm";

export default function WhatIsFirePage() {
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

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        {/* Breadcrumb trail (visible) for orientation and crawlability. */}
        <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/app/fire-path" className="hover:text-gray-900">
                Home
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-gray-700">What is FIRE?</li>
          </ol>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
            ● Beginner-friendly guide
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            What is FIRE?
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            <strong className="font-semibold text-gray-900">FIRE</strong> stands for{" "}
            <strong className="font-semibold text-gray-900">
              Financial Independence, Retire Early
            </strong>
            . It is a way of planning your money so that, much sooner than the usual retirement
            age, you no longer need a paycheck to cover your living costs. This guide explains how
            it works in plain language — no finance background needed.
          </p>
        </header>

        <div className="mt-10 grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          {/* Sticky table of contents on desktop; a simple boxed list on mobile. */}
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
            <section aria-labelledby="what-fire-means" className="space-y-4">
              <h2 id="what-fire-means" className={sectionHeadingClass}>
                What the FIRE acronym means
              </h2>
              <div className={proseClass}>
                <p>
                  FIRE is short for <strong>Financial Independence, Retire Early</strong>. It joins
                  two related ideas:
                </p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    <strong className="text-gray-900">Financial Independence (FI)</strong> — having
                    enough money from savings, investments, or steady income that you no longer
                    depend on a job to pay for your life. Work becomes a choice, not a requirement.
                  </li>
                  <li>
                    <strong className="text-gray-900">Retire Early (RE)</strong> — using that
                    independence to stop full-time work years (sometimes decades) before the
                    traditional retirement age.
                  </li>
                </ul>
                <p>
                  You do not have to do both. Plenty of people aim only for financial independence —
                  the security of not needing a paycheck — and keep working because they want to.
                  &ldquo;Early retirement&rdquo; can also mean switching to part-time, lower-stress,
                  or more meaningful work rather than stopping entirely.
                </p>
              </div>
            </section>

            <section aria-labelledby="core-idea" className="space-y-4">
              <h2 id="core-idea" className={sectionHeadingClass}>
                The one core idea
              </h2>
              <div className={proseClass}>
                <p>Strip away the details and FIRE comes down to a single loop:</p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong className="text-gray-900">Save a meaningful share of your income.</strong>{" "}
                    The bigger the gap between what you earn and what you spend, the faster this
                    works. Many people in the FIRE community aim to save anywhere from 25% to 50% or
                    more of their take-home pay.
                  </li>
                  <li>
                    <strong className="text-gray-900">Invest it so it grows.</strong> Money left in
                    a checking account barely keeps up with rising prices. Invested — commonly in
                    low-cost index funds, which spread your money across many companies at once — it
                    can grow over the years through compounding (earnings that themselves earn
                    more).
                  </li>
                  <li>
                    <strong className="text-gray-900">Live off it.</strong> Once your savings (plus
                    any steady income) are large enough to cover your living costs for the rest of
                    your life, you are financially independent — and can retire whenever you like.
                  </li>
                </ol>
                <p>
                  That is the whole engine. Everything else — the different &ldquo;flavors&rdquo; of
                  FIRE, the 4% rule, the calculators — is just a way of answering one question:{" "}
                  <em>how much is &ldquo;enough,&rdquo; and when do I get there?</em>
                </p>
              </div>
            </section>

            <section aria-labelledby="fire-number" className="space-y-4">
              <h2 id="fire-number" className={sectionHeadingClass}>
                Your FIRE number and the 4% rule
              </h2>
              <div className={proseClass}>
                <p>
                  Your <strong className="text-gray-900">FIRE number</strong> is the total amount
                  you are aiming to save before you can retire. A simple way to estimate it uses the{" "}
                  <strong className="text-gray-900">4% rule</strong>.
                </p>
                <p>
                  The 4% rule is a rule of thumb that says: in your first year of retirement you can
                  withdraw about 4% of your investments, then adjust that dollar amount for
                  inflation each year after, and your money should last roughly 30 years. It comes
                  from studies of past market history — so treat it as a sensible starting guide,
                  not a guarantee.
                </p>
                <p>
                  Flip the 4% rule around and it hands you a savings target: about{" "}
                  <strong className="text-gray-900">25 times your yearly spending</strong>.
                </p>
              </div>
              <div className={cardClass + " max-w-3xl bg-[var(--soft)]"}>
                <p className="text-sm font-semibold uppercase tracking-[0.06em] text-gray-500">
                  A quick example
                </p>
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  If you spend <span className="font-semibold tabular-nums">$40,000</span> a year,
                  your FIRE number is roughly{" "}
                  <span className="font-semibold tabular-nums">$40,000 × 25 = $1,000,000</span>. At
                  a 4% withdrawal rate, that million dollars would provide about{" "}
                  <span className="font-semibold tabular-nums">$40,000</span> in your first
                  year — enough to cover your spending.
                </p>
              </div>
              <p className={proseClass + " max-w-3xl"}>
                Real plans add nuance — taxes, health insurance before Medicare, Social Security,
                and how flexible you can be if markets fall. That is exactly what the calculators on
                this site help you work through, using your own numbers.
              </p>
            </section>

            <section aria-labelledby="flavors" className="space-y-4">
              <h2 id="flavors" className={sectionHeadingClass}>
                The main flavors of FIRE
              </h2>
              <p className={proseClass + " max-w-3xl"}>
                FIRE is not one-size-fits-all. The first three are about how you fund the years
                after work — each is a model you can run here. The rest tune the lifestyle and
                timing you are aiming for:
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    name: "Portfolio Drawdown FIRE",
                    href: "/app/fire-path/withdrawal-rate",
                    body:
                      "Build savings, then spend them down gradually. The 4%-rule path — simplest, most common, and usually the earliest finish line."
                  },
                  {
                    name: "Principal-Preserving FIRE",
                    href: "/app/fire-path/principal-preserving",
                    body:
                      "Live on the income your investments produce and leave the savings themselves untouched, so they can last indefinitely."
                  },
                  {
                    name: "Income Stream FIRE",
                    href: "/app/fire-path/income-stream",
                    body:
                      "Cover your costs with reliable income — a pension, rental, or Social Security — so there is no portfolio to draw down."
                  },
                  {
                    name: "Lean FIRE",
                    body:
                      "Reaching independence on a smaller, carefully managed budget. Lower spending means a lower FIRE number, so you can retire sooner — with a more frugal lifestyle as the trade-off."
                  },
                  {
                    name: "Fat FIRE",
                    body:
                      "Aiming for a comfortable, higher-spending lifestyle in retirement. It needs a much larger amount saved, because your yearly spending target is bigger."
                  },
                  {
                    name: "Coast FIRE",
                    body:
                      "You have already invested enough that it should grow on its own to fund a normal-age retirement — even if you never save another dollar. From here you only need to earn enough to cover today's bills, so you can ease off."
                  },
                  {
                    name: "Barista FIRE",
                    body:
                      "You quit your main career but keep a part-time or lower-stress job — often for health insurance and a little income. Savings cover most costs; the part-time work covers the rest."
                  }
                ].map((flavor) =>
                  flavor.href ? (
                    <Link
                      key={flavor.name}
                      href={flavor.href}
                      className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md"
                    >
                      <h3 className="text-lg font-semibold text-gray-900">{flavor.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{flavor.body}</p>
                      <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
                        Explore this model →
                      </span>
                    </Link>
                  ) : (
                    <div key={flavor.name} className={cardClass}>
                      <h3 className="text-lg font-semibold text-gray-900">{flavor.name}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{flavor.body}</p>
                    </div>
                  )
                )}
              </div>
              <p className="max-w-3xl text-sm leading-relaxed text-gray-500">
                Want the precise definitions side by side? See the{" "}
                <Link href="/fire-glossary" className="font-medium text-[var(--primary)] hover:underline">
                  FIRE glossary
                </Link>
                , where each term links to the calculator that puts it to work.
              </p>
            </section>

            <section aria-labelledby="how-to-start" className="space-y-4">
              <h2 id="how-to-start" className={sectionHeadingClass}>
                How to start
              </h2>
              <div className={proseClass}>
                <p>
                  You do not need to have it all figured out. A practical first pass looks like
                  this — or follow the full{" "}
                  <Link
                    href="/early-retirement-guide"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    early retirement planning guide
                  </Link>
                  :
                </p>
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    <strong className="text-gray-900">Know your yearly spending.</strong> This is
                    the single most important number — it drives your FIRE number. Add up roughly
                    what your household spends in a year.
                  </li>
                  <li>
                    <strong className="text-gray-900">Estimate your FIRE number.</strong> Multiply
                    that yearly spending by about 25 for a first target. Any term that trips you up
                    is defined in the{" "}
                    <Link href="/fire-glossary" className="font-medium text-[var(--primary)] hover:underline">
                      glossary
                    </Link>
                    .
                  </li>
                  <li>
                    <strong className="text-gray-900">Raise your savings rate.</strong> Look for the
                    gap between income and spending, and direct more of it into low-cost
                    investments. The{" "}
                    <Link
                      href="/app/fire-path/tools/investment"
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      Investment calculator
                    </Link>{" "}
                    shows how even small, steady increases compound over time.
                  </li>
                  <li>
                    <strong className="text-gray-900">Pick a strategy and test it.</strong> Decide
                    how you will fund the years after work, then run the matching model:{" "}
                    <Link
                      href="/app/fire-path/withdrawal-rate"
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      Portfolio Drawdown
                    </Link>{" "}
                    to spend savings down,{" "}
                    <Link
                      href="/app/fire-path/principal-preserving"
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      Principal-Preserving
                    </Link>{" "}
                    to live on what they earn, or{" "}
                    <Link
                      href="/app/fire-path/income-stream"
                      className="font-medium text-[var(--primary)] hover:underline"
                    >
                      Income Stream
                    </Link>{" "}
                    to lean on steady income. Each checks the earliest age your real numbers allow.
                  </li>
                </ol>
              </div>
            </section>

            <section aria-labelledby="try-it" className="space-y-5">
              <h2 id="try-it" className={sectionHeadingClass}>
                Try it free with our calculators
              </h2>
              <p className={proseClass + " max-w-3xl"}>
                The best way to understand FIRE is to run your own numbers. Every tool below is
                free, private, and works without a login — your data stays on your device unless you
                choose to create an account.
              </p>

              <Link
                href="/app/portfolio-lab"
                className="group block rounded-2xl border-[1.5px] border-[var(--gold)] bg-[var(--surface)] p-6 shadow-md ring-4 ring-[var(--gold-bg)] transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)] px-3 py-1 text-xs font-bold text-gray-900">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" aria-hidden="true">
                    <path d="M12 2l2.6 6.6L21 9.2l-5 4.6L17.4 21 12 17.3 6.6 21 8 13.8l-5-4.6 6.4-.6z" />
                  </svg>
                  Our flagship — start here
                </span>
                <h3 className="mt-3 text-lg font-semibold text-gray-900">Understand Your Portfolio</h3>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
                  See every account in one place — your whole household portfolio, with daily
                  prices. Free, no login.
                </p>
                <span className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
                  Open the Portfolio Tracker &rarr;
                </span>
              </Link>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  {
                    href: "/app/fire-path/tools/social-security",
                    title: "Social Security benefit calculator",
                    body: "Estimate your worker benefit at 62, full retirement age, and 70."
                  },
                  {
                    href: "/app/fire-path/tools/healthcare",
                    title: "Retirement healthcare cost calculator",
                    body: "Project medical costs across the pre-Medicare ACA gap years and Medicare."
                  },
                  {
                    href: "/app/fire-path/tools/mortgage",
                    title: "Mortgage calculator",
                    body: "See monthly principal and interest, total interest, and payoff cost."
                  },
                  {
                    href: "/app/fire-path/tools/investment",
                    title: "Investment calculator",
                    body: "Project a balance from starting assets, contributions, return, and time."
                  },
                  {
                    href: "/app/fire-path/tools/expenses",
                    title: "Living expense calculator",
                    body: "Add up your real annual spending — the number that drives your FIRE target."
                  },
                  {
                    href: "/app/fire-path/tools/tax",
                    title: "2026 tax calculator",
                    body: "Estimate your federal income tax on retirement withdrawals and income."
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

              <div className={cardClass + " max-w-3xl"}>
                <p className="text-base leading-relaxed text-gray-700">
                  Want to start from the big picture? The{" "}
                  <Link
                    href="/app/fire-path"
                    className="font-semibold text-[var(--primary)] hover:underline"
                  >
                    main FIRE planner
                  </Link>{" "}
                  walks you through your whole household, and the supporting{" "}
                  <Link
                    href="/app/fire-path/tools/social-security"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    Social Security
                  </Link>
                  ,{" "}
                  <Link
                    href="/app/fire-path/tools/healthcare"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    healthcare
                  </Link>
                  , and{" "}
                  <Link
                    href="/app/fire-path/tools/investment"
                    className="font-medium text-[var(--primary)] hover:underline"
                  >
                    investment
                  </Link>{" "}
                  calculators sharpen each assumption. New terms along the way are all explained in
                  the{" "}
                  <Link href="/fire-glossary" className="font-medium text-[var(--primary)] hover:underline">
                    glossary
                  </Link>
                  .
                </p>
              </div>
            </section>
          </article>
        </div>
      </div>
    </AppShell>
  );
}
