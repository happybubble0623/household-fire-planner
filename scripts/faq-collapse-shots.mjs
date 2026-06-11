// One-off: capture the collapsed server-rendered FAQ accordion on a calculator
// page (healthcare). Shows the native <details>/<summary> Q&A collapsed by
// default with chevrons, plus one item expanded to show the accordion behavior.
// Run against the local dev server: node scripts/faq-collapse-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const url = "http://localhost:3000/app/fire-path/tools/healthcare";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });

await page.goto(url, { waitUntil: "networkidle" });

// Locate the "Questions & answers" section heading and the accordion that
// follows it.
const heading = page.locator("#healthcare-qa-heading");
await heading.scrollIntoViewIfNeeded();
const section = page.locator("section[aria-labelledby='healthcare-guide-heading']");

// 1) Fully collapsed (default state — no <details> has the open attribute).
await page.waitForTimeout(300);
await section.screenshot({ path: join(out, "faq-collapsed-healthcare.png") });
console.log("saved faq-collapsed-healthcare.png");

// 2) First question expanded to show the accordion opens (still server text).
await page.evaluate(() => {
  const qa = document.querySelector("#healthcare-qa-heading")?.parentElement;
  const first = qa?.querySelector("details");
  if (first) first.open = true;
});
await page.waitForTimeout(300);
await section.screenshot({ path: join(out, "faq-expanded-healthcare.png") });
console.log("saved faq-expanded-healthcare.png");

await browser.close();
