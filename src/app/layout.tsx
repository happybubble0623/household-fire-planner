import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
  initialScale: 1
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
      <body>{children}</body>
    </html>
  );
}
