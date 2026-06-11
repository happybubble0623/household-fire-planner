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

export type FaqItem = { question: string; answer: string };

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
