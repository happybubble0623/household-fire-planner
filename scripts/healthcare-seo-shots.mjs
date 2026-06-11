// One-off: capture screenshots of the healthcare calculator SEO pass
// (visible default-basis notes at the inputs + the server-rendered Q&A section).
// Run against the local dev server: node scripts/healthcare-seo-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const URL = "http://localhost:3000/app/fire-path/tools/healthcare";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;
const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 2100 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: "networkidle" });

// 1) Input basis notes — open only the Medicare section so its sourced premium
//    notes sit near the top alongside the demographic notes; capture from top.
await page.evaluate(() => {
  document.querySelectorAll("details").forEach((d) => {
    d.open = /Medicare years/.test(d.querySelector("summary")?.textContent || "");
  });
  window.scrollTo(0, 0);
});
await page.waitForTimeout(300);
await page.screenshot({ path: join(out, "healthcare-input-basis-notes.png") });

// 2) Server-rendered intro + "Questions & answers" section.
const guide = page.locator('section[aria-labelledby="healthcare-guide-heading"]');
await guide.scrollIntoViewIfNeeded();
await guide.screenshot({ path: join(out, "healthcare-qa-faq.png") });

await browser.close();
console.log("saved healthcare-input-basis-notes.png and healthcare-qa-faq.png");
