// Server-rendered SEO content for the mortgage payment calculator.
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

// "How it works / what it accounts for" — explains the amortization math and
// the escrowed costs the calculator layers on top, in plain language.
export const mortgageHowItWorks: { heading: string; sections: HowItWorksSection[] } = {
  heading: "How the calculator builds your payment",
  sections: [
    {
      heading: "The principal-and-interest payment",
      paragraphs: [
        "The core monthly payment comes from the standard amortization formula: it takes your loan amount, your interest rate divided by 12 to get a monthly rate, and the number of monthly payments (the term in years times 12), and solves for the fixed amount that pays the loan to zero over the full term. That single number stays the same every month for the life of a fixed-rate loan — what changes is how it splits between interest and principal."
      ]
    },
    {
      heading: "Taxes, insurance, PMI, and HOA",
      paragraphs: [
        "Most lenders collect property taxes and homeowner's insurance along with the loan payment and hold them in an escrow account, paying those bills for you when they come due. The calculator adds your annual property tax and insurance (divided by 12), any monthly HOA dues, and private mortgage insurance (PMI) when your down payment is under 20%. Together these turn a bare principal-and-interest figure into the all-in number that actually leaves your account — often called PITI. You can switch this block off to see principal and interest alone.",
        "PMI is handled the way real loans handle it: it applies only while you owe more than 80% of the original loan amount, then automatically drops off, and it is skipped entirely for VA loans, which carry no monthly mortgage insurance."
      ]
    },
    {
      heading: "How the loan pays down over time",
      paragraphs: [
        "The tool walks the loan month by month and rolls the results up into a year-by-year schedule. Because interest is charged on the balance you still owe, the early years are mostly interest and barely dent the balance, while the later years are mostly principal — the front-loading that amortization produces. The payoff chart and total-interest figure put real numbers on that shift.",
        "The same schedule is how you judge a refinance. Refinancing replaces your loan with a new one — usually for a lower rate or shorter term — but it has upfront closing costs. The break-even point is the month when your accumulated monthly savings finally exceed those costs; refinance only if you'll keep the home past it."
      ]
    }
  ]
};

// Plain-language definitions of the mortgage terms the page uses.
export const mortgageKeyConcepts: { heading: string; intro?: string; items: KeyConcept[] } = {
  heading: "Mortgage terms, in plain language",
  intro: "The words on a mortgage quote, explained without the jargon.",
  items: [
    {
      term: "Principal",
      definition:
        "The amount you actually borrowed and still owe. Every payment chips a little off it — slowly at first, faster as the loan matures."
    },
    {
      term: "Interest",
      definition:
        "The lender's charge for the loan, calculated on the balance you still owe. Because the balance is highest early on, your first years' payments are mostly interest."
    },
    {
      term: "Amortization",
      definition:
        "The schedule that splits each fixed payment between interest and principal so the loan reaches zero exactly at the end of the term. It front-loads interest, so equity builds slowly at first."
    },
    {
      term: "PITI",
      definition:
        "Principal, Interest, Taxes, and Insurance — the four parts of a typical full mortgage payment. Lenders use the total to judge how much house you can afford."
    },
    {
      term: "Escrow",
      definition:
        "An account your lender uses to collect property taxes and insurance with your monthly payment, then pay those bills on your behalf when they're due."
    },
    {
      term: "PMI (private mortgage insurance)",
      definition:
        "A fee on conventional loans when your down payment is under 20%. It protects the lender, costs roughly 0.3%–1.5% of the loan a year, and drops off once you reach 20% equity."
    },
    {
      term: "Loan-to-value (LTV)",
      definition:
        "What you owe as a percentage of the home's value. Under 80% LTV (20%+ equity) you can shed PMI; lower LTV also tends to unlock better rates."
    },
    {
      term: "Note rate vs. APR",
      definition:
        "The note rate is the interest rate used to compute your payment. APR bundles in fees, so it's higher — use the note rate here for the closest payment match."
    },
    {
      term: "Refinancing break-even",
      definition:
        "The month when the savings from a new, lower-rate loan finally cover its closing costs. Refinancing pays off only if you keep the home past that point."
    }
  ]
};

// The prefilled defaults and their sources — mirrors the visible field notes
// in the interactive calculator.
export const mortgageSourcedDefaults: {
  heading: string;
  intro?: string;
  items: SourcedDefault[];
} = {
  heading: "The default numbers, and where they come from",
  intro:
    "The calculator opens with sourced national averages so the first result is realistic. Every one is editable — drop in your own quote for an accurate payment.",
  items: [
    {
      value: "6.5%",
      label: "30-year fixed rate",
      source: "Near the mid-2026 average 30-year fixed rate (Freddie Mac PMMS). Rates change daily — use your quote."
    },
    {
      value: "30 years",
      label: "Loan term",
      source: "The most common term; a 15-year term cuts total interest sharply but raises the monthly payment."
    },
    {
      value: "≈ 0.9%",
      label: "Property tax (of home value)",
      source: "US average effective property-tax rate (ATTOM 2025). Varies widely by county — check the listing."
    },
    {
      value: "~$2,400/yr",
      label: "Home insurance",
      source: "Near the 2025 US average homeowner premium (NerdWallet/Bankrate). Varies a lot by state and risk."
    },
    {
      value: "0.5%/yr",
      label: "PMI rate",
      source: "Mid-range PMI (typically 0.3%–1.5% under 20% down). Drops at 20% equity; set 0 for VA or 20%+ down."
    },
    {
      value: "20%",
      label: "Equity that ends PMI",
      source: "PMI runs until the balance falls below 80% of the original loan, then drops off automatically."
    }
  ]
};

