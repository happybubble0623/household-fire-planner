// Server-rendered FAQ content for the three FIRE strategy pages
// (/app/fire-path/income-stream, /principal-preserving, /withdrawal-rate).
//
// Framework-free (no "use client") so each strategy route's server component can
// render the Q&A in the initial HTML — crawlers and "People Also Ask" see the
// text without executing JavaScript — and build the FAQPage JSON-LD from the
// SAME source, keeping the visible Q&A and the structured data in lockstep. This
// mirrors the pattern the calculator pages already use (social-security-faq.ts,
// healthcare-faq.ts).

import type { FaqItem } from "@/lib/data/healthcare-faq";

export type { FaqItem };

// Income Stream FIRE — living on steady, reliable income (Social Security,
// pension, rent) without selling investments.
export const incomeStreamFaq: FaqItem[] = [
  {
    question: "What is Income Stream FIRE in plain terms?",
    answer:
      "It means covering your living costs with steady, reliable income — like a pension, rental income, or Social Security — instead of selling off your savings. If your regular income is enough to pay the bills, you can retire without ever drawing down a portfolio, which is the most cautious of the three FIRE strategies."
  },
  {
    question: "Who is this strategy best for?",
    answer:
      "People who already have, or expect, dependable income streams that keep paying month after month — such as a workplace pension, rent from a property you own, an annuity, or a solid Social Security benefit. If those streams alone cover your spending, this path lets you avoid the ups and downs of selling investments in a falling market."
  },
  {
    question: "What counts as a reliable income stream?",
    answer:
      "Income that arrives regularly and is likely to continue: Social Security, a pension, annuity payments, and rent from property are the common ones. The more of it that adjusts with inflation (Social Security does; most fixed pensions do not), the better it holds up over a long retirement. This calculator lets you enter each stream and see whether the total covers your expenses from the age you choose."
  },
  {
    question: "How is this different from the 4% rule or Portfolio Drawdown?",
    answer:
      "Portfolio Drawdown funds retirement by gradually selling your investments and following a safe withdrawal rate (the 4% rule is the well-known starting point). Income Stream FIRE instead leans on income you already receive, so your savings can stay invested and untouched. It usually needs strong income sources, but it removes the worry of running your portfolio down."
  },
  {
    question: "What if my income does not quite cover everything?",
    answer:
      "Many households blend strategies: reliable income covers the essentials, and a modest drawdown from savings covers the rest. You can model that here by comparing this view with the Principal-Preserving and Portfolio Drawdown calculators to see which mix lets you retire earliest with confidence."
  }
];

// Principal-Preserving FIRE — living off the income your investments produce
// (interest, dividends, yield) without spending the savings themselves.
export const principalPreservingFaq: FaqItem[] = [
  {
    question: "What does Principal-Preserving FIRE mean?",
    answer:
      "It means living off only the income your investments produce — things like interest, dividends, and cash yield — while leaving the original savings (the \"principal\") untouched. Because you never spend down the savings themselves, in theory they can last indefinitely and pass on to family or causes you care about."
  },
  {
    question: "How is 'principal' different from the income it earns?",
    answer:
      "Principal is the pile of money you have saved. The income is what that pile earns each year — interest from bonds or savings, dividends from stocks, or rent from property. This strategy spends the earnings and keeps the pile whole, rather than selling pieces of the pile to fund retirement."
  },
  {
    question: "Who is this strategy best for?",
    answer:
      "People who have saved a large amount and value safety and leaving a legacy over retiring at the earliest possible age. Because you live on earnings alone, you generally need more saved than with a drawdown approach — but you get the peace of mind of never watching your nest egg shrink."
  },
  {
    question: "Does keeping the principal mean I retire later?",
    answer:
      "Often, yes. Living on earnings alone usually requires a bigger savings target than spending down your portfolio would, so the earliest possible retirement age tends to be a little later than with Portfolio Drawdown. The trade-off is durability: your money is far less likely to run out. You can compare the exact ages across all three strategies here."
  },
  {
    question: "What return or yield should I assume?",
    answer:
      "Use a realistic, conservative figure for what your investments pay out each year, and remember that inflation slowly raises your spending over time. This calculator lets you set your own yield and expenses so you can see the earliest age your earnings cover your costs without touching principal — then stress-test it with lower numbers."
  }
];

// Portfolio Drawdown FIRE — the classic 4%-rule approach: build savings, then
// spend them down gradually over retirement.
export const withdrawalRateFaq: FaqItem[] = [
  {
    question: "What is Portfolio Drawdown FIRE?",
    answer:
      "It is the most common path to early retirement: build up a pot of investments, then gradually spend it down to cover your living costs. How much you can safely take out each year is your withdrawal rate — and the well-known starting point is the 4% rule, which suggests withdrawing about 4% in your first year, then adjusting for inflation."
  },
  {
    question: "How does the 4% rule work here?",
    answer:
      "The 4% rule is a rule of thumb: take out about 4% of your investments in year one, then raise that dollar amount with inflation each year, and your money should last roughly 30 years. Flipped around, it gives you a savings target of about 25 times your yearly spending. This calculator lets you set your own withdrawal rate so you can test more cautious or more aggressive numbers."
  },
  {
    question: "Is the 4% rule guaranteed to work?",
    answer:
      "No — it is a guideline based on past market history, not a promise. Bad luck early in retirement (a market drop in your first years) is the main risk. Many retirees stay flexible: they trim spending in down years or use a slightly lower rate for extra safety. Treat the result as a confidence estimate, not a certainty, and revisit it over time."
  },
  {
    question: "Does this include my home?",
    answer:
      "No. This strategy focuses on your liquid investments — the money you can actually sell and spend, like funds in a brokerage account, 401(k), or IRA. Your primary home is excluded because you still need somewhere to live, so it cannot fund day-to-day spending. The calculator finds the earliest age those investments can support withdrawals through your life expectancy."
  },
  {
    question: "How is this different from the other two strategies?",
    answer:
      "Income Stream FIRE lives on steady income without selling investments, and Principal-Preserving FIRE lives only on the earnings while keeping savings whole. Portfolio Drawdown is the most flexible and usually allows the earliest retirement, because you are willing to spend the savings themselves down over time. You can compare the earliest age each approach gives you across the three calculators."
  }
];
