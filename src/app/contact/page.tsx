import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Contact | Household FIRE Planner",
  description:
    "Send feedback or suggestions about the Household FIRE Planner. Leave your name and email address, and I'll get back to you.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="border-b border-[var(--border)] bg-white/85 px-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between py-4">
          <Link href="/app/fire-path" className="inline-flex min-h-11 items-center gap-2.5">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 flex-none place-items-center rounded-[9px] bg-[var(--primary)]"
            >
              <svg viewBox="0 0 64 64" className="h-5 w-5" role="img" aria-label="Household FIRE Planner logo">
                <path
                  d="M16 40 L32 18 L48 40"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[15px] font-bold tracking-tight text-gray-900">
              Household <span className="text-[var(--primary)]">FIRE</span> Planner
            </span>
          </Link>
          <Link
            href="/app/fire-path"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            &larr; Back to the planner
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
          Contact me
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-500">
          Found a bug, have a feature idea, or something in the calculators didn&rsquo;t make
          sense? I&rsquo;d love to hear it. Leave your name and email address so I can follow up —
          a phone number is optional.
        </p>
        <section
          aria-label="Contact form"
          className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm sm:p-8"
        >
          <ContactForm />
        </section>
        <p className="mt-6 text-sm leading-relaxed text-gray-500">
          Your message is stored securely and used only to respond to your feedback. It is never
          shared or used for marketing.
        </p>
      </main>
    </div>
  );
}
