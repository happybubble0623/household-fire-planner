// Server-rendered SEO content for the investment growth / compound interest
// calculator.
//
// Framework-free (no "use client") so the route's server component can render
// the intro prose and the Q&A in the initial HTML — crawlers and "People Also
// Ask" see the text without executing JavaScript — and build the FAQPage
// JSON-LD from the SAME source. Mirrors the healthcare-faq.ts template.

import type {
  CrossLink,
  HowItWorksSection,
  KeyConcept,
  SourcedDefault
} from "@/lib/data/tool-guide";

export type FaqItem = { question: string; answer: string };

// "How it works / what it accounts for" — explains the monthly-compounding
// engine and, just as important, what the simple model leaves out.
export const investmentHowItWorks: { heading: string; sections: HowItWorksSection[] } = {
  heading: "How the projection works and what it accounts for",
  sections: [
    {
      heading: "Monthly compounding, step by step",
      paragraphs: [
        "Each month the calculator does two things: it grows the existing balance by one-twelfth of your annual return, then adds your monthly contribution. Next month it grows that larger balance again — so the returns themselves start earning returns. That loop, run across your time horizon, is compounding, and it's why the line on the chart curves upward instead of rising in a straight line.",
        "Because growth is applied before the rest of your money has even been added, the early years look unremarkable and the late years look dramatic. The single biggest lever is time: the same contribution started ten years earlier ends up worth far more than ten years' worth of extra deposits later."
      ]
    },
    {
      heading: "Contributions versus growth",
      paragraphs: [
        "The result splits your ending balance into two parts: total contributions (your starting balance plus every monthly deposit) and investment growth (everything the market added on top). Watching that split shift is the point of the tool — over a long enough horizon, growth usually becomes the larger share, meaning the market is doing more of the work than you are. The percentage shown tells you how much growth piled on top of what you put in."
      ]
    },
    {
      heading: "Real (after-inflation) returns and today's dollars",
      paragraphs: [
        "The default 7% return is a real return — it already has inflation subtracted out. Before subtracting inflation, US stocks have returned closer to 10% a year over the long run, but those are inflated future dollars that buy less. Using the real figure keeps the projected balance in today's dollars, so the number means what it sounds like: roughly what that balance could buy now. If you'd rather project the larger, inflation-inflated total, enter a higher return and read the result as future dollars — the actual amount you'd have once prices have risen, which buys less than the same figure today.",
        "Two things the simple model intentionally does not capture: real markets don't deliver the average every year — they rise and fall, and a bad stretch early in retirement hurts more than the average suggests (sequence-of-returns risk) — and it ignores fund fees and taxes. A fund's expense ratio quietly subtracts from your return every year, so a low-cost index fund leaves more compounding for you. Subtract your funds' expense ratio from the return you enter to keep the projection honest."
      ]
    }
  ]
};

// Plain-language definitions of the investing terms the page uses.
export const investmentKeyConcepts: { heading: string; intro?: string; items: KeyConcept[] } = {
  heading: "Investing terms, in plain language",
  intro: "The handful of concepts that decide how a long-term projection turns out.",
  items: [
    {
      term: "Compounding",
      definition:
        "Earning returns on your past returns, not just your original money. It's the reason a balance grows faster the longer it's left invested — and the engine behind every FIRE plan."
    },
    {
      term: "Contributions",
      definition:
        "The money you put in yourself — your starting balance plus every deposit. The calculator keeps this separate from growth so you can see how much each contributes."
    },
    {
      term: "Investment growth",
      definition:
        "Everything the market adds on top of your contributions through returns and compounding. In long horizons it often ends up larger than everything you contributed."
    },
    {
      term: "Real (after-inflation) return",
      definition:
        "Your return with inflation stripped out — roughly 7% a year for US stocks historically, versus about 10% before inflation. Using it keeps results in today's buying power."
    },
    {
      term: "Future dollars",
      definition:
        "A balance stated in the inflated dollars of a future year — the actual amount you'd have once prices have risen. It looks bigger than the same figure in today's dollars but buys less."
    },
    {
      term: "Expense ratio",
      definition:
        "The annual fee a fund charges, as a percent of what you've invested. Even 1% a year quietly compounds against you; low-cost index funds often charge under 0.1%."
    },
    {
      term: "Time horizon",
      definition:
        "How long the money stays invested. Because compounding rewards time, it's usually the most powerful input — more than the return or the monthly amount."
    },
    {
      term: "Sequence-of-returns risk",
      definition:
        "The danger that a run of poor returns lands early in retirement, when you're withdrawing — which damages a portfolio far more than the same bad years later, even at the same average."
    }
  ]
};

