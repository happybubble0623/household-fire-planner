import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/contact-form";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "Contact | Household FIRE Planner",
  description:
    "Send feedback or suggestions about the Household FIRE Planner. Leave your name and email address, and I'll get back to you.",
  alternates: { canonical: "/contact" }
};

export default function ContactPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-10">
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
      </div>
    </AppShell>
  );
}
