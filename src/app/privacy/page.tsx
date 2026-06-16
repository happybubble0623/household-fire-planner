import type { Metadata } from "next";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: { absolute: "Privacy Policy | Plan My FIRE" },
  description:
    "How Plan My FIRE handles your data: local-first by default, an optional account for cloud sync, the third parties we use, and how to delete your data.",
  alternates: { canonical: "/privacy" }
};

// Section shell — matches the About page card styling so the policy reads as a
// first-class content page (rounded-2xl surface card, gray prose) rather than a
// bare legal dump.
function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="mt-8">
      <h2
        id={id}
        className="flex items-center gap-3 text-2xl font-bold tracking-[-0.01em] text-gray-900"
      >
        <span aria-hidden="true" className="h-6 w-1 flex-none rounded-full bg-[var(--primary)]" />
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--gold-border)] bg-[var(--gold-bg)] px-3 py-1 text-xs font-semibold text-[var(--gold-text)]">
            ● Your data, explained plainly
          </span>
          <h1 className="mt-4 text-4xl font-bold leading-tight tracking-[-0.02em] text-gray-900">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm font-medium text-gray-500">Effective date: June 16, 2026</p>
        </div>

        <article className="mt-8 max-w-3xl">
          <Section id="who-we-are" title="Who we are">
            <p>
              Plan My FIRE (planmyfi.com) is a household-level planning workspace for FIRE
              (Financial Independence, Retire Early) and early-retirement planning. It lets you
              bring your accounts and assumptions into one place, run scenarios, and learn the
              concepts as you go. It is also available as an iOS app.
            </p>
            <p>
              This policy explains what data the app and website handle, where it lives, and who we
              share it with. The short version: your planning data stays on your device by default,
              and only leaves it if you choose to create an account or use features that need an
              outside service.
            </p>
          </Section>

          <Section id="local-first" title="Local-first by default">
            <p>
              The figures you enter — your accounts, holdings, balances, assumptions, and the plans
              you build — are stored locally in your browser or app, using your device&rsquo;s
              built-in storage (IndexedDB). Nothing in your plan is sent to us or anyone else just
              by using the planner.
            </p>
            <p>
              A few small preferences (such as whether you&rsquo;ve turned on monthly reminders or
              Face ID app lock) are also kept locally on your device.
            </p>
          </Section>

          <Section id="what-we-collect" title="What we collect">
            <p>We keep what we collect to a minimum. Depending on how you use Plan My FIRE:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>The financial figures you enter</strong> — held on your device by default,
                and synced to your account only if you choose to create one (see below).
              </li>
              <li>
                <strong>Your email address</strong> — only if you create an optional account, used
                to sign you in and to sync your plans across your devices.
              </li>
              <li>
                <strong>Feedback messages</strong> — if you use the feedback form, the message you
                send and any name, email, or phone number you choose to include with it.
              </li>
              <li>
                <strong>Basic, privacy-respecting analytics</strong> — aggregate usage such as page
                views and performance, used to understand what&rsquo;s working. This is not tied to
                your identity.
              </li>
            </ul>
            <p>
              We do not collect brokerage, bank, or government login credentials, and we never ask
              you to connect those accounts.
            </p>
          </Section>

          <Section id="accounts-and-storage" title="Accounts &amp; how your data is stored">
            <p>
              Creating an account is optional. Without one, your plans live only on the device you
              entered them on.
            </p>
            <p>
              If you create an account, you sign in with a one-time code sent to your email — there
              is no password. When you&rsquo;re signed in, the plans you choose to save are synced
              to your private account in the cloud so you can reach them from another device. Only
              you can access your own plans.
            </p>
          </Section>

          <Section id="third-parties" title="Third parties we use">
            <p>
              We rely on a small set of trusted service providers to run the app. We don&rsquo;t
              share your data with anyone beyond what these services need to do their job:
            </p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong>Supabase</strong> — account sign-in (one-time email codes), cloud storage
                for the plans you sync, and storage of feedback messages.
              </li>
              <li>
                <strong>EODHD</strong> — market-data provider. When you look up or track an
                investment, the ticker symbol is sent to EODHD to fetch its price and history.
              </li>
              <li>
                <strong>Vercel</strong> — hosts the website and app, and provides basic, aggregate
                web analytics.
              </li>
              <li>
                <strong>Google Analytics</strong> — aggregate usage analytics (only active on the
                website where enabled).
              </li>
              <li>
                <strong>Resend</strong> — delivers the email notification that lets us read and
                reply to your feedback.
              </li>
              <li>
                <strong>Apple</strong> — distributes the iOS app and provides on-device features
                such as Face ID. Apple&rsquo;s handling of the App Store is governed by its own
                privacy policy.
              </li>
            </ul>
          </Section>

          <Section id="market-data" title="Market-data requests">
            <p>
              When you search for an investment or refresh prices, the ticker symbols you&rsquo;re
              looking up are sent through our server to EODHD to retrieve current and historical
              prices. We don&rsquo;t send EODHD your name, email, or account details — only the
              symbols needed to fetch the data.
            </p>
          </Section>

          <Section id="analytics-cookies" title="Analytics &amp; cookies">
            <p>
              We use lightweight, aggregate analytics (Vercel Web Analytics and, on the website,
              Google Analytics) to understand which pages and features are used and to spot
              problems. This data is reported in aggregate and is not used to build a profile of
              you. We don&rsquo;t use advertising cookies or third-party ad trackers.
            </p>
          </Section>

          <Section id="email" title="Email">
            <p>
              We send email in two situations: a one-time sign-in code when you log in to your
              account, and an internal notification when you submit feedback so we can read and
              respond to it. If you include your email with feedback, we may use it to reply to you.
              We don&rsquo;t send marketing email.
            </p>
          </Section>

          <Section id="face-id" title="Face ID &amp; biometrics">
            <p>
              The optional Face ID (or Touch ID) app lock is handled entirely by your iOS device.
              Your biometric data never leaves your device and is never collected by, or sent to,
              us. We only store a single on/off preference for whether you&rsquo;ve enabled the
              lock.
            </p>
          </Section>

          <Section id="notifications" title="Notifications">
            <p>
              If you turn on reminders in the iOS app, they are scheduled locally on your device
              only. No notification data is sent to us or any server.
            </p>
          </Section>

          <Section id="no-sale-no-ads" title="We don&rsquo;t sell your data or show ads">
            <p>
              We do not sell, rent, or trade your personal information, and we show no advertising.
              Your data is used only to provide the planning features you asked for.
            </p>
          </Section>

          <Section id="retention-deletion" title="Data retention &amp; how to delete your data">
            <p>
              Data stored locally stays on your device until you remove it — you can clear it at any
              time by clearing the app or browser&rsquo;s data for Plan My FIRE.
            </p>
            <p>
              If you created an account, you can delete the plans you&rsquo;ve synced, and you can
              ask us to delete your account and any associated data by contacting us (see below).
              Once deleted, synced plans are removed from our cloud storage.
            </p>
          </Section>

          <Section id="children" title="Children">
            <p>
              Plan My FIRE is intended for adults managing their own finances. It is not directed at
              children under 13, and we do not knowingly collect personal information from children
              under 13.
            </p>
          </Section>

          <Section id="changes" title="Changes to this policy">
            <p>
              We may update this policy from time to time. When we do, we&rsquo;ll revise the
              effective date at the top of this page. Significant changes will be reflected here.
            </p>
          </Section>

          <Section id="contact" title="Contact">
            <p>
              Questions about this policy or your data? Use the{" "}
              <Link href="/about" className="font-semibold text-[var(--primary)] hover:underline">
                feedback form on the About page
              </Link>
              , or email us at{" "}
              <a
                href="mailto:zhchong0623@gmail.com"
                className="font-semibold text-[var(--primary)] hover:underline"
              >
                zhchong0623@gmail.com
              </a>
              .
            </p>
          </Section>
        </article>
      </div>
    </AppShell>
  );
}
