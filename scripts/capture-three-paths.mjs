// One-off capture of the redesigned "Three paths to reach early retirement"
// section (cards + Help-me-choose picker) on the real home hub. Run with the
// dev server on :3000.  node scripts/capture-three-paths.mjs
import { chromium } from "playwright-core";
import { existsSync } from "node:fs";
import { homedir } from "node:os";

// playwright-core@1.60 wants chromium-1223, but only chromium-1169 is installed
// in this environment — point straight at that binary.
const candidates = [
  `${homedir()}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`,
  `${homedir()}/Library/Caches/ms-playwright/chromium_headless_shell-1169/chrome-mac/headless_shell`
];
const exec = candidates.find((p) => existsSync(p));
if (!exec) throw new Error("No installed Chromium found");

const URL = "http://localhost:3000/app/fire-path";
const OUT = "screenshots";

async function shotOf(page, selector, file, pad = 16) {
  const box = await page.locator(selector).boundingBox();
  await page.screenshot({
    path: `${OUT}/${file}`,
    clip: {
      x: Math.max(0, box.x - pad),
      y: Math.max(0, box.y - pad),
      width: box.width + pad * 2,
      height: box.height + pad * 2
    }
  });
  console.log("saved", file);
}

const browser = await chromium.launch({ executablePath: exec });

// ---- Desktop ----
const desktop = await browser.newContext({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
const dp = await desktop.newPage();
await dp.goto(URL, { waitUntil: "networkidle" });
await dp.locator(".paths-grid").scrollIntoViewIfNeeded();
await dp.waitForTimeout(300);
// Cards: capture the whole section (head + grid).
await shotOf(dp, "section#strategies", "three-paths-cards-desktop.png");
// Picker open (Q1).
await dp.locator(".paths-helpbtn").click();
await dp.waitForTimeout(250);
await shotOf(dp, "section#strategies", "three-paths-picker-q1.png");
// Picker result (Q1 No -> Q2 Yes -> Principal-Preserving). Use a representative result.
await dp.getByRole("button", { name: /No \/ not really/ }).click();
await dp.getByRole("button", { name: /Yes, keep it intact/ }).click();
await dp.waitForTimeout(250);
await shotOf(dp, ".paths-picker", "three-paths-picker-result.png");
await desktop.close();

// ---- Mobile ----
const mobile = await browser.newContext({ viewport: { width: 390, height: 850 }, deviceScaleFactor: 2 });
const mp = await mobile.newPage();
await mp.goto(URL, { waitUntil: "networkidle" });
await mp.locator(".paths-grid").scrollIntoViewIfNeeded();
await mp.waitForTimeout(300);
await shotOf(mp, "section#strategies", "three-paths-cards-mobile.png");
await mp.locator(".paths-helpbtn").click();
await mp.waitForTimeout(250);
await shotOf(mp, ".paths-picker", "three-paths-picker-q1-mobile.png");
await mobile.close();

await browser.close();
console.log("done");
