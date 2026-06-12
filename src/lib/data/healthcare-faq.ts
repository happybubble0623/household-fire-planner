// Server-rendered SEO content for the retirement healthcare cost calculator.
//
// This module is intentionally framework-free (no "use client") so the route's
// server component can render the intro prose and the Q&A in the initial HTML —
// crawlers and "People Also Ask" see the text without executing JavaScript —
// and build the FAQPage JSON-LD from the SAME source, keeping the visible Q&A
// and the structured data in lockstep.
//
// The calculator panel itself is a client component; keeping this copy here (not
// in the panel) is the template pattern the other calculators will follow.

export type FaqItem = { question: string; answer: string };

// Unique, keyword-appropriate intro paragraphs for the healthcare page. Targets
// "early retirement health insurance", "health insurance before 65 / Medicare",
// and "Medicare costs at 65" without leaning on jargon in the first sentence.
export const healthcareIntroParagraphs: string[] = [
  "Health insurance is one of the biggest unknowns of retiring before 65. Once employer coverage ends you have to bridge the years until Medicare on your own — usually with an Affordable Care Act (ACA) marketplace plan — and then keep paying for Medicare and its gaps for the rest of your life. This calculator estimates both stages so you can see what healthcare really adds to an early-retirement plan.",
  "For the pre-65 gap years it models your ACA premium after the premium tax credit (subsidy), the 2026 return of the 400%-of-poverty subsidy cliff, your expected out-of-pocket spend, and how an HSA can help. For the Medicare years it models the 2026 standard Part B premium, income-related IRMAA surcharges, and either Medigap plus Part D or a Medicare Advantage plan — with an option for travel and abroad coverage on top.",
  "Every prefilled number is a sourced 2026 (or latest published) national figure shown right at the field, so you can trust the starting point and then replace it with your own quotes from HealthCare.gov and Medicare.gov. These are planning estimates, not official quotes."
];

