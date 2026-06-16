import type { Metadata } from "next";
import Link from "next/link";
import { PLANNING_TOOLS } from "@/lib/data/planning-tools";

export const metadata: Metadata = {
  title: "Calculators",
  description:
    "All six FIRE planning calculators in one place — healthcare, Social Security, mortgage, investment, living expenses, and tax.",
  alternates: { canonical: "/app/calculators" }
};

// Single mobile list of ALL six calculators. Reuses the canonical PLANNING_TOOLS
// metadata for the four hub tools, and appends the two standalone calculators
// (living expense + tax) that live outside PLANNING_TOOLS but under the same
// /app/fire-path/tools routes. Healthcare leads — the pre-65 gap is the wedge.
const find = (slug: string) => PLANNING_TOOLS.find((tool) => tool.slug === slug)!;

const CALCULATORS: Array<{ href: string; title: string; description: string }> = [
  find("healthcare"),
  find("social-security"),
  {
    href: "/app/fire-path/tools/tax",
    title: "Tax calculator",
    description: "Estimate federal income tax on your retirement withdrawals and income."
  },
  {
    href: "/app/fire-path/tools/expenses",
    title: "Living expense calculator",
    description: "Build a realistic annual spending number to anchor your FIRE target."
  },
  find("investment"),
  find("mortgage")
];

export default function CalculatorsPage() {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900">Calculators</h1>
      <p className="mt-2 text-sm text-gray-600">
        Six focused tools to pressure-test your plan. Lead with healthcare — the pre-Medicare gap
        is the part most early-retirement plans miss.
      </p>

      <ul className="mt-6 space-y-3">
        {CALCULATORS.map((tool) => (
          <li key={tool.href}>
            <Link
              href={tool.href}
              className="block rounded-xl border border-[var(--border)] bg-white p-4 transition-colors duration-150 hover:bg-[var(--soft)]"
            >
              <span className="block text-sm font-semibold text-gray-900">{tool.title}</span>
              <span className="mt-1 block text-[13px] leading-relaxed text-gray-600">
                {tool.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
