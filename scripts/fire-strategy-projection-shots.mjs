// One-off: capture the refined FIRE strategy projection table — compact
// currency cells ($k / $M), renamed headers (Age, Starting/Ending assets,
// Investment return, Income), no calendar-year column, and the relocated
// "Refine your estimate with these calculators" section now at the bottom of
// the page (after the year-by-year projection).
//
// Captures the Portfolio Drawdown strategy at mobile (~390px) and desktop
// (1280px). The default workbook already produces a populated projection, so no
// IndexedDB seeding is needed. Run against the local dev server:
//   node scripts/fire-strategy-projection-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const url = "http://localhost:3000/app/fire-path/withdrawal-rate";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const browser = await chromium.launch({ executablePath });

async function capture(label, viewport) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  // Projection table card (renamed headers + compact $k/$M cells, Age column).
  const projection = page
    .locator("h2", { hasText: "Year-by-year projection" })
    .first()
    .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
  await projection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await projection.screenshot({ path: join(out, `fire-projection-${label}.png`) });
  console.log(`saved fire-projection-${label}.png`);

  // Relocated "Refine your estimate" section, now below the projection table.
  const refine = page
    .locator("h2", { hasText: "Refine your estimate with these calculators" })
    .first()
    .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
  await refine.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await refine.screenshot({ path: join(out, `fire-refine-section-${label}.png`) });
  console.log(`saved fire-refine-section-${label}.png`);

  await page.close();
}

await capture("mobile-390", { width: 390, height: 844 });
await capture("desktop-1280", { width: 1280, height: 900 });

await browser.close();
