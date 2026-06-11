"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabaseClient } from "@/lib/storage/supabase-sync";

type SubmitState = "idle" | "submitting" | "success" | "error";

const FALLBACK_EMAIL = "zhchong0623@gmail.com";

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  return /^[+()\d\s.-]{7,20}$/.test(value.trim());
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-base font-medium text-gray-900 shadow-sm transition placeholder:text-gray-400 focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const hasName = name.trim().length > 0;
    const hasEmail = email.trim().length > 0;
    const hasPhone = phone.trim().length > 0;

    if (!message.trim()) {
      setError("Please write a short message.");
      return;
    }

    if (hasEmail && !isValidEmail(email)) {
      setError("That email address doesn't look right — please double-check it.");
      return;
    }

    if (hasPhone && !isValidPhone(phone)) {
      setError("That phone number doesn't look right — please double-check it.");
      return;
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      setError(
        `The feedback service isn't configured right now. Please email me directly at ${FALLBACK_EMAIL}.`
      );
      return;
    }

    setState("submitting");

    const { error: insertError } = await supabase.from("feedback_messages").insert({
      name: hasName ? name.trim() : null,
      email: hasEmail ? email.trim() : null,
      phone: hasPhone ? phone.trim() : null,
      message: message.trim()
    });

    if (insertError) {
      setState("error");
      setError(
        `Something went wrong sending your message. Please try again, or email me directly at ${FALLBACK_EMAIL}.`
      );
      return;
    }

    setState("success");
  }

  if (state === "success") {
    return (
      <div
        role="status"
        className="rounded-2xl border border-[var(--green-100)] bg-[var(--green-50)] p-8 text-center shadow-sm"
      >
        <p className="text-xl font-bold tracking-tight text-[var(--primary-hover)]">Thank you!</p>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Your message has been sent. I read every piece of feedback and will reach out if you left
          a way to contact you.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-4">
      <div>
        <label htmlFor="contact-name" className="text-sm font-medium text-gray-800">
          Your name <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Jane Doe"
          className={inputClassName}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-email" className="text-sm font-medium text-gray-800">
            Email address <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className={inputClassName}
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="text-sm font-medium text-gray-800">
            Phone number <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+1 (555) 123-4567"
            className={inputClassName}
          />
        </div>
      </div>
      <p className="text-xs leading-relaxed text-gray-500">
        Leave your email or phone number if you would like me to follow up.
      </p>
      <div>
        <label htmlFor="contact-message" className="text-sm font-medium text-gray-800">
          Your feedback or suggestion{" "}
          <span aria-hidden="true" className="text-[var(--danger)]">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="What's working well? What's confusing? What would you like the planner to do?"
          className={`${inputClassName} min-h-32 resize-y leading-relaxed`}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={state === "submitting"} className="w-full sm:w-auto">
        {state === "submitting" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
