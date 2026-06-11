// Server-rendered SEO content for the investment growth / compound interest
// calculator.
//
// Framework-free (no "use client") so the route's server component can render
// the intro prose and the Q&A in the initial HTML — crawlers and "People Also
// Ask" see the text without executing JavaScript — and build the FAQPage
// JSON-LD from the SAME source. Mirrors the healthcare-faq.ts template.

export type FaqItem = { question: string; answer: string };

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
      "A common long-run planning assumption is around 7% per year. That's roughly the U.S. stock market's historical real (after-inflation) return; the nominal return — before subtracting inflation — has averaged closer to 10% a year for the S&P 500 since 1926. Using the ~7% real figure keeps your projection in today's-dollar terms. Whatever you pick, it's an assumption, not a guarantee: actual returns vary widely year to year and the average is rarely what any single year delivers. A more conservative number (5–6%) is a reasonable stress test."
  },
  {
    question: "How does compound interest work?",
    answer:
      "Compounding means your returns themselves earn returns. In year one you earn a return on your principal; in year two you earn a return on the principal plus year one's gains, and so on. This calculator compounds monthly and adds your contribution each month, so the balance grows faster the longer it runs. Over decades the compounding effect typically dwarfs the original contributions — which is why time in the market is the biggest lever in a long-term plan."
  },
  {
    question: "Should I account for inflation?",
    answer:
      "Yes, if you want the result in today's purchasing power. Inflation has averaged around 3% a year over the long run (the Federal Reserve targets 2%), which erodes what a future balance can actually buy. A simple way to handle it is to use a real (after-inflation) return — around 7% instead of the ~10% nominal figure — so the projected balance is already expressed in today's dollars rather than inflated future dollars."
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
    question: "Are these investment projections guaranteed?",
    answer:
      "No. These are planning estimates built on a constant assumed return, but real markets don't move in a straight line — they rise and fall, and the order of good and bad years matters, especially once you start withdrawing. The default return and inflation figures are long-run historical averages, not forecasts. Use the projection to understand the shape and sensitivity of compounding, then plan with a margin of safety rather than treating any single number as a promise."
  }
];
