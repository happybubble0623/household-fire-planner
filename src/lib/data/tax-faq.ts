// Server-rendered SEO content for the 2026 federal income-tax estimator.
//
// Framework-free (no "use client") so the route's server component can render
// the intro prose and the Q&A in the initial HTML — crawlers and "People Also
// Ask" see the text without executing JavaScript — and build the FAQPage
// JSON-LD from the SAME source. Mirrors the investment-faq.ts template.

import type {
  CrossLink,
  HowItWorksSection,
  KeyConcept,
  SourcedDefault
} from "@/lib/data/tool-guide";

export type FaqItem = { question: string; answer: string };

// "How it works / what it accounts for" — walks through the order of operations
// the calculator runs and, just as important, what a current-year estimate
// leaves out.
export const taxHowItWorks: { heading: string; sections: HowItWorksSection[] } = {
  heading: "How the estimate works and what it accounts for",
  sections: [
    {
      heading: "From income to ordinary taxable income",
      paragraphs: [
        "The calculator starts by separating your money into two buckets, because the 2026 tax code taxes them differently. The first bucket is ordinary income: your wages and other income, plus any traditional (pre-tax) retirement withdrawals, which the IRS treats as ordinary income in the year you take them. From that bucket it subtracts your pre-tax retirement and HSA contributions and the standard deduction — $16,100 single or $32,200 married filing jointly for 2026, plus the extra age-65 amount if you toggle it on. What's left is your ordinary taxable income, and it can't go below zero.",
        "It then applies the 2026 ordinary brackets, which are marginal: each slice of income is taxed at its own rate, so only the dollars inside the 22% band are taxed at 22%, not your whole income. That is why your effective rate — total tax divided by total income — is almost always lower than the top bracket you reach, which is your marginal rate."
      ]
    },
    {
      heading: "Stacking long-term gains on top",
      paragraphs: [
        "Long-term capital gains and qualified dividends get their own, lower rate schedule — 0%, 15%, or 20% in 2026 — but which rate applies depends on your total taxable income, not the gains alone. The calculator uses the standard Qualified Dividends and Capital Gain worksheet method: it stacks your gains on top of your ordinary taxable income, then fills the 0% band first (up to the 15% threshold), the 15% band next (up to the 20% threshold), and the 20% band last. So the same $40,000 of gains can be partly tax-free and partly taxed at 15% depending on how much ordinary income sits underneath it.",
        "This stacking is the single most misunderstood part of investment taxes, and it is why selling in a low-income year can be so powerful: with little ordinary income beneath them, a large share of your long-term gains can fall inside the 0% band and be taxed at nothing at all."
      ]
    },
    {
      heading: "Credits, state tax, and the bottom line",
      paragraphs: [
        "After federal tax on ordinary income and gains is added together, the calculator subtracts the Child Tax Credit — $2,200 per qualifying child in 2026 — which phases out by $50 for every $1,000 (or fraction) of income above $400,000 married filing jointly or $200,000 for everyone else. This estimate treats the credit as nonrefundable: it can reduce your federal tax to zero but not below, so it won't show a refund of the credit's refundable portion. It then adds a simplified state tax: the flat rate you enter, applied to your taxable income. Finally it reports your total tax, effective rate, marginal bracket, and after-tax income.",
        "What it deliberately leaves out matters as much as what it includes. It does not model the Alternative Minimum Tax, the Net Investment Income Tax, itemized deductions, the many state-specific rules and brackets, payroll and self-employment taxes, or credits beyond the Child Tax Credit. Treat the result as a fast, transparent ballpark for planning — not a filled-in return."
      ]
    }
  ]
};

// Plain-language definitions of the tax terms the page uses.
export const taxKeyConcepts: { heading: string; intro?: string; items: KeyConcept[] } = {
  heading: "Tax terms, in plain language",
  intro: "A handful of ideas that explain why two people with the same income can owe very different amounts.",
  items: [
    {
      term: "Ordinary taxable income",
      definition:
        "Your wages and other ordinary income plus traditional retirement withdrawals, minus pre-tax contributions and the standard deduction. It's the number the ordinary brackets are applied to — not your gross paycheck."
    },
    {
      term: "Marginal vs. effective rate",
      definition:
        "Your marginal rate is the bracket your last dollar falls in; your effective rate is total tax divided by total income. Because brackets are progressive, the effective rate is almost always lower than the marginal one."
    },
    {
      term: "Standard deduction",
      definition:
        "A flat amount everyone can subtract before tax is figured — $16,100 single or $32,200 married filing jointly in 2026, with an extra age-65 add-on. You take it instead of itemizing; this tool assumes the standard deduction."
    },
    {
      term: "Long-term capital gains stacking",
      definition:
        "Long-term gains and qualified dividends sit on top of your ordinary income, then get the 0%/15%/20% rates based on your total taxable income. The more ordinary income underneath, the higher the rate your gains reach."
    },
    {
      term: "Traditional vs. Roth withdrawals",
      definition:
        "Traditional (pre-tax) 401(k) and IRA withdrawals are taxed as ordinary income when you take them; Roth withdrawals in retirement are tax-free. This calculator models traditional withdrawals — leave the field at zero for Roth."
    },
    {
      term: "Child Tax Credit phaseout",
      definition:
        "The $2,200-per-child credit shrinks by $50 for every $1,000 — or part of $1,000 — of income above $400,000 (married filing jointly) or $200,000 (others). A credit cuts tax dollar for dollar, unlike a deduction."
    },
    {
      term: "MAGI",
      definition:
        "Modified adjusted gross income — the income figure used to test credit phaseouts. This estimate approximates it as your wages, withdrawals, and gains minus pre-tax contributions, which is close enough for most households."
    }
  ]
};

