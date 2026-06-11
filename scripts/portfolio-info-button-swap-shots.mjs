// One-off: capture the Portfolio header card after swapping the order of the
// "Update today's prices" button and its InfoPopover icon — the info icon now
// sits to the LEFT of the button.
// Run against the local dev server: node scripts/portfolio-info-button-swap-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const url = "http://localhost:3000/app/portfolio-lab";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });

await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));

const headerCard = page
  .locator("h1", { hasText: "household portfolio" })
  .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
await headerCard.screenshot({ path: join(out, "portfolio-info-before-update-button.png") });
console.log("saved portfolio-info-before-update-button.png");

await browser.close();
