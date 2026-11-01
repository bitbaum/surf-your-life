#!/usr/bin/env node
/**
 * Every way into a Surf Your Life account, in a real browser against the
 * production server and a PostgreSQL built from the committed migrations plus
 * the cutover import (.github/workflows/browser-smoke.yml):
 *
 *   - the sign-in, sign-up and recovery pages at 320px and 390px: no sideways
 *     scroll, no Google-only button, and the method set the env asks for
 *     (password, passkey, email link, recovery, OrangeCat, the bitbaum sign-in);
 *   - the portal sends a stranger to sign-in;
 *   - sign up through AccountKit's form, sign out, a wrong password refused,
 *     the right one accepted;
 *   - an account imported from Auth.js (bcrypt, seeded before the import)
 *     signs in with its old password and keeps its role;
 *   - recovery: the mailed reset link, a new password, the old one refused;
 *   - an email sign-in link signs in;
 *   - the profile's account panel offers passkeys and a second factor.
 *
 * The words are AccountKit's own German labels (authLabelsFor), the ones the
 * pages render. Mail is AccountKit's real mail caught by scripts/ci/mail-sink.cjs
 * (MAIL_SINK). Synthetic people only.
 *
 *   BASE_URL=http://localhost:3000 MAIL_SINK=… LEGACY_EMAIL=… LEGACY_PASSWORD=… \
 *     node scripts/browser-smoke.mjs
 */
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright-core";
import { authLabelsFor } from "@bitbaum/accountkit/auth";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const LOCALE = "de"; // routing.defaultLocale in i18n/routing.ts
const L = authLabelsFor(LOCALE);
const OUT = "browser-smoke-artifacts";
const SINK = process.env.MAIL_SINK;
const LEGACY_EMAIL = process.env.LEGACY_EMAIL;
const LEGACY_PASSWORD = process.env.LEGACY_PASSWORD;
const run = Date.now().toString(36);
const EMAIL = `smoke-${run}@example.test`;
const PASSWORD = `synthetic smoke password ${run}`;
const NEW_LEGACY_PASSWORD = `synthetic reset password ${run}`;
const TIMEOUT = 30_000;

const EXPECT = {
  orangecat: Boolean(process.env.ORANGECAT_OAUTH_CLIENT_ID),
  signin: Boolean(process.env.SIGNIN_CLIENT_ID),
  mail: Boolean(SINK),
};

const url = (route) => `${BASE}/${LOCALE}${route}`;
const pathIs = (route) => (u) => u.pathname === `/${LOCALE}${route}`;
const shot = (page, name) =>
  page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
const button = (page, name) => page.getByRole("button", { name, exact: true });
const session = (page) =>
  page.evaluate(async () => (await (await fetch("/api/auth/session")).json())?.user ?? null);

const failures = [];
function check(ok, what) {
  console.log(`${ok ? "PASS" : "FAIL"} ${what}`);
  if (!ok) failures.push(what);
}

