import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Public, crawlable routes. App pages are client-rendered workspaces but still
// carry server-side titles/descriptions, so they're listed for discovery.
const routes: Array<{ path: string; priority: number }> = [
  { path: "/app/fire-path", priority: 1 },
  { path: "/early-retirement-guide", priority: 0.8 },
  { path: "/what-is-fire", priority: 0.7 },
  { path: "/fire-glossary", priority: 0.6 },
  { path: "/app/fire-path/withdrawal-rate", priority: 0.8 },
  { path: "/app/fire-path/principal-preserving", priority: 0.8 },
  { path: "/app/fire-path/income-stream", priority: 0.8 },
  { path: "/app/fire-path/tools/mortgage", priority: 0.7 },
  { path: "/app/fire-path/tools/healthcare", priority: 0.8 },
  { path: "/app/fire-path/tools/investment", priority: 0.7 },
  { path: "/app/fire-path/tools/social-security", priority: 0.7 },
  { path: "/app/portfolio-lab", priority: 0.9 },
  { path: "/about", priority: 0.5 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: "monthly",
    priority: route.priority
  }));
}
