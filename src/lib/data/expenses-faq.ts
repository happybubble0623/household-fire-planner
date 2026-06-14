// Server-rendered SEO content for the annual living-expense estimator.
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

// "How it works / what it accounts for" — explains how the per-category totals
// roll up and, just as important, what a simple expense estimate leaves out.
export const expensesHowItWorks: { heading: string; sections: HowItWorksSection[] } = {
  heading: "How the estimate works and what it accounts for",
  sections: [
    {
      heading: "Adding up categories, monthly or annual",
      paragraphs: [
        "The calculator is a structured adder: you enter a number for each spending category — housing, utilities, groceries, transportation, healthcare, insurance, dining and entertainment, travel, subscriptions, and a catch-all for everything else. A single switch tells it whether those numbers are monthly or annual, and it converts the whole list at once: monthly figures are multiplied by twelve, annual figures divided by twelve, so you always see both a monthly and an annual total.",
        "Breaking spending into categories is more accurate than guessing one lump sum, because it forces you to account for the costs that are easy to forget — the once-a-year insurance premium, the streaming services, the travel you do every summer. Enter what you actually spend where you can, and use the sourced defaults as a starting point for the rest."
      ]
    },
    {
      heading: "Why annual living expenses matter for FIRE",
      paragraphs: [
        "Your annual living expenses are the foundation of every financial-independence number. The most common rule of thumb multiplies them by 25 (the inverse of a 4% safe withdrawal rate) to estimate the portfolio you'd need to retire. So a household spending $60,000 a year is loosely targeting roughly $1.5 million invested. Get the expense figure wrong and every downstream target is wrong with it.",
        "That makes the spending number worth getting right twice over: it sets how much you need to save, and how fast you can get there, since every dollar not spent is a dollar that can be invested. This tool is deliberately standalone — it just produces a clean annual and monthly total — so you can use that figure wherever you plan."
      ]
    },
    {
      heading: "What a simple total leaves out",
      paragraphs: [
        "A point-in-time total is a snapshot, not a forecast. It does not adjust for inflation, so a budget that works today will buy less in twenty years — plan to revisit it. It also assumes your spending is steady, when real life is lumpy: a new roof, a medical year, or a paid-off mortgage can move the number sharply. And it captures spending, not income or taxes, which you'll want to layer on separately when you build a full plan.",
        "Treat the result as a considered baseline you can stress-test, not a precise prediction. The most useful habit is to run it against a few months of real statements once, then sanity-check it once a year."
      ]
    }
  ]
};

// Plain-language definitions of the budgeting terms the page uses.
export const expensesKeyConcepts: { heading: string; intro?: string; items: KeyConcept[] } = {
  heading: "Budgeting terms, in plain language",
  intro: "A few concepts that decide how useful your living-expense estimate turns out to be.",
  items: [
    {
      term: "Annual living expenses",
      definition:
        "Everything it costs to run your life for a year — housing, food, transport, insurance, fun, and the rest. It's the single most important input to a FIRE plan because every savings target is built on it."
    },
    {
      term: "Fixed vs. variable costs",
      definition:
        "Fixed costs (rent or mortgage, insurance, subscriptions) stay roughly the same each month; variable costs (groceries, dining, travel) swing with choices. Separating them shows where you can flex spending and where you can't."
    },
    {
      term: "Monthly vs. annual",
      definition:
        "Two views of the same spending. Monthly is easier to feel; annual is what FIRE math uses. This tool keeps both in sync so you never have to multiply by twelve in your head."
    },
    {
      term: "The 25x rule",
      definition:
        "A quick way to turn annual expenses into a savings target: multiply them by 25, the inverse of a 4% withdrawal rate. It's a rough planning heuristic, not a guarantee — but it shows why your expense number drives everything."
    },
    {
      term: "Discretionary spending",
      definition:
        "The wants rather than the needs — dining out, travel, hobbies, extra subscriptions. It's the part of a budget you can dial down to reach financial independence faster, or keep to enjoy the journey."
    },
    {
      term: "Lifestyle inflation",
      definition:
        "The tendency for spending to creep up as income rises. Estimating expenses category by category makes the creep visible, which is the first step to keeping it in check."
    }
  ]
};

// The prefilled defaults and their basis — mirrors the visible field notes in
// the interactive calculator.
export const expensesSourcedDefaults: {
  heading: string;
  intro?: string;
  items: SourcedDefault[];
} = {
  heading: "The default amounts, and where they come from",
  intro:
    "The prefilled figures are rounded monthly placeholders drawn from US national-average household spending (Bureau of Labor Statistics Consumer Expenditure Survey). They're a starting point, not your budget — replace each with your own number.",
  items: [
    {
      value: "$1,800/mo",
      label: "Housing",
      source: "Rent or mortgage plus upkeep — the largest category for most households (BLS CE national average, rounded). Varies enormously by region."
    },
    {
      value: "$600/mo",
      label: "Groceries",
      source: "Food eaten at home for a small household. Scale up for more people or higher-cost areas (BLS CE, rounded)."
    },
    {
      value: "$700/mo",
      label: "Transportation",
      source: "Car payment, fuel, insurance, and maintenance, or transit costs. The second-largest category on average (BLS CE, rounded)."
    },
    {
      value: "$450/mo",
      label: "Healthcare",
      source: "Out-of-pocket medical plus premiums not paid by an employer. Rises sharply in early retirement before Medicare — see the healthcare calculator."
    },
    {
      value: "$80/mo",
      label: "Subscriptions",
      source: "Streaming, software, memberships, and apps. Small individually, easy to under-count in total — a placeholder to adjust."
    }
  ]
};

