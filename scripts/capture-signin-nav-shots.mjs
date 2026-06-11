// Capture screenshots showing the sign-in affordance in the nav on the home
// hub (desktop + mobile) and on another AppShell page for consistency.
// Usage: node scripts/capture-signin-nav-shots.mjs [baseUrl]
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch({ channel: "chrome" });

async function shoot(path, viewport, file, { openMobileMenu = false } = {}) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  await page.goto(baseUrl + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  if (openMobileMenu) {
    const toggle = page.locator('button[aria-controls="mobile-navigation"]');
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForTimeout(300);
    }
  }
  await page.screenshot({ path: `screenshots/${file}` });
  console.log(`saved screenshots/${file}`);
  await context.close();
}

const desktop = { width: 1280, height: 800 };
const mobile = { width: 390, height: 844 };

await shoot("/app/fire-path", desktop, "signin-nav-home-hub-desktop.png");
await shoot("/app/fire-path", mobile, "signin-nav-home-hub-mobile.png");
await shoot("/about", desktop, "signin-nav-about-desktop.png");
await shoot("/about", mobile, "signin-nav-about-mobile-menu-open.png", {
  openMobileMenu: true
});

await browser.close();
