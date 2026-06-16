import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AppModeProvider } from "@/components/app-mode-provider";
import { AppLockProvider } from "@/components/app-lock/app-lock-provider";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { APP_MODE_COOKIE, isAppModeUserAgent } from "@/lib/app-mode";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// GA4 measurement ID (e.g. G-XXXXXXXXXX). Must be set as NEXT_PUBLIC_GA_ID in
// the environment (e.g. Vercel) for Google Analytics to load. Left unset, GA4
// stays dormant — never hardcode a real measurement ID here.
const gaId = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Plan My FIRE",
    template: "%s | Plan My FIRE"
  },
  description:
    "Free FIRE calculators for your whole household — portfolio drawdown, principal-preserving and income-stream strategies, plus mortgage, healthcare, Social Security, and investment planning tools.",
  keywords: [
    "FIRE calculator",
    "financial independence",
    "early retirement",
    "retirement planning",
    "withdrawal rate",
    "healthcare cost calculator",
    "mortgage calculator",
    "Social Security calculator"
  ],
  robots: {
    index: true,
    follow: true
  },
  openGraph: {
    type: "website",
    siteName: "Plan My FIRE",
    title: "Plan My FIRE",
    description:
      "Plan your household's path to financial independence and early retirement with free, transparent calculators.",
    url: siteUrl
  },
  twitter: {
    card: "summary_large_image",
    title: "Plan My FIRE",
    description:
      "Free FIRE calculators for your whole household — plan your path to financial independence and early retirement."
  },
  icons: {
    icon: "/favicon.svg"
  },
  manifest: "/manifest.webmanifest"
};

// Sitewide Organization + WebSite structured data. Emitted once in the root
// layout so every page carries it. The URL is derived from metadataBase /
// NEXT_PUBLIC_SITE_URL — never a hardcoded domain.
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Plan My FIRE",
  url: siteUrl,
  description:
    "Free, private FIRE calculators for your whole household — portfolio drawdown, principal-preserving and income-stream strategies, plus mortgage, healthcare, Social Security, and investment planning tools.",
  logo: `${siteUrl}/favicon.svg`
};

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Plan My FIRE",
  url: siteUrl
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#15803d",
  // Extend the webview under the iOS status bar / home indicator so the native
  // shell can paint edge-to-edge. The safe-area insets this exposes are 0 in
  // normal browsers, so desktop/mobile web are unchanged; only the iOS app and
  // notched Safari see non-zero values (consumed via env(safe-area-inset-*)).
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Gate the mobile redesign SERVER-SIDE so SSR matches the WebView from the
  // first paint (no flash of website chrome inside the app, no flash of app
  // chrome on the website). Two independent signals, either one is enough:
  //   1. The native shell's appended User-Agent token — present on EVERY in-app
  //      request including a bare full-page reload, so a bottom-tab navigation
  //      that resolves to a full document load still renders app mode instead of
  //      the website header. This is the durable signal; it needs neither the
  //      query flag (a layout can't read it) nor the `pmf_app` cookie (WKWebView
  //      doesn't reliably attach it to navigation requests).
  //   2. The persisted `pmf_app` cookie — covers normal browsers that opted into
  //      app mode via the query flag on an earlier load.
  // `data-app-mode="1"` on <html> lets CSS and the AppModeProvider branch
  // consistently. A normal website visitor has neither signal → website mode.
  const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
  const isAppMode =
    isAppModeUserAgent(headerStore.get("user-agent")) ||
    cookieStore.get(APP_MODE_COOKIE)?.value === "1";

  return (
    <html lang="en" className={inter.variable} data-app-mode={isAppMode ? "1" : undefined}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
      </head>
      <body>
        <AppModeProvider initialIsAppMode={isAppMode}>
          {/* App-only Face ID lock. On the website (not app mode) it renders
              children verbatim — no wrapper, no overlay, no native calls. */}
          <AppLockProvider>{children}</AppLockProvider>
        </AppModeProvider>
        {/* Registers the offline service worker (browser-only, guarded). */}
        <ServiceWorkerRegister />
        <Analytics />
        {/* GA4 loads only when NEXT_PUBLIC_GA_ID is set in the environment
            (e.g. Vercel). Stays dormant otherwise so builds/deploys are safe
            before the ID exists. Runs alongside the Vercel <Analytics /> above. */}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