// On-site links to related, deeper content.
export const expensesCrossLinks: { heading: string; intro?: string; links: CrossLink[] } = {
  heading: "Where your expense number leads",
  intro:
    "Annual living expenses are the input to almost every FIRE calculation. These pages show what to do with the figure once you have it.",
  links: [
    {
      href: "/what-is-fire#fire-number",
      label: "What is FIRE — and your FIRE number",
      blurb:
        "Your FIRE number is built directly from annual expenses — often expenses times 25. See how the target is derived and why the spending figure matters most."
    },
    {
      href: "/app/fire-path/withdrawal-rate",
      label: "Portfolio Drawdown FIRE (the 4% rule)",
      blurb:
        "The 4% rule turns annual expenses into the portfolio you need and the income you can safely draw. Bring the total from this page over to size it."
    },
    {
      href: "/app/fire-path/tools/healthcare",
      label: "Retirement healthcare cost calculator",
      blurb:
        "Healthcare is one of the hardest expense lines to estimate in early retirement. Size the ACA gap years and Medicare costs in detail, then fold the result back in here."
    },
    {
      href: "/fire-glossary",
      label: "FIRE glossary: the 4% rule, lean & fat FIRE",
      blurb:
        "Plain-language definitions for the spending-based variants of FIRE — Lean, Fat, and Coast — and the rest of the vocabulary behind these numbers."
    }
  ]
};

// Unique, keyword-led intro paragraphs for the expenses page. Targets
// "living expense calculator", "annual expenses calculator", and "how much do
// I spend a year" without leaning on jargon in the first sentence.
export const expensesIntroParagraphs: string[] = [
  "This calculator estimates your total annual and monthly living expenses by adding up what you spend across the everyday categories — housing, utilities, groceries, transportation, healthcare, insurance, dining and entertainment, travel, subscriptions, and anything else. Enter your numbers as either monthly or annual amounts with a single switch, and it shows both totals at once, so you never have to do the multiply-by-twelve math yourself.",
  "Knowing this figure is the starting point for any financial-independence plan: the common rule of thumb multiplies annual expenses by 25 to estimate the portfolio you'd need to retire, so the spending number drives every other target. Breaking it into categories is far more accurate than guessing one lump sum, because it surfaces the costs that are easy to forget — the once-a-year premium, the subscriptions, the travel.",
  "Each category ships with a rounded national-average placeholder drawn from the Bureau of Labor Statistics Consumer Expenditure Survey, shown right at the field so you can trust the starting point and replace it with your own number. The tool is intentionally standalone and private — it just produces a clean annual and monthly total you can take wherever you plan."
];

// Questions phrased the way users actually search.
export const expensesFaq: FaqItem[] = [
  {
    question: "How do I calculate my annual living expenses?",
    answer:
      "Add up what you spend across every category — housing, utilities, groceries, transportation, healthcare, insurance, dining and entertainment, travel, subscriptions, and anything else — then total it for the year. This calculator does that for you: enter each category as a monthly or annual amount and it shows both your total monthly and total annual living expenses. Working category by category is more accurate than guessing a single number because it forces you to account for irregular costs like annual insurance premiums and travel."
  },
  {
    question: "What expense categories should I include?",
    answer:
      "Cover both the obvious recurring bills and the easy-to-forget ones. The ten categories here are designed to capture a typical household's spending, with a catch-all 'other' for anything that doesn't fit — childcare, education, gifts, pets, or debt payments beyond a mortgage. The goal is for the categories to add up to roughly everything that leaves your account in a normal year."
  },
  {
    question: "Should I enter expenses as monthly or annual?",
    answer:
      "Either — there's a single switch that flips the whole list between monthly and annual, and the calculator keeps both totals in sync. Most people find monthly easier for everyday bills like rent and groceries, while costs like travel or insurance premiums are easier to think of annually. Enter each in whichever way you know it best, and read off whichever total you need: the monthly figure for budgeting, the annual figure for FIRE planning."
  },
  {
    question: "How much does the average household spend per year?",
    answer:
      "US national-average household spending runs in the neighborhood of $75,000 a year according to the Bureau of Labor Statistics Consumer Expenditure Survey, though it varies enormously by region, household size, and lifestyle. The defaults in this calculator are rounded placeholders in that ballpark, meant only as a starting point. Your own number is what matters — replace each category with what you actually spend, ideally checked against a few months of real statements."
  },
  {
    question: "How do my expenses determine my FIRE number?",
    answer:
      "The most common shortcut multiplies your annual living expenses by 25 to estimate the portfolio you'd need to be financially independent — that's the inverse of a 4% safe withdrawal rate. So $50,000 of annual spending implies a rough target of $1.25 million, and $80,000 implies about $2 million. Because the multiplier is large, small changes in your expense estimate move the target substantially, which is exactly why it's worth estimating carefully rather than guessing."
  },
  {
    question: "Does this calculator account for inflation or taxes?",
    answer:
      "No — it's a deliberately simple snapshot of current spending. It doesn't adjust for inflation (so revisit the figure periodically, since the same lifestyle costs more over time) and it captures spending only, not income or taxes. When you build a full plan, layer those on separately. Treat the total here as a clean, considered baseline you can stress-test, not a precise long-term forecast."
  }
];
