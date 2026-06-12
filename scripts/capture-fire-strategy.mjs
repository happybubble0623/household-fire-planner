import { chromium } from "playwright-core";

const BASE = "http://localhost:3000";
const PATHS = {
  "withdrawal-rate": "Portfolio Drawdown",
  "principal-preserving": "Principal-Preserving",
  "income-stream": "Income Stream"
};

const browser = await chromium.launch({
  channel: "chrome",
  args: ["--hide-scrollbars"]
});

async function shoot(slug, label, viewport, suffix) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.goto(`${BASE}/app/fire-path/${slug}`, { waitUntil: "networkidle" });
  // Fresh context => empty IndexedDB => the new defaults render. Wait for them.
  await page.waitForSelector("#fire-current-assets", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const file = `screenshots/fire-strategy-${slug}-${suffix}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log("saved", file);
  await context.close();
}

await shoot("withdrawal-rate", PATHS["withdrawal-rate"], { width: 1280, height: 900 }, "desktop");
await shoot("withdrawal-rate", PATHS["withdrawal-rate"], { width: 390, height: 844 }, "mobile");
await shoot("principal-preserving", PATHS["principal-preserving"], { width: 1280, height: 900 }, "desktop");
await shoot("income-stream", PATHS["income-stream"], { width: 1280, height: 900 }, "desktop");

await browser.close();
console.log("done");