// The fixed 2026 figures the calculator is built on and where they come from.
export const taxSourcedDefaults: {
  heading: string;
  intro?: string;
  items: SourcedDefault[];
} = {
  heading: "The 2026 figures the calculator uses",
  intro:
    "Every constant below is the official inflation-adjusted amount for tax year 2026 from IRS Revenue Procedure 2025-32 (as tabulated by the Tax Foundation). They're pinned with tests so they can't drift.",
  items: [
    {
      value: "$16,100 / $32,200",
      label: "Standard deduction (single / married filing jointly)",
      source: "IRS Rev. Proc. 2025-32, tax year 2026. An extra $2,050 (single) or $1,650 per qualifying spouse (MFJ) applies at age 65+."
    },
    {
      value: "10% – 37%",
      label: "Seven ordinary income brackets",
      source: "IRS Rev. Proc. 2025-32, 2026. The 37% top rate starts at $640,600 (single) and $768,700 (married filing jointly)."
    },
    {
      value: "0% / 15% / 20%",
      label: "Long-term capital-gains rates",
      source: "IRS Rev. Proc. 2025-32, 2026. The 15% rate begins at $49,450 (single) / $98,900 (MFJ) of total taxable income; 20% at $545,500 / $613,700."
    },
    {
      value: "$2,200",
      label: "Child Tax Credit per qualifying child",
      source: "IRS Rev. Proc. 2025-32, 2026. Up to $1,700 is refundable; phases out above $400,000 (MFJ) / $200,000 (others) at $50 per $1,000."
    },
    {
      value: "Flat %",
      label: "State income tax rate (you enter it)",
      source: "There's no single state rate, so you supply one. The tool applies it as a flat rate to taxable income — a simplification, not a state-specific calculation."
    }
  ]
};

// On-site links to related, deeper content.
export const taxCrossLinks: { heading: string; intro?: string; links: CrossLink[] } = {
  heading: "Where your tax estimate fits in",
  intro:
    "Taxes shape how much of your income and withdrawals you actually keep. These pages show how the after-tax number feeds the rest of your FIRE plan.",
  links: [
    {
      href: "/app/fire-path/tools/investment",
      label: "Investment growth calculator",
      blurb:
        "Project how a portfolio grows, then use this page to estimate the tax on the gains and withdrawals you'll eventually take from it."
    },
    {
      href: "/app/fire-path/tools/expenses",
      label: "Living expense calculator",
      blurb:
        "Your spending sets how much after-tax income you need. Size your expenses, then work backward through taxes to the gross income required."
    },
    {
      href: "/app/fire-path/withdrawal-rate",
      label: "Portfolio Drawdown FIRE (the 4% rule)",
      blurb:
        "Withdrawals from traditional accounts are taxed as ordinary income. Plan your drawdown, then estimate the tax bite each year here."
    },
    {
      href: "/fire-glossary",
      label: "FIRE glossary: brackets, Roth, and more",
      blurb:
        "Plain-language definitions for the tax and retirement-account terms behind these numbers — marginal rates, Roth conversions, and the rest."
    }
  ]
};