// The prefilled defaults and their sources — mirrors the visible field notes
// in the interactive calculator.
export const investmentSourcedDefaults: {
  heading: string;
  intro?: string;
  items: SourcedDefault[];
} = {
  heading: "The assumptions behind the projection, and their basis",
  intro:
    "The return and inflation defaults are long-run historical averages, not forecasts. They're shown here so you can trust the starting point and stress-test a range.",
  items: [
    {
      value: "7%/yr",
      label: "Default annual return (real)",
      source: "Roughly the S&P 500's long-run real (after-inflation) return. An assumption, not a guarantee — try 5–6% too."
    },
    {
      value: "~10%/yr",
      label: "Before-inflation stock return",
      source: "S&P 500 long-run average total return since 1926, before subtracting inflation."
    },
    {
      value: "~3%/yr",
      label: "Long-run inflation",
      source: "Long-run US average; the Federal Reserve targets 2%. The gap between this and the ~10% figure is the ~7% real return."
    },
    {
      value: "Monthly",
      label: "Compounding frequency",
      source: "Compounding matches your contribution frequency: choose monthly and growth is applied 12 times a year; choose annual and it's applied once. Most people contribute monthly, so that's the default."
    },
    {
      value: "End of period",
      label: "Contribution timing",
      source: "Whether each deposit lands at the start or end of the period. End of period (ordinary annuity) is the conservative default; beginning of period (annuity-due) earns one extra period of growth and ends slightly higher."
    },
    {
      value: "Subtract fees",
      label: "Expense ratio",
      source: "Lower the return you enter by your funds' expense ratio; index funds often charge under 0.1% a year."
    }
  ]
};

// On-site links to related, deeper content.
export const investmentCrossLinks: { heading: string; intro?: string; links: CrossLink[] } = {
  heading: "Where compounding leads",
  intro:
    "Compounding is the engine of financial independence. These pages show what to do with the balance it builds.",
  links: [
    {
      href: "/what-is-fire#fire-number",
      label: "What is FIRE — and your FIRE number",
      blurb:
        "Your FIRE number is the balance that lets investment growth cover your living costs. See how compounding gets you there and how big the target needs to be."
    },
    {
      href: "/app/fire-path/withdrawal-rate",
      label: "Portfolio Drawdown FIRE (the 4% rule)",
      blurb:
        "Once the portfolio is built, the 4% rule estimates how much you can safely spend from it each year. This is the most common FIRE path."
    },
    {
      href: "/fire-glossary#expense-ratio",
      label: "FIRE glossary: expense ratio, drawdown & more",
      blurb:
        "Plain-language definitions for expense ratio, the 4% rule, Coast FIRE, and the rest of the vocabulary behind these projections."
    },
    {
      href: "/app/fire-path/tools/social-security",
      label: "Social Security benefit calculator",
      blurb:
        "Guaranteed lifetime income lowers how much your portfolio has to cover. Estimate your benefit at 62, full retirement age, and 70."
    }
  ]
};

// Unique, keyword-led intro paragraphs for the investment page. Targets
// "investment growth calculator", "compound interest calculator", and "how much
// will my investments grow" without leaning on jargon in the first sentence.
export const investmentIntroParagraphs: string[] = [
  "This calculator projects how an investment portfolio could grow from four inputs: what you start with, what you add each month, the return you assume, and how long you stay invested. It compounds monthly, so you can watch the gap between what you contribute and what the market adds widen over time — the core engine behind every FIRE plan and the reason starting early matters so much.",
  "The power is in compounding: returns earn returns, so growth accelerates the longer money stays invested. In a long projection the investment growth often ends up larger than everything you contributed. Adjust the time horizon and contribution to see how a few extra years or a bigger monthly amount changes the ending balance — that sensitivity is usually more striking than people expect.",
  "The return and inflation defaults are framed as long-run historical assumptions, not promises — they're shown right at the field with their basis and year so you can trust the starting point and stress-test a range. Markets don't deliver the average every year, and a single bad stretch early in retirement matters more than the average suggests, so treat these as planning estimates rather than a forecast."
];

