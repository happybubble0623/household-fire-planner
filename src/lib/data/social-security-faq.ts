// Server-rendered SEO content for the Social Security benefit calculator.
//
// Framework-free (no "use client") so the route's server component can render
// the intro prose and the Q&A in the initial HTML — crawlers and "People Also
// Ask" see the text without executing JavaScript — and build the FAQPage
// JSON-LD from the SAME source, keeping the visible Q&A and the structured data
// in lockstep. This mirrors the healthcare-faq.ts template.
//
// The calculator panel itself is a client component; keeping this copy here (not
// in the panel) is the template pattern shared across the calculators.

import type {
  CrossLink,
  HowItWorksSection,
  KeyConcept,
  SourcedDefault
} from "@/lib/data/tool-guide";

export type FaqItem = { question: string; answer: string };

// "How it works / what it accounts for" — walks through the exact steps the
// calculator runs (highest-35 indexed earnings → AIME → bend-point PIA →
// claiming-age adjustment), in plain language.
export const socialSecurityHowItWorks: { heading: string; sections: HowItWorksSection[] } = {
  heading: "How the estimate works and what it accounts for",
  sections: [
    {
      heading: "From your earnings to an average (AIME)",
      paragraphs: [
        "The calculator starts from the covered earnings you enter — either a starting salary that grows each year, or exact year-by-year wages if you fill in the optional table. Each year is capped at that year's Social Security taxable maximum (the most that can count toward a benefit — $184,500 in 2026), because earnings above the cap are neither taxed for Social Security nor counted.",
        "It then indexes older years up for wage growth so a dollar earned decades ago is measured against today's wages, keeps your highest 35 years (missing years count as $0), adds them up, and divides by 420 months. That figure is your Average Indexed Monthly Earnings, or AIME — the single number the benefit formula works from."
      ]
    },
    {
      heading: "From AIME to your full-retirement-age benefit (PIA)",
      paragraphs: [
        "Your AIME runs through a three-piece formula with two cut points called bend points. You get 90% of the first slice of AIME, 32% of the next slice, and 15% of anything above that. For 2026 the bend points are $1,286 and $7,749. The result is your Primary Insurance Amount (PIA) — the monthly benefit if you claim exactly at full retirement age.",
        "Because the first slice is replaced at 90% and the top slice at only 15%, the formula is deliberately progressive: lower earners get back a much larger share of their earnings than higher earners. That is why doubling your income does not double your benefit."
      ]
    },
    {
      heading: "Adjusting for the age you claim",
      paragraphs: [
        "Your full retirement age (FRA) depends on your birth year — 67 for anyone born in 1960 or later. Claim before FRA and the benefit is permanently reduced (about five-ninths of 1% for each of the first 36 early months, plus five-twelfths of 1% for each month beyond that), which works out to roughly 30% less at 62 when your FRA is 67. Wait past FRA and you earn delayed-retirement credits of two-thirds of 1% per month — about 8% a year — up to age 70, after which there is no further increase. The tool shows the benefit at 62, your FRA, and 70 side by side so the trade-off is concrete."
      ]
    },
    {
      heading: "What the number means — and what it leaves out",
      paragraphs: [
        "Results are shown in today's dollars (the figure is discounted back by the wage-growth assumption), so they reflect today's buying power rather than the larger amount you'd actually receive once decades of inflation are added. The estimate also does not add future cost-of-living adjustments, so treat it as a conservative floor.",
        "It models one worker's retirement benefit only — not spousal, divorced-spouse, or survivor benefits, and it does not read your real SSA record or ask for your Social Security number. Every input stays in your browser. For your official figure, sign in at ssa.gov."
      ]
    }
  ]
};