// Questions phrased the way users actually search, so the page is eligible for
// rich results and "People Also Ask". Answers carry the substance that used to
// live in the panel's "How this estimate works" block, plus added coverage.
export const healthcareFaq: FaqItem[] = [
  {
    question: "How much does health insurance cost before Medicare?",
    answer:
      "Before 65 most early retirees buy an ACA marketplace plan. The sticker premium depends on your age, where you live, and the metal tier (bronze, silver, or gold), and it rises steeply with age — a 60-year-old's premium can be roughly three times a 21-year-old's. What you actually pay is that premium minus your ACA subsidy (premium tax credit), plus out-of-pocket costs up to the plan's maximum. This calculator estimates a typical premium from your age and area, or you can enter exact quotes from HealthCare.gov."
  },
  {
    question: "What is the ACA subsidy and who qualifies?",
    answer:
      "The ACA premium tax credit caps what you pay for the benchmark (second-lowest-cost silver) plan at a set percentage of your income. That percentage comes from the 2026 applicable-percentage table — about 2.10% of income under 150% of the Federal Poverty Level (FPL), rising to 9.96% at 300–400% FPL (Rev. Proc. 2025-25). The credit is the benchmark premium minus that required contribution, and it applies to whichever plan you pick. Because the credit is based on your retirement income (MAGI), managing income with Roth conversions and capital-gain timing directly changes your subsidy."
  },
  {
    question: "What is the 400% FPL subsidy cliff in 2026?",
    answer:
      "The enhanced ARPA/IRA subsidies expired December 31, 2025, so for 2026 the original ACA structure returns with the subsidy cliff reinstated: if your MAGI is at or above 400% of the Federal Poverty Level you get no premium tax credit at all and pay the full unsubsidized premium. A single dollar over the line can cost thousands, so keeping MAGI just under 400% FPL is one of the highest-value moves in an early-retirement plan."
  },
  {
    question: "What does Medicare actually cost at 65?",
    answer:
      "Medicare is not free. In 2026 everyone pays the standard Part B premium of $202.90/month per person (plus a $283 annual Part B deductible). On top of Part B you typically add either Original Medicare with a Medigap supplement (national-average Plan G is about $155/month) and a Part D drug plan (the 2026 base premium is $38.99/month), or a Medicare Advantage plan (2026 average about $11/month but with higher, capped out-of-pocket costs). The calculator adds your expected out-of-pocket spend on top of premiums."
  },
  {
    question: "What is IRMAA and how is it calculated?",
    answer:
      "IRMAA — the Income-Related Monthly Adjustment Amount — is a surcharge higher-income beneficiaries pay on top of the standard Part B and Part D premiums. It is set by your MAGI from two years prior and rises in brackets: in 2026 it starts above $109,000 (single) / $218,000 (married filing jointly). For steady-state planning this tool applies your entered retirement MAGI directly and shows the implied tier, so you can see when an extra Roth conversion would tip you into a higher surcharge."
  },
  {
    question: "Can an HSA pay my Medicare premiums?",
    answer:
      "An HSA can pay qualified medical costs — deductibles, copays, and coinsurance — tax-free at any age. At 65 and older it can also pay Medicare Part B, Part D, and Medicare Advantage premiums tax-free. It can never be used for Medigap (supplement) premiums, and ACA marketplace premiums generally are not HSA-eligible either. The calculator only draws the HSA against eligible expenses under the drawdown strategy you choose."
  },
  {
    question: "Does US health coverage work if I travel or retire abroad?",
    answer:
      "Mostly no. US ACA marketplace plans are US-only, and Original Medicare covers almost nothing outside the country. Medigap plans C, D, F, G, M, and N add a limited foreign-travel emergency benefit (80% after a $250 deductible, $50,000 lifetime cap). If you are outside the US 330+ days a year the ACA coverage requirement does not apply. The tool's travel mode lets you add a global/expat premium on top of US coverage, or replace US coverage with it — while still paying Part B at 65+ to avoid late-enrollment penalties."
  },
  {
    question: "Why does the calculator show a present value instead of one big lifetime total?",
    answer:
      "The headline is the present value in today's dollars — the lump sum you'd need set aside today, earning a conservative real return (about 3% above inflation), to cover every future year of healthcare. That is the number published benchmarks like Fidelity's roughly $345,000-per-couple estimate are quoted in, so it's the fair comparison. Simply adding up decades of inflating premiums produces a much larger figure (often well over a million dollars in future, inflated dollars) that overstates the real burden because those future dollars are worth less and your savings grow in the meantime. The calculator also shows an average cost per year, and the future-dollars toggle if you want to see the raw inflated total — clearly labeled as not comparable to published estimates."
  },
  {
    question: "What if my income is low — do I still pay this much?",
    answer:
      "No. If your modified adjusted gross income is below about 138% of the Federal Poverty Level before 65, you would generally qualify for Medicaid (near-free coverage) in states that expanded it, and the calculator models your pre-65 cost near zero. At 65 and older, income below roughly 135% FPL generally qualifies you for a Medicare Savings Program (which pays your Part B premium) plus Part D Extra Help, driving Medicare premiums and cost-sharing close to zero as well. When your income is below these thresholds the tool shows a gold callout and a much lower cost. These are estimates only — eligibility and benefits vary by state, and some states did not expand Medicaid, so confirm on Medicaid.gov and Medicare.gov."
  },
  {
    question: "How much should I budget for healthcare in early retirement?",
    answer:
      "It varies widely with income, location, and health, but the structure is predictable: a subsidized ACA plan in the gap years (often a few hundred dollars a month after the credit, or the full unsubsidized premium if you are over the subsidy cliff), then Part B plus a supplement or Advantage plan plus out-of-pocket once Medicare starts. Run your own numbers above with your real income and area. The headline present value (today's dollars) is the lump sum to set aside now, and the per-year figure shows the recurring bite — switch to future dollars only if you want the raw inflated total."
  },
  {
    question: "Are these healthcare cost figures official?",
    answer:
      "No. These are planning estimates built from public 2026 figures (CMS, HHS, KFF, and IRS revenue procedures). Marketplace (SLCSP), Medigap, and Medicare Advantage prices vary by area and age and must be confirmed on HealthCare.gov and Medicare.gov. The Federal Poverty Levels used are for the 48 contiguous states — Alaska and Hawaii have higher guidelines this tool does not model."
  }
];
