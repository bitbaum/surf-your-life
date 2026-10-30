#!/usr/bin/env node
/**
 * A client's way in, in a real browser, against the production server and a
 * PostgreSQL built from the committed migrations: the portal sends a stranger
 * to sign-in, the sign-in page offers only the providers that are configured,
 * an account is made through the register form, the signed-in portal shows,
 * sign-out ends the session, a wrong password is refused and the right one
 * signs back in.
 *
 * Run by .github/workflows/browser-smoke.yml. Synthetic people only; no mail
 * leaves the machine (no mail transport is configured, so sendEmail logs).
 *
 *   BASE_URL=http://localhost:3000 node scripts/browser-smoke.mjs
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const LOCALE = "de"; // routing.defaultLocale in i18n/routing.ts
const OUT = "browser-smoke-artifacts";
const run = Date.now().toString(36);
const EMAIL = `smoke-${run}@example.test`;
const PASSWORD = `synthetic smoke password ${run}`;
const TIMEOUT = 30_000;

const url = (route) => `${BASE}/${LOCALE}${route}`;
const pathIs = (route) => (u) => u.pathname === `/${LOCALE}${route}`;
const shot = (page, name) =>
  page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });

function step(name) {
  console.log(`[smoke] ${name}`);
}

function assert(ok, what) {
  if (!ok) throw new Error(what);
}

async function fillCredentials(page, password) {
  await page.getByLabel("E-Mail", { exact: true }).fill(EMAIL);
  await page.getByLabel("Passwort", { exact: true }).fill(password);
}

async function signIn(page, password) {
  await page.goto(url("/login"));
  await fillCredentials(page, password);
  await page.getByRole("button", { name: "Anmelden", exact: true }).click();
}

/** A new client is asked about AI once, in place of the page; "Not now" answers it. */
async function passConsentIfAsked(page) {
  const notNow = page.getByRole("button", { name: "Jetzt nicht" });
  if (await notNow.isVisible()) {
    await notNow.click();
    await notNow.waitFor({ state: "detached", timeout: TIMEOUT });
  }
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {},
  );
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();

    step("a signed-out visitor to the portal is sent to sign-in");
    await page.goto(url("/dashboard"));
    await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });

    step("sign-in offers only the configured providers");
    // CI sets neither ORANGECAT_OAUTH_* nor GOOGLE_CLIENT_*, so only email/password.
    await page.getByLabel("Passwort", { exact: true }).waitFor({ timeout: TIMEOUT });
    const offered = await page.getByRole("button").allTextContents();
    assert(
      !offered.some((text) => /OrangeCat|Google/i.test(text)),
      `an unconfigured provider is offered: ${offered.join(" | ")}`,
    );
    await shot(page, "login");

    step("create an account through the register form");
    await page.goto(url("/register"));
    await fillCredentials(page, PASSWORD);
    await page.getByRole("button", { name: "Konto erstellen", exact: true }).click();
    await page.waitForURL(pathIs("/profile"), { timeout: TIMEOUT });

    step("the signed-in portal shows");
    await passConsentIfAsked(page);
    await page.goto(url("/dashboard"));
    await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
    await passConsentIfAsked(page);
    const signOut = page.getByTitle("Abmelden");
    await signOut.waitFor({ timeout: TIMEOUT });
    await shot(page, "dashboard-after-register");

    step("sign out");
    // The button is server-rendered; a click before hydration does nothing.
    await page.waitForLoadState("networkidle");
    await signOut.click();
    await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
    await page.goto(url("/dashboard"));
    await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });

    step("a wrong password is refused");
    await signIn(page, "not the password");
    await page.getByText("Ungültige E-Mail oder falsches Passwort").waitFor({ timeout: TIMEOUT });
    assert(pathIs("/login")(new URL(page.url())), `a wrong password left login: ${page.url()}`);
    await page.goto(url("/dashboard"));
    await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
    await shot(page, "login-refused");

    step("sign back in with the right password");
    await signIn(page, PASSWORD);
    await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
    await page.getByTitle("Abmelden").waitFor({ timeout: TIMEOUT });
    await shot(page, "dashboard-after-sign-in");

    step("passed");
  } catch (error) {
    // The page as the failing step left it, beside the server log in CI.
    for (const ctx of browser.contexts())
      for (const open of ctx.pages())
        await shot(open, "failure").catch((e) =>
          console.error("[smoke] no failure screenshot:", e),
        );
    throw error;
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error("[smoke] failed:", error);
  process.exit(1);
});