// Plain-language definitions of the jargon the tool necessarily uses.
export const socialSecurityKeyConcepts: { heading: string; intro?: string; items: KeyConcept[] } = {
  heading: "Key Social Security terms, in plain language",
  intro:
    "Social Security has its own vocabulary. Here is what the terms behind the estimate actually mean.",
  items: [
    {
      term: "Average Indexed Monthly Earnings (AIME)",
      definition:
        "Your highest 35 years of covered earnings — each capped at that year's taxable maximum and adjusted up for past wage growth — added together and divided by 420 months. It is the average the benefit formula starts from."
    },
    {
      term: "Primary Insurance Amount (PIA)",
      definition:
        "The monthly benefit you'd get if you claimed exactly at your full retirement age. It comes from running your AIME through the 90% / 32% / 15% bend-point formula."
    },
    {
      term: "Bend points",
      definition:
        "The two income cut-offs in the benefit formula ($1,286 and $7,749 for 2026). They split your AIME into slices that are replaced at 90%, 32%, and 15% — which is why the formula favors lower earners."
    },
    {
      term: "Full retirement age (FRA)",
      definition:
        "The age you can claim your unreduced benefit — 67 for anyone born in 1960 or later. Claim earlier and you get less for life; wait and you get more."
    },
    {
      term: "Delayed-retirement credits",
      definition:
        "The roughly 8% per year (two-thirds of 1% per month) your benefit grows for each year you wait past full retirement age, up to age 70. After 70 waiting adds nothing."
    },
    {
      term: "Early-claiming reduction",
      definition:
        "The permanent cut for claiming before full retirement age — about 30% less at 62 when your FRA is 67. It never reverses once you start."
    },
    {
      term: "Credits (quarters of coverage)",
      definition:
        "What you earn by working: up to 4 a year, each requiring $1,890 in covered earnings in 2026. You need 40 credits — about 10 years of work — to qualify for a retirement benefit."
    },
    {
      term: "Break-even age",
      definition:
        "The age at which the larger checks from waiting catch up to the head start of claiming early. Live past it and waiting wins on total dollars; the right call depends on your health, savings, and need for income now."
    },
    {
      term: "Taxable maximum",
      definition:
        "The cap on earnings that count toward Social Security each year ($184,500 in 2026). Income above it is neither taxed for Social Security nor reflected in your benefit."
    }
  ]
};

// The fixed figures the estimate is built on, with their source — mirrors the
// visible, sourced field notes in the interactive panel.
export const socialSecuritySourcedDefaults: {
  heading: string;
  intro?: string;
  items: SourcedDefault[];
} = {
  heading: "The figures behind the estimate, and where they come from",
  intro:
    "The calculator is seeded with the official 2026 Social Security parameters. They are visible so you can trust the starting point and replace your own earnings with exact figures.",
  items: [
    {
      value: "$1,286 / $7,749",
      label: "2026 PIA bend points",
      source: "Social Security Administration, 2026 benefit-formula bend points."
    },
    {
      value: "67",
      label: "Full retirement age (born 1960+)",
      source: "SSA full-retirement-age schedule by birth year."
    },
    {
      value: "$184,500",
      label: "2026 taxable maximum",
      source: "SSA 2026 contribution and benefit base."
    },
    {
      value: "$1,890",
      label: "Earnings per credit (2026)",
      source: "SSA 2026 quarter-of-coverage amount; up to 4 credits a year."
    },
    {
      value: "3%/yr",
      label: "Default wage-growth assumption",
      source: "Conservative long-run basis; the SSA 2025 Trustees intermediate projection is about 3.6%. Editable."
    },
    {
      value: "Top 35 yrs",
      label: "Years used (÷ 420 months)",
      source: "SSA averaging rule: highest 35 indexed years; missing years count as $0."
    }
  ]
};

// On-site links to related, deeper content.
export const socialSecurityCrossLinks: { heading: string; intro?: string; links: CrossLink[] } = {
  heading: "Keep planning",
  intro:
    "Social Security is one income stream in a retirement plan. These pages put it in context.",
  links: [
    {
      href: "/app/fire-path/income-stream",
      label: "Income Stream FIRE",
      blurb:
        "Retire on guaranteed income alone — Social Security, a pension, or rental income — without drawing down a portfolio. Your benefit estimate is the backbone of this approach."
    },
    {
      href: "/what-is-fire#fire-number",
      label: "What is FIRE — and your FIRE number",
      blurb:
        "Lifetime income like Social Security lowers how much you must save yourself. See how the FIRE number works and where guaranteed income fits."
    },
    {
      href: "/fire-glossary",
      label: "FIRE glossary",
      blurb:
        "Plain-language definitions for AIME, PIA, the 4% rule, drawdown, and the rest of the retirement vocabulary."
    },
    {
      href: "/app/fire-path/tools/healthcare",
      label: "Retirement healthcare cost calculator",
      blurb:
        "Health insurance is the other big retirement unknown. Estimate ACA gap-year and Medicare costs alongside your benefit."
    }
  ]
};

