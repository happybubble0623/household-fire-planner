"use client";

import Link from "next/link";
import type { Phase1PanelProps } from "@/components/planning/phase1-workspace";
import { Card } from "@/components/ui/card";
import { PLANNING_TOOLS } from "@/lib/data/planning-tools";

const strategyCards = [
  {
    href: "/app/fire-path/income-stream",
    eyebrow: "Most cautious",
    title: "Income Stream FIRE",
    description:
      "“I want to live on guaranteed income alone and never rely on my investments.” Best if you have strong Social Security, pension, or rental income."
  },
  {
    href: "/app/fire-path/principal-preserving",
    eyebrow: "Keep your nest egg",
    title: "Principal-Preserving FIRE",
    description:
      "“I’ll live off income and investment earnings, but never touch my nest egg.” Best if keeping your principal — for safety or legacy — matters most."
  },
  {
    href: "/app/fire-path/withdrawal-rate",
    eyebrow: "Most flexible",
    title: "Portfolio Drawdown FIRE",
    description:
      "“I’m fine spending down my savings, as long as they last my lifetime.” Best if you want the earliest possible retirement age."
  }
];

const toolCards = PLANNING_TOOLS;

export function PathToFirePanel({ status }: Phase1PanelProps) {
  return (
    <div className="space-y-8">
      <Card className="p-7 sm:p-9">
        <div className="max-w-4xl">
          <p className="text-sm font-semibold text-gray-500">Private, transparent FIRE planning</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-gray-900 md:text-5xl">
            A guided workspace for household FIRE planning
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-gray-500 md:text-lg">
            Start with manual assumptions, then improve the plan as you add household accounts,
            future income, inflation, taxes, and real portfolio assets.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              No brokerage login required
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              Built for household accounts
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              Local workbook: {status}
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Which FIRE fits you?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Pick based on how you want to use your money in retirement — from most cautious (live on
            income) to most flexible (spend it down). Not sure? Start with Portfolio Drawdown.
          </p>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {strategyCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:p-7"
            >
              <p className="text-sm font-medium text-gray-500">{card.eyebrow}</p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">
                {card.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{card.description}</p>
              <span className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] transition group-hover:bg-[var(--primary-hover)]">
                Open strategy
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
            Useful planning tools
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
            Use these calculators to refine assumptions before bringing the numbers back into
            your FIRE strategy.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {toolCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              target="_blank"
              rel="noreferrer"
              className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            >
              <h3 className="text-base font-semibold text-gray-900">{card.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">{card.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <p className="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-sm leading-relaxed text-gray-500 shadow-sm">
        Planning estimates only. Not financial, tax, or legal advice.
      </p>
    </div>
  );
}
