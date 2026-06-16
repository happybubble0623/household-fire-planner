import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: { absolute: "About — Plan My FIRE" },
  description:
    "Why Plan My FIRE exists: a private, household-level workspace for FIRE and early-retirement planning that brings your accounts together in one place and explains the concepts as you go.",
  alternates: { canonical: "/about" }
};

export default function AboutPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
            ● The story behind the planner
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            About
          </h1>
        </div>

        <div className="relative mt-8 grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <section aria-labelledby="why-this-exists">
            <div className="flex items-end justify-between gap-4 lg:h-24">
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
              <Image
                src="/about-photo.png"
                alt="Photo of the maker's dog by the lake"
                width={256}
                height={256}
                priority
                className="h-24 w-24 flex-none rounded-full object-cover shadow-sm ring-1 ring-[var(--border)] lg:absolute lg:left-1/2 lg:-top-28 lg:h-44 lg:w-44 lg:-translate-x-1/2"
              />
            </div>
            <article className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <div className="space-y-4 text-lg leading-relaxed text-gray-700">
                <p>
                  I got a little obsessed with the numbers behind retiring early — running
                  scenarios, tweaking assumptions, asking &ldquo;what if?&rdquo;
                </p>
                <p>
                  Two things always tripped me up. The first: our savings were scattered across a
                  dozen accounts — brokerage, 401(k)s, IRAs, my spouse&rsquo;s. Pulling them into
                  one view was hard enough, but even once I could see it all, nothing told me when
                  our household could actually retire early, how we&rsquo;d cover health insurance
                  before Medicare, or whether the money would last. And so much of the
                  early-retirement world is buried in jargon that makes it hard to even begin.
                </p>
                <p>
                  So I built this — the workspace I wished I had. It brings your accounts
                  together in one place and explains the terms and ideas as you go, so you
                  understand what you&rsquo;re looking at instead of needing to be an expert
                  first. Run the numbers yourself, at your own pace, with a little guidance where
                  it helps — and get a clearer, wiser view of your path to financial independence
                  and early retirement. Your data stays yours — it lives locally on your device
                  by default, and only syncs to the cloud if you choose to create an optional
                  account.
                </p>
                <p>
                  If it helps you plan with a little more confidence, that&rsquo;s the whole
                  point. Have an idea or spot something off? I&rsquo;d genuinely love to hear it.
                </p>
              </div>
            </article>
          </section>

          <section aria-labelledby="share-feedback">
            <div className="lg:flex lg:h-24 lg:items-end lg:justify-end">
              <h2
                id="share-feedback"
                className="text-2xl font-bold tracking-[-0.01em] text-gray-900 lg:text-right"
              >
                Share feedback or an idea
              </h2>
            </div>
            <p className="mt-3 text-base leading-relaxed text-gray-500">
              Found a bug, have a feature idea, or something in the calculators didn&rsquo;t make
              sense? Your feedback is very appreciated
            </p>
            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8">
              <ContactForm />
            </div>
            <p className="mt-6 text-sm leading-relaxed text-gray-500">
              Your message is stored securely and used only to respond to your feedback. It is
              never shared or used for marketing. See our{" "}
              <Link href="/privacy" className="font-medium text-gray-600 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
