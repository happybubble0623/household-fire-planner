// One-off: capture the redesigned Portfolio (Understand Your Portfolio) page —
// the new value-prop header with the relocated/renamed "Update today's prices"
// button on the title row, the "Showing EOD prices for <date>" label, and the
// import/export icons moved next to the "Showing N matching rows" row count.
//
// Seeds a small workbook (a few holdings + an EOD refresh date) straight into the
// app's Dexie/IndexedDB store so the populated state renders, then reloads.
// Run against the local dev server: node scripts/portfolio-header-shots.mjs
import { chromium } from "playwright-core";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "screenshots");
const url = "http://localhost:3000/app/portfolio-lab";

const executablePath =
  process.env.PW_CHROMIUM ||
  `${process.env.HOME}/Library/Caches/ms-playwright/chromium-1169/chrome-mac/Chromium.app/Contents/MacOS/Chromium`;

const seedItems = [
  {
    id: "seed-vti",
    type: "etf",
    name: "Vanguard Total Stock Market ETF",
    symbol: "VTI",
    accountOwner: "Alex",
    accountName: "Brokerage",
    accountType: "Taxable",
    taxBucket: "Taxable",
    includedInFire: true,
    unitPrice: 291.34,
    units: 120,
    balance: 34960.8,
    priceStatus: "refreshed",
    priceDate: "2026-06-10"
  },
  {
    id: "seed-401k",
    type: "mutual_fund",
    name: "Fidelity 500 Index",
    symbol: "FXAIX",
    accountOwner: "Sam",
    accountName: "401(k)",
    accountType: "Tax-Deferred",
    taxBucket: "Tax-Deferred / Pre-tax",
    includedInFire: true,
    unitPrice: 199.12,
    units: 210,
    balance: 41815.2,
    priceStatus: "refreshed",
    priceDate: "2026-06-10"
  },
  {
    id: "seed-cash",
    type: "cash",
    name: "Emergency fund",
    accountOwner: "Joint",
    accountName: "High-yield savings",
    accountType: "Cash",
    taxBucket: "Taxable",
    includedInFire: false,
    balance: 25000
  }
];

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });

// First load: lets the app create the default workbook in Dexie.
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Seed holdings + an EOD refresh timestamp directly into IndexedDB, then reload.
await page.evaluate(async (items) => {
  const dbName = "freedom-path-phase1";
  const open = () =>
    new Promise((resolve, reject) => {
      const req = indexedDB.open(dbName);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  const db = await open();
  await new Promise((resolve, reject) => {
    const tx = db.transaction("workbooks", "readwrite");
    const store = tx.objectStore("workbooks");
    const getReq = store.get("phase1-default");
    getReq.onsuccess = () => {
      const record = getReq.result;
      if (!record) {
        resolve();
        return;
      }
      record.data.portfolioItems = items;
      record.data.lastEodRefreshAt = "2026-06-10T20:00:00.000Z";
      store.put(record);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}, seedItems);

await page.reload({ waitUntil: "networkidle" });
await page.waitForTimeout(900);
await page.evaluate(() => window.scrollTo(0, 0));

// 1) The header (value-prop + "Update today's prices" button + EOD-date label).
const headerCard = page.locator("h1", { hasText: "household portfolio" }).locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
await headerCard.screenshot({ path: join(out, "portfolio-header.png") });
console.log("saved portfolio-header.png");

// 2) The holdings table header (import/export icons left of the row count).
const holdings = page.locator("h2", { hasText: "Detailed holdings" }).locator("xpath=ancestor::section[1]");
await holdings.scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await holdings.screenshot({ path: join(out, "portfolio-holdings-toolbar.png") });
console.log("saved portfolio-holdings-toolbar.png");

// 3) Full page for overall context.
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
await page.screenshot({ path: join(out, "portfolio-page-full.png"), fullPage: true });
console.log("saved portfolio-page-full.png");

await browser.close();