// Unique, keyword-led intro paragraphs for the Social Security page. Targets
// "Social Security benefit calculator", "when to claim Social Security", and the
// 62-vs-FRA-vs-70 claiming-age question without leaning on jargon up front.
export const socialSecurityIntroParagraphs: string[] = [
  "Social Security is the backbone of most retirement plans, but two questions decide how much you actually get: how much you earned over your career, and the age you choose to start. This calculator estimates your monthly worker benefit from your covered earnings and then shows it side by side at the three ages that matter most — 62, your full retirement age, and 70 — so you can see what waiting is really worth.",
  "The estimate uses the official Social Security formula and the 2026 figures published by the SSA: your highest 35 years of earnings (each capped at that year's taxable maximum and indexed for wage growth), the 90% / 32% / 15% bend-point formula, a full retirement age of 67 for anyone born in 1960 or later, the early-claiming reduction of about 30% at 62, and the roughly 8% per year of delayed-retirement credits up to age 70.",
  "It's an unofficial planning estimate, not your official benefit. It never asks for your Social Security number and doesn't read your real SSA earnings record — every number comes from what you enter, and the defaults are sourced figures shown right at each field so you can trust the starting point and replace it with your own. For your official amount, create an account at ssa.gov."
];

// Questions phrased the way users actually search, so the page is eligible for
// rich results and "People Also Ask". Answers carry the substance that used to
// live in the panel's "How this estimate works" block, plus high-intent adds.
export const socialSecurityFaq: FaqItem[] = [
  {
    question: "What's the best age to claim Social Security?",
    answer:
      "There's no single best age — it depends on your health, savings, and whether you're still working. The trade-off is fixed: claiming early at 62 permanently shrinks your check (about 30% less when your full retirement age is 67), while every year you wait past full retirement age adds roughly 8% until age 70, when the benefit maxes out. Claiming early gives you more years of smaller checks; waiting gives you fewer years of larger, inflation-protected checks that also raise a surviving spouse's benefit. Use the 62 / full-retirement-age / 70 comparison above to see the dollar difference for your own earnings."
  },
  {
    question: "How is my Social Security benefit calculated?",
    answer:
      "Social Security averages your highest 35 years of earnings (each capped at that year's taxable maximum and indexed up for wage growth through the year you turn 60), divides by 420 months to get your Average Indexed Monthly Earnings (AIME), then runs that through the bend-point formula: 90% of the first slice, 32% of the next, and 15% above that. That result is your Primary Insurance Amount (PIA) — the benefit at full retirement age — which is then adjusted up or down for the age you actually claim."
  },
  {
    question: "How much will I get from Social Security?",
    answer:
      "It depends almost entirely on your lifetime earnings and your claiming age. Higher earners get bigger checks, but the formula is progressive — lower earnings are replaced at a much higher rate — so the benefit grows more slowly as income rises. Enter your covered earnings above to estimate your monthly amount at 62, full retirement age, and 70. This tool shows results in today's dollars and does not add future cost-of-living adjustments, so treat it as a floor for planning."
  },
  {
    question: "Does it use all of my working years?",
    answer:
      "No. Social Security only uses your highest 35 years of earnings. We sort your years from highest to lowest, keep the top 35, and ignore the rest. Working more than 35 years helps only when a new year is higher than one already in your top 35 — it then replaces the lowest one. If you have fewer than 35 years, the missing years count as $0, which lowers the average."
  },
  {
    question: "What is AIME?",
    answer:
      "Average Indexed Monthly Earnings. We take your top 35 years (each capped at that year's Social Security taxable maximum and adjusted upward for wage growth through the year you turn 60), add them up, and divide by 420 months (35 years times 12)."
  },
  {
    question: "How does the benefit formula (PIA) work?",
    answer:
      "Your AIME runs through a bend-point formula: 90% of the first slice, 32% of the next slice, and 15% above that. For 2026 the bend points are $1,286 and $7,749. Lower earnings are replaced at a higher rate, so the benefit grows more slowly as earnings rise."
  },
  {
    question: "How does my claiming age change the amount?",
    answer:
      "Your Full Retirement Age (FRA) depends on your birth year (67 for those born in 1960 or later). Claiming early — as soon as age 62 — permanently reduces the benefit (about 30% lower at 62 when FRA is 67). Waiting past FRA adds delayed-retirement credits of about 8% per year up to age 70, after which there's no further increase."
  },
  {
    question: "How many credits do I need to qualify?",
    answer:
      "You need 40 credits — roughly 10 years of work. You can earn up to 4 credits per year, and in 2026 each credit takes $1,890 in covered earnings (so $7,560 earns the full four for the year). Without 40 credits, no retirement benefit is payable."
  },
  {
    question: "Is this my official Social Security amount?",
    answer:
      "No. This is an unofficial estimate based only on what you enter. It does not use your real SSA earnings record and never asks for your SSN. It uses a projected wage-growth assumption and 2026 figures, and shows results in today's dollars (it does not add future cost-of-living increases). Your official estimate at ssa.gov may differ."
  }
];
