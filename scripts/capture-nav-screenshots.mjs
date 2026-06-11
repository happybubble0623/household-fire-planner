// Capture header/nav screenshots for design verification.
// Usage: node scripts/capture-nav-screenshots.mjs <before|after> [baseUrl]
import { chromium } from "playwright-core";

const label = process.argv[2] ?? "after";
const baseUrl = process.argv[3] ?? "http://localhost:3000";

const pages = [
  { slug: "healthcare-calculator", path: "/app/fire-path/tools/healthcare" },
  { slug: "portfolio", path: "/app/portfolio-lab" },
  { slug: "contact", path: "/contact" }
];

const viewports = [
  { slug: "desktop", width: 1280, height: 800 },
  { slug: "mobile-390", width: 390, height: 844 }
];

const browser = await chromium.launch({ channel: "chrome" });

for (const viewport of viewports) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height }
  });
  const page = await context.newPage();

  for (const target of pages) {
    await page.goto(baseUrl + target.path, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const file = `screenshots/nav-${label}-${target.slug}-${viewport.slug}.png`;
    await page.screenshot({ path: file });
    console.log(`saved ${file}`);

    // On mobile, also capture the nav panel expanded (when the toggle exists).
    if (viewport.slug.startsWith("mobile")) {
      const toggle = page.locator('button[aria-controls="mobile-navigation"]');
      if (await toggle.count()) {
        await toggle.click();
        await page.waitForTimeout(300);
        const openFile = `screenshots/nav-${label}-${target.slug}-${viewport.slug}-menu-open.png`;
        await page.screenshot({ path: openFile });
        console.log(`saved ${openFile}`);
      }
    }
  }

  await context.close();
}

await browser.close();
