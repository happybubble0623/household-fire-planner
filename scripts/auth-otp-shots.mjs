// Capture the two-step OTP login screen (email step + code step).
// The Supabase auth OTP endpoint is mocked so no real email is sent.
// Usage: node scripts/auth-otp-shots.mjs [baseUrl]
import { chromium } from "playwright-core";

const baseUrl = process.argv[2] ?? "http://localhost:3000";

const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 1000, height: 900 }
});
const page = await context.newPage();

// Intercept the passwordless OTP send so clicking "Email Me a Code" advances to
// the code step without a live network call / real email delivery.
await page.route("**/auth/v1/otp**", (route) =>
  route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ data: {}, error: null })
  })
);

await page.goto(baseUrl + "/login", { waitUntil: "networkidle" });
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/auth-otp-1-email-step.png" });
console.log("saved screenshots/auth-otp-1-email-step.png");

await page.getByLabel("Email").fill("saver@example.com");
await page.getByRole("button", { name: /email me a code/i }).click();
await page.getByLabel(/6-digit code/i).waitFor();
await page.waitForTimeout(300);
await page.screenshot({ path: "screenshots/auth-otp-2-code-step.png" });
console.log("saved screenshots/auth-otp-2-code-step.png");

await context.close();
await browser.close();
