// One-off: capture screenshots of the Social Security, mortgage, and investment
// calculator SEO pass — the visible default-basis notes at the inputs plus the
// server-rendered "Questions & answers" section — mirroring the healthcare shot.
// Run against the local dev server: node scripts/calculator-seo-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const base = "http://localhost:3000/app/fire-path/tools";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const tools = [
  { slug: "social-security", file: "social-security-seo-pass.png" },
  { slug: "mortgage", file: "mortgage-seo-pass.png" },
  { slug: "investment", file: "investment-seo-pass.png" }
];

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 2200 }, deviceScaleFactor: 2 });

for (const tool of tools) {
  await page.goto(`${base}/${tool.slug}`, { waitUntil: "networkidle" });
  // Make sure any collapsible input sections are open so the basis notes show.
  await page.evaluate(() => {
    document.querySelectorAll("details").forEach((d) => {
      d.open = true;
    });
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(out, tool.file), fullPage: true });
  console.log(`saved ${tool.file}`);
}

await browser.close();
