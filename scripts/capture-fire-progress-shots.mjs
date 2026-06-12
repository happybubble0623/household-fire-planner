import { chromium } from "playwright-core";

// Point at whatever port the dev server is on (preview/autoPort may not be 3000).
const BASE = process.env.SHOT_BASE ?? "http://localhost:3000";
const PAGES = [
  { slug: "withdrawal-rate", label: "portfolio-drawdown" },
  { slug: "principal-preserving", label: "principal-preserving" }
];

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--hide-scrollbars"]
});

async function shoot(slug, label, viewport, suffix) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${BASE}/app/fire-path/${slug}`, { waitUntil: "networkidle" });
  await page.waitForSelector("[role=progressbar]", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const file = `screenshots/fire-progress-${label}-${suffix}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
  await context.close();
}

for (const { slug, label } of PAGES) {
  await shoot(slug, label, { width: 1280, height: 900 }, "desktop");
  await shoot(slug, label, { width: 390, height: 844 }, "mobile");
}

await browser.close();
console.log("done");
