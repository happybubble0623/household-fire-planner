import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
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
  }
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
  // Extend the webview under the iOS status bar / home indicator so the native
  // shell can paint edge-to-edge. The safe-area insets this exposes are 0 in
  // normal browsers, so desktop/mobile web are unchanged; only the iOS app and
  // notched Safari see non-zero values (consumed via env(safe-area-inset-*)).
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
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
        {children}
        <Analytics />
        {/* GA4 loads only when NEXT_PUBLIC_GA_ID is set in the environment
            (e.g. Vercel). Stays dormant otherwise so builds/deploys are safe
            before the ID exists. Runs alongside the Vercel <Analytics /> above. */}
        {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      </body>
    </html>
  );
}
