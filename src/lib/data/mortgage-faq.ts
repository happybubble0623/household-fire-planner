// Server-rendered SEO content for the mortgage payment calculator.
//
// Framework-free (no "use client") so the route's server component can render
// the intro prose and the Q&A in the initial HTML — crawlers and "People Also
// Ask" see the text without executing JavaScript — and build the FAQPage
// JSON-LD from the SAME source. Mirrors the healthcare-faq.ts template.

export type FaqItem = { question: string; answer: string };

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