// Questions phrased the way users actually search.
export const investmentFaq: FaqItem[] = [
  {
    question: "How much will my investments grow?",
    answer:
      "It depends on three levers: how much you invest, the return you earn, and how long you stay invested — with time being the most powerful because of compounding. Enter your starting balance, monthly contribution, an assumed annual return, and a time horizon above to project an ending balance, and the calculator separates what you contributed from what growth added. Small changes to the return or the number of years can change the result dramatically, so try a few scenarios rather than trusting a single number."
  },
  {
    question: "What return should I assume?",
    answer:
      "A common long-run planning assumption is around 7% per year. That's roughly the U.S. stock market's historical real (after-inflation) return; before subtracting inflation, the return has averaged closer to 10% a year for the S&P 500 since 1926. Using the ~7% real figure keeps your projection in today's-dollar terms. Whatever you pick, it's an assumption, not a guarantee: actual returns vary widely year to year and the average is rarely what any single year delivers. A more conservative number (5–6%) is a reasonable stress test."
  },
  {
    question: "How does compound interest work?",
    answer:
      "Compounding means your returns themselves earn returns. In year one you earn a return on your principal; in year two you earn a return on the principal plus year one's gains, and so on. This calculator compounds monthly and adds your contribution each month, so the balance grows faster the longer it runs. Over decades the compounding effect typically dwarfs the original contributions — which is why time in the market is the biggest lever in a long-term plan."
  },
  {
    question: "Should I account for inflation?",
    answer:
      "Yes, if you want the result in today's purchasing power. Inflation has averaged around 3% a year over the long run (the Federal Reserve targets 2%), which erodes what a future balance can actually buy. A simple way to handle it is to use a real (after-inflation) return — around 7% instead of the ~10% before-inflation figure — so the projected balance is already expressed in today's dollars rather than inflated future dollars."
  },
  {
    question: "How much should I invest each month to reach my goal?",
    answer:
      "Work backwards: set the time horizon and return, then adjust the monthly contribution until the projected ending balance hits your target. Because compounding rewards time, raising your contribution early in the horizon does more than the same increase later. The calculator updates the split between contributions and growth as you change the inputs, so you can see how much of your goal the market is doing versus how much you have to fund yourself."
  },
  {
    question: "What is the difference between contributions and growth?",
    answer:
      "Contributions are the money you put in — your starting balance plus every monthly deposit. Growth is everything the market adds on top through returns and compounding. The calculator reports both separately and shows growth as a percentage on top of what you put in, so you can see how much of the ending balance came from saving versus from investing. In long horizons, growth usually becomes the larger share."
  },
  {
    question: "Should I contribute monthly or annually, and at the start or end of the period?",
    answer:
      "Use whichever matches how you actually invest. Choose monthly if you add money every paycheck or month, or annual if you make one lump deposit a year — the calculator compounds at the same frequency you pick (monthly contributions compound monthly, annual contributions compound once a year), so you don't set compounding separately. Timing is a smaller lever: beginning of period (an annuity-due) invests each contribution at the start so it earns that period's growth too, while end of period (an ordinary annuity) adds it afterward. Beginning of period always ends a little higher for the same numbers; end of period is the more conservative default."
  },
  {
    question: "Are these investment projections guaranteed?",
    answer:
      "No. These are planning estimates built on a constant assumed return, but real markets don't move in a straight line — they rise and fall, and the order of good and bad years matters, especially once you start withdrawing. The default return and inflation figures are long-run historical averages, not forecasts. Use the projection to understand the shape and sensitivity of compounding, then plan with a margin of safety rather than treating any single number as a promise."
  }
];
