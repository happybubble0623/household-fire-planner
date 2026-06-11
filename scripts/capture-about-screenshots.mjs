// Capture About page screenshots for design verification.
// Usage: node scripts/capture-about-screenshots.mjs [baseUrl]
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] ?? "http://localhost:3000";

const viewports = [
  { slug: "desktop-1280", width: 1280, height: 800 },
  { slug: "mobile-390", width: 390, height: 844 }
];

const browser = await chromium.launch({ channel: "chrome" });

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  const file = `screenshots/about-${viewport.slug}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log(`saved ${file}`);
  await context.close();
}

await browser.close();
