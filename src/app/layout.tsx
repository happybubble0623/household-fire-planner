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
  icons: {
    icon: "/favicon.svg"
  }
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
      <body>{children}</body>
    </html>
  );
}
