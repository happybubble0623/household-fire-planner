import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: { absolute: "About — Household FIRE Planner" },
  description:
    "Why Household FIRE Planner exists: a private, household-level workspace for FIRE and early-retirement planning that brings your accounts together in one place and explains the concepts as you go.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
          ● The story behind the planner
        </span>
        <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
          About
        </h1>

        <section aria-labelledby="why-this-exists" className="mt-8">
          <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <h2
              id="why-this-exists"
              className="flex items-center gap-3 text-2xl font-bold tracking-[-0.01em] text-gray-900"
            >
              <span
                aria-hidden="true"
                className="h-6 w-1 flex-none rounded-full bg-[var(--primary)]"
              />
              Why this exists
            </h2>
            <div className="mt-5 space-y-4 text-base leading-relaxed text-gray-700">
              <p>
                I got a little obsessed with the numbers behind retiring early — running
                scenarios, tweaking assumptions, asking &ldquo;what if?&rdquo;
              </p>
              <p>
                Two things always tripped me up. Our savings were scattered across a dozen
                accounts — brokerage, 401(k)s, IRAs, my spouse&rsquo;s — so I could never see the
                whole household picture, let alone plan around it. And so much of the
                early-retirement world is buried in jargon that makes it hard to even begin.
              </p>
              <p>
                So I built this — the workspace I wished I had. It brings your accounts together
                in one place and explains the terms and ideas as you go, so you understand what
                you&rsquo;re looking at instead of needing to be an expert first. Run the numbers
                yourself, at your own pace, with a little guidance where it helps — and get a
                clearer, wiser view of your path to financial independence and early retirement.
                Your data stays yours — it lives locally on your device by default, and only
                syncs to the cloud if you choose to create an optional account.
              </p>
              <p>
                If it helps you plan with a little more confidence, that&rsquo;s the whole point.
                Have an idea or spot something off? I&rsquo;d genuinely love to hear it.
              </p>
            </div>
          </article>
        </section>

        <section aria-labelledby="share-feedback" className="mt-10">
          <h2
            id="share-feedback"
            className="text-2xl font-bold tracking-[-0.01em] text-gray-900"
          >
            Share feedback or an idea
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-500">
            Found a bug, have a feature idea, or something in the calculators didn&rsquo;t make
            sense? Leave your name and email address so I can follow up — a phone number is
            optional.
          </p>
          <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
            <ContactForm />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-gray-500">
            Your message is stored securely and used only to respond to your feedback. It is
            never shared or used for marketing.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