/** The newest link to `route` in a message to `to`, from the mail sink. */
async function mailedLink(to, route) {
  for (let i = 0; i < 30; i++) {
    const lines = (await readFile(SINK, "utf8").catch(() => "")).split("\n").filter(Boolean);
    for (const line of lines.reverse()) {
      const mail = JSON.parse(line);
      if (![mail.to].flat().includes(to)) continue;
      const html = String(mail.html ?? mail.text ?? "").replaceAll("&amp;", "&");
      const link = html.match(new RegExp(`https?://[^"'\\s<>]*${route}[^"'\\s<>]*`));
      if (link) return link[0];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no ${route} link was mailed to the smoke address`);
}

async function signIn(page, email, password) {
  await page.goto(url("/login"));
  await page.locator('input[autocomplete="username webauthn"]').fill(email);
  await page.locator('input[autocomplete="current-password"]').fill(password);
  await button(page, L.signIn).click();
}

/** A new client is asked about AI once, in place of the page; "Not now" answers it. */
async function passConsentIfAsked(page) {
  const notNow = page.getByRole("button", { name: "Jetzt nicht" });
  if (await notNow.isVisible()) {
    await notNow.click();
    await notNow.waitFor({ state: "detached", timeout: TIMEOUT });
  }
}

async function signOut(page) {
  await page.goto(url("/dashboard"));
  await passConsentIfAsked(page);
  const out = page.getByTitle("Abmelden");
  await out.waitFor({ timeout: TIMEOUT });
  // The button is server-rendered; a click before hydration does nothing.
  await page.waitForLoadState("networkidle");
  await out.click();
  await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
}

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch(
  process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {},
);
let page;

try {
  // ── Every auth page at phone widths ────────────────────────────────────
  for (const width of [320, 390]) {
    const phone = await browser.newPage({ viewport: { width, height: 844 } });
    for (const route of ["/login", "/register", "/forgot-password"]) {
      await phone.goto(url(route));
      await phone.waitForLoadState("networkidle");
      const overflow = await phone.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      check(overflow <= 0, `${route} at ${width}px has no sideways scroll (${overflow}px)`);
      const google = phone.getByRole("button", {
        name: /^(sign in|continue|weiter) (with|mit) google$/i,
      });
      check((await google.count()) === 0, `${route} at ${width}px has no Google-only button`);
      await shot(phone, `${width}${route.replaceAll("/", "-")}`);
    }
    await phone.close();
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(e.message));

  // ── A stranger is sent to sign-in ──────────────────────────────────────
  await page.goto(url("/dashboard"));
  await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
  check(true, "the portal sends a stranger to sign-in");

  // ── The method set, on the sign-in and the sign-up page ────────────────
  const offered = async (route, labels) => {
    await page.goto(url(route));
    for (const [name, wanted] of labels) {
      const count = await button(page, name).count();
      check(
        wanted ? count === 1 : count === 0,
        `${route} ${wanted ? "offers" : "hides"} "${name}"`,
      );
    }
  };
  await offered("/login", [
    [L.signIn, true],
    [L.withPasskey, true],
    [L.withLink, EXPECT.mail],
    [L.recovery.forgot, EXPECT.mail],
    [L.withOrangecat, EXPECT.orangecat],
    [L.withSignin, EXPECT.signin],
  ]);
  await shot(page, "login-methods");
  await offered("/register", [
    [L.createAccount, true],
    [L.signUpWithLink, EXPECT.mail],
    [L.withOrangecat, EXPECT.orangecat],
    [L.withSignin, EXPECT.signin],
  ]);

  // ── Sign up through AccountKit's form ──────────────────────────────────
  await page.goto(url("/register"));
  await page.locator('input[autocomplete="email"]').fill(EMAIL);
  await page.locator('input[autocomplete="new-password"]').fill(PASSWORD);
  await button(page, L.createAccount).click();
  await page.waitForURL(pathIs("/profile"), { timeout: TIMEOUT });
  const created = await session(page);
  check(created?.email === EMAIL, "sign-up signs the new client in");
  check(created?.role === "client", "a new account is a client");
  await shot(page, "after-register");

  // ── The account panel: passkeys and a second factor ────────────────────
  await page.waitForLoadState("networkidle");
  await passConsentIfAsked(page);
  await page.goto(url("/profile"));
  for (const title of [L.account.passkeys, L.account.twoFactor]) {
    check(
      (await page.getByText(title, { exact: true }).count()) > 0,
      `the profile offers ${title}`,
    );
  }

  // ── Sign out, a wrong password, the right one ──────────────────────────
  await signOut(page);
  check((await session(page)) === null, "sign-out ends the session");
  await page.goto(url("/dashboard"));
  await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
  check(true, "the portal is closed again after sign-out");

  await signIn(page, EMAIL, "not the password");
  await page.getByText(L.errors.INVALID_EMAIL_OR_PASSWORD).waitFor({ timeout: TIMEOUT });
  check((await session(page)) === null, "a wrong password is refused");
  await shot(page, "login-refused");

  await signIn(page, EMAIL, PASSWORD);
  await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
  check((await session(page))?.email === EMAIL, "sign-in with the right password works");
  await signOut(page);

  // ── An account imported from Auth.js ───────────────────────────────────
  if (LEGACY_EMAIL && LEGACY_PASSWORD) {
    await signIn(page, LEGACY_EMAIL, LEGACY_PASSWORD);
    await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
    const legacy = await session(page);
    check(
      legacy?.email === LEGACY_EMAIL && legacy?.role === "practitioner",
      "an imported account signs in with its old password and keeps its role",
    );
    await signOut(page);
  } else {
    check(false, "LEGACY_EMAIL and LEGACY_PASSWORD are set");
  }

  if (EXPECT.mail && LEGACY_EMAIL) {
    // ── Recovery: the mailed link, a new password ────────────────────────
    await page.goto(url("/forgot-password"));
    await page.locator('input[autocomplete="email"]').fill(LEGACY_EMAIL);
    await button(page, L.recovery.send).click();
    await page.getByText(L.recovery.sent).waitFor({ timeout: TIMEOUT });
    check(true, "the recovery page sends a reset link");
    await page.goto(await mailedLink(LEGACY_EMAIL, "/api/auth/reset-password/"));
    await page.waitForURL(pathIs("/login"), { timeout: TIMEOUT });
    await page.locator('input[autocomplete="new-password"]').fill(NEW_LEGACY_PASSWORD);
    check(!page.url().includes("token="), "the reset token leaves the address bar");
    await button(page, L.recovery.reset).click();
    await page.getByText(L.recovery.success).waitFor({ timeout: TIMEOUT });
    await shot(page, "reset-done");
    await signIn(page, LEGACY_EMAIL, LEGACY_PASSWORD);
    await page.getByText(L.errors.INVALID_EMAIL_OR_PASSWORD).waitFor({ timeout: TIMEOUT });
    check(true, "after a reset the old password is refused");
    await signIn(page, LEGACY_EMAIL, NEW_LEGACY_PASSWORD);
    await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
    check((await session(page))?.email === LEGACY_EMAIL, "the new password signs in");
    await signOut(page);

    // ── An email sign-in link ────────────────────────────────────────────
    await page.goto(url("/login"));
    await page.locator('input[autocomplete="username webauthn"]').fill(EMAIL);
    await button(page, L.withLink).click();
    await page.getByText(L.checkInbox.replace("{email}", EMAIL)).waitFor({ timeout: TIMEOUT });
    await page.goto(await mailedLink(EMAIL, "/api/auth/magic-link/verify"));
    await page.waitForURL(pathIs("/dashboard"), { timeout: TIMEOUT });
    check((await session(page))?.email === EMAIL, "an email sign-in link signs in");
  }

  check(pageErrors.length === 0, `no uncaught page errors (${pageErrors.join(" | ")})`);
} catch (error) {
  failures.push(error instanceof Error ? error.message : String(error));
  console.error(error);
  await page
    ?.screenshot({ path: path.join(OUT, "failure.png"), fullPage: true })
    .catch((e) => console.error("[smoke] failure screenshot not taken", e.message));
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("\nsmoke: every way in works");