// Unique, keyword-led intro paragraphs for the tax page. Targets "2026 tax
// calculator", "federal income tax estimator", and "capital gains tax
// calculator" without leaning on jargon in the first sentence.
export const taxIntroParagraphs: string[] = [
  "This calculator estimates your 2026 federal income tax using the official inflation-adjusted figures from IRS Revenue Procedure 2025-32 — the 2026 brackets, the $16,100 / $32,200 standard deduction, the 0%/15%/20% long-term capital-gains rates, and the $2,200 Child Tax Credit. Enter your wages, retirement contributions and withdrawals, long-term gains, dependents, and a flat state rate, and it returns your federal tax, total tax, effective rate, and after-tax income.",
  "It's built for retirement and FIRE planning, so it handles the moving parts most simple calculators skip: traditional (pre-tax) withdrawals are added to your ordinary income, pre-tax 401(k)/IRA/HSA contributions are subtracted, and long-term capital gains are stacked on top of your ordinary income the way the IRS worksheet does — filling the 0% band first, then 15%, then 20% — so you see exactly how much of a gain is tax-free in a given year.",
  "It is an estimate, not tax advice or a filled-in return: it leaves out the Alternative Minimum Tax, the Net Investment Income Tax, itemized deductions, state-specific rules, payroll and FICA taxes, and most credits beyond the Child Tax Credit. The state line is a single flat rate you enter, applied to taxable income. Use it as a fast, transparent way to see how retirement-account choices and capital gains change what you owe."
];

// Questions phrased the way users actually search.
export const taxFaq: FaqItem[] = [
  {
    question: "How is my 2026 federal income tax calculated?",
    answer:
      "Your wages and other ordinary income plus any traditional retirement withdrawals are reduced by pre-tax contributions and the standard deduction to get ordinary taxable income, which is taxed through the progressive 2026 brackets (10% to 37%). Long-term capital gains and qualified dividends are taxed separately at 0%, 15%, or 20%, stacked on top of your ordinary income. The Child Tax Credit is then subtracted, and this tool adds a flat state rate you supply. The result is an estimate based on IRS Rev. Proc. 2025-32 — not a substitute for filing."
  },
  {
    question: "How are traditional 401(k) and IRA withdrawals taxed?",
    answer:
      "Withdrawals from traditional (pre-tax) 401(k)s and IRAs are taxed as ordinary income in the year you take them, at your regular bracket rates — there's no special lower rate the way there is for long-term capital gains. Enter them in the 'traditional withdrawals' field and the calculator adds them to your ordinary income. Roth withdrawals in retirement are generally tax-free, so for those you'd leave the withdrawal field at zero. This distinction is central to retirement tax planning, since it determines how much of each dollar you actually keep."
  },
  {
    question: "How are long-term capital gains taxed in 2026?",
    answer:
      "Long-term gains and qualified dividends use a separate 0%/15%/20% rate schedule, but the rate depends on your total taxable income, not the gains alone. The calculator stacks your gains on top of your ordinary taxable income: gains that fall below the 15% threshold ($49,450 single / $98,900 married filing jointly in 2026) are taxed at 0%, gains up to the 20% threshold ($545,500 / $613,700) at 15%, and the rest at 20%. That's why realizing gains in a low-income year can keep much of them tax-free."
  },
  {
    question: "How does the pre-tax contribution field lower my tax?",
    answer:
      "Pre-tax contributions to a traditional 401(k), traditional IRA, or HSA come out of your income before tax is figured, so the calculator subtracts them from your ordinary income. A $10,000 pre-tax contribution removes $10,000 from taxable income, and the tax you save equals that amount times your marginal rate — for example $2,200 at a 22% bracket. Roth contributions, by contrast, are made with after-tax money and don't reduce your taxable income, so you would not enter those here."
  },
  {
    question: "How does the Child Tax Credit phaseout work?",
    answer:
      "In 2026 the credit is $2,200 per qualifying child. It starts to phase out once modified adjusted gross income passes $400,000 for married filing jointly or $200,000 for everyone else, dropping by $50 for every $1,000 — or fraction of $1,000 — above that threshold. The calculator applies it as a nonrefundable credit, meaning it can reduce your federal tax to zero but not generate a refund beyond that. In a full return up to $1,700 per child can be refundable, which this estimate notes but doesn't pay out."
  },
  {
    question: "Why is my effective tax rate lower than my tax bracket?",
    answer:
      "Because the brackets are marginal: only the income inside each band is taxed at that band's rate. If you reach the 22% bracket, only the dollars above the 12% cutoff are taxed at 22% — everything below is taxed at 10% and 12%. Your effective rate is total tax divided by total income, which blends all those lower rates together and comes out well under your top bracket. The calculator reports both so you can see the difference clearly."
  },
  {
    question: "What does this calculator leave out?",
    answer:
      "Quite a bit, by design — it's a planning estimate, not a tax return. It does not model the Alternative Minimum Tax, the Net Investment Income Tax on high earners' investment income, itemized deductions (it assumes the standard deduction), state-specific brackets and rules, payroll/FICA and self-employment taxes, or credits beyond the Child Tax Credit. The state figure is a single flat rate you enter. For anything you'll actually file, confirm the numbers with tax software or a tax professional."
  }
];