// On-site links to related, deeper content.
export const mortgageCrossLinks: { heading: string; intro?: string; links: CrossLink[] } = {
  heading: "Put the payment in context",
  intro:
    "Housing is usually the biggest line in a retirement budget. These pages connect your mortgage to the bigger plan.",
  links: [
    {
      href: "/what-is-fire#fire-number",
      label: "What is FIRE — and your FIRE number",
      blurb:
        "Your FIRE number is built from annual expenses, and housing is the largest. Paying off the mortgage before retiring can shrink the number you need to save."
    },
    {
      href: "/app/fire-path/tools/investment",
      label: "Investment growth calculator",
      blurb:
        "Pay the mortgage down faster, or invest the difference? Project what the same dollars could earn invested and compare against your loan's interest rate."
    },
    {
      href: "/app/fire-path/principal-preserving",
      label: "Principal-Preserving FIRE",
      blurb:
        "Carrying a low-rate mortgage while your investments compound is a core trade-off in living off income without touching savings."
    },
    {
      href: "/fire-glossary",
      label: "FIRE glossary",
      blurb:
        "Plain-language definitions for the 4% rule, drawdown, expense ratio, and the rest of the retirement vocabulary."
    }
  ]
};

// Unique, keyword-led intro paragraphs for the mortgage page. Targets "mortgage
// payment calculator", "how much house can I afford", and PMI/amortization
// questions without leaning on jargon in the first sentence.
export const mortgageIntroParagraphs: string[] = [
  "A mortgage payment is more than principal and interest. This calculator estimates your full monthly payment — principal, interest, property taxes, homeowner's insurance, PMI, and any HOA dues — so the number you see is closer to what actually leaves your account each month than a bare principal-and-interest figure. Enter your loan amount, rate, and term to start, then add the tax and insurance details when you're ready.",
  "It also shows how the loan pays down over time. Early payments are mostly interest and barely dent the balance; later ones are mostly principal. The payoff chart and year-by-year schedule make that shift visible, which is what you need to compare a 15-year against a 30-year term, weigh extra payments, or decide whether paying the mortgage off before retiring is worth it.",
  "Every prefilled default is a sourced national figure shown right at the field — the current average 30-year rate, a typical PMI rate, the national-average property-tax and insurance levels — so you can trust the starting point and then drop in your own quote. These are planning estimates, not a loan offer; your lender's numbers are the ones that count."
];

// Questions phrased the way users actually search.
export const mortgageFaq: FaqItem[] = [
  {
    question: "How much house can I afford?",
    answer:
      "A common rule of thumb is to keep your total monthly housing payment — principal, interest, taxes, and insurance — at or under about 28% of your gross monthly income, and all your debt payments under about 36%. Work backwards: estimate the full monthly payment here for a price you're considering, then check it against those percentages. Because this calculator includes taxes, insurance, PMI, and HOA, it gives you the real all-in payment to test affordability against, not just principal and interest."
  },
  {
    question: "What's included in a monthly mortgage payment?",
    answer:
      "Four things, often called PITI: Principal (paying down the balance), Interest (the cost of borrowing), Taxes (property taxes, usually collected into an escrow account), and Insurance (homeowner's insurance, also usually escrowed). If your down payment is under 20% you'll also pay PMI, and a condo or planned community may add monthly HOA dues. This calculator lets you include or exclude the taxes-and-fees block so you can see principal-and-interest alone or the full payment."
  },
  {
    question: "What is PMI and when does it stop?",
    answer:
      "Private mortgage insurance (PMI) is a fee lenders charge on conventional loans when your down payment is under 20%. It protects the lender, not you, and typically runs about 0.3%–1.5% of the loan per year. On a conventional loan you can request cancellation once you reach 20% equity (an 80% loan-to-value ratio), and the lender must automatically remove it at 22% equity (78% LTV). VA loans carry no PMI at all; FHA loans use a different mortgage-insurance premium that can last the life of the loan."
  },
  {
    question: "Should I choose a 15-year or 30-year mortgage?",
    answer:
      "A 30-year loan has lower monthly payments but you pay far more total interest. A 15-year loan has higher monthly payments but a lower rate and dramatically less interest over the life of the loan. The right choice depends on cash-flow comfort versus total cost: run both terms here and compare the monthly payment against the total interest to see the trade-off in your own numbers."
  },
  {
    question: "How much will I pay in interest over the life of the loan?",
    answer:
      "Often more than you'd expect — on a 30-year loan at today's rates, total interest can approach or exceed the amount you borrowed. Because amortization front-loads interest, the early years build very little equity. The total-interest result and the payoff schedule here show exactly how much interest you pay and how the balance falls year by year, which is also how you can see the savings from a shorter term or extra principal payments."
  },
  {
    question: "How does the interest rate affect my payment?",
    answer:
      "A lot. Even a small rate change moves the monthly payment and the total interest meaningfully, because the rate applies to the whole balance for the whole term. Use the note rate from your quote (not the APR, which bundles in fees) for the closest principal-and-interest match. Mortgage rates change daily, so re-run the calculator with a fresh quote when you're close to locking."
  },
  {
    question: "Are these mortgage figures exact?",
    answer:
      "No. These are planning estimates. The defaults are sourced national averages — the average 30-year rate, typical PMI, and national-average property-tax and insurance levels — but your actual rate, taxes, and insurance depend on your credit, location, and lender. Property taxes vary widely by county and home insurance varies even more by state and risk. Replace the defaults with your own quotes for an accurate payment, and treat the result as an estimate, not a loan offer."
  }
];
