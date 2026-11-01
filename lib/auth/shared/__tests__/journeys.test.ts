// @vitest-environment node
/**
 * Surf Your Life's ways in on the shared runtime: the calls `next-auth/react` makes,
 * answered by AccountKit, on the committed migration chain plus the real
 * cutover import and its mirror triggers.
 *
 * Needs a disposable PostgreSQL built by scripts/db/check-migration-drift.sh:
 *   SURF_JOURNEY_DATABASE_URL=postgres://…  pnpm exec vitest run lib/auth/shared
 * CI's account job runs it after the replay. Without the variable it is
 * skipped. It TRUNCATEs `users` (cascade): never point it at a database anyone uses.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import bcrypt from "bcryptjs";
import { createCompatClient } from "@bitbaum/accountkit/auth/compat-testing";
import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";

const URL_ = process.env.SURF_JOURNEY_DATABASE_URL;
const SITE = "https://surf.example.test";
vi.hoisted(() => {
  const url = process.env.SURF_JOURNEY_DATABASE_URL;
  if (url) {
    Object.assign(process.env, {
      DATABASE_URL: url,
      AUTH_URL: "https://surf.example.test",
      AUTH_RUNTIME: "accountkit",
      AUTH_SECRET: "synthetic-surf-journey-secret-at-least-32-chars",
      ADMIN_EMAILS: "boss@example.test",
    });
    delete process.env.RESEND_API_KEY;
    delete process.env.BETTER_AUTH_SECRET;
    delete process.env.ORANGECAT_OAUTH_CLIENT_ID;
  }
});

vi.mock("next/headers", () => ({
  headers: async () => new Headers(),
  cookies: async () => ({ get: () => undefined, delete: () => undefined }),
}));

const PASSWORD = "synthetic legacy password";
const VET = "00000000-0000-4000-8000-000000000001";
const OWNER = "00000000-0000-4000-8000-000000000002";
const BOSS = "00000000-0000-4000-8000-000000000003";
const OC_ONLY = "00000000-0000-4000-8000-000000000004";
const IMPORT_SQL = path.resolve(__dirname, "../../../../scripts/db/accountkit-import.sql");

describe.skipIf(!URL_)("Surf Your Life on AccountKit (real PostgreSQL)", () => {
  let browser: ReturnType<typeof createCompatClient>;

  async function pool() {
    const { db } = await import("@/lib/db");
    return db.$client;
  }

  async function sql(text: string, params: unknown[] = []) {
    return (await (await pool()).query(text, params)).rows;
  }

  afterAll(async () => {
    await (await pool()).end();
  });

  beforeEach(async () => {
    browser = createCompatClient({ compat: (await import("../compat")).compat, site: SITE });
    await sql(`DROP TRIGGER IF EXISTS surf_accountkit_from_users ON users;
      DROP TRIGGER IF EXISTS surf_accountkit_to_users ON auth_users;
      TRUNCATE auth_users, auth_accounts, auth_sessions, auth_verifications,
        auth_passkeys, auth_two_factors, users CASCADE`);
    const hash = await bcrypt.hash(PASSWORD, 4);
    await sql(
      `INSERT INTO users (id, email, name, password, role, email_verified, orangecat_sub) VALUES
        ($1, 'Vet@Example.test', 'Vet', $5, 'practitioner', now(), NULL),
        ($2, 'owner@example.test', 'Owner', $5, 'client', NULL, NULL),
        ($3, 'boss@example.test', 'Boss', $5, 'client', now(), NULL),
        ($4, 'oc@example.test', 'From OrangeCat', NULL, 'client', NULL, 'oc-actor-1')`,
      [VET, OWNER, BOSS, OC_ONLY, hash],
    );
    await importAccounts();
  });

  async function importAccounts() {
    const client = await (await pool()).connect();
    try {
      await client.query("BEGIN");
      await client.query(await readFile(IMPORT_SQL, "utf8"));
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // The shared test client, in this file's request/answer shape.
  const request = (route: string, init: { form?: Record<string, string>; get?: boolean } = {}) => ({
    route,
    form: init.form,
  });
  const answer = (req: ReturnType<typeof request>) => browser.call(req.route, req.form);
  const signIn = (email: string, password: string) =>
    browser.signIn("credentials", { email, password }, `${SITE}/dashboard`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const session = () => browser.session<any>();

  test("an imported bcrypt account signs in, in any letter case, with its role and verification", async () => {
    const result = await signIn("VET@example.test", PASSWORD);
    expect(new URL(result.url).searchParams.get("error")).toBeNull();
    expect(result.url).toBe(`${SITE}/dashboard`);
    const current = await session();
    expect(current.user).toMatchObject({
      id: VET,
      email: "Vet@Example.test",
      role: "practitioner",
    });
    expect(current.user.emailVerified).toBeTruthy();
  });

  test("a wrong password, an unknown address or an OrangeCat-only person is refused", async () => {
    for (const [email, password] of [
      ["owner@example.test", "not the password"],
      ["nobody@example.test", PASSWORD],
      ["oc@example.test", PASSWORD],
    ]) {
      const result = await signIn(email, password);
      expect(new URL(result.url).searchParams.get("error")).toBe("CredentialsSignin");
      expect(await session()).toBeNull();
    }
  });

  test("ADMIN_EMAILS promotes at a password sign-in and never demotes", async () => {
    await signIn("boss@example.test", PASSWORD);
    expect((await session()).user.role).toBe("admin");
    browser.cookie = "";
    await signIn("vet@example.test", PASSWORD);
    expect((await session()).user.role, "a practitioner stays a practitioner (no demotion)").toBe(
      "practitioner",
    );
  });

  test("an unconfirmed address signs in at once (AccountKit 0.16.0)", async () => {
    const result = await signIn("owner@example.test", PASSWORD);
    expect(new URL(result.url).searchParams.get("error")).toBeNull();
    expect((await session()).user).toMatchObject({ id: OWNER, emailVerified: null });
  });

  test("sign-out ends the session and lands where the page asked", async () => {
    await signIn("owner@example.test", PASSWORD);
    const out = await answer(
      request("/signout", { form: { csrfToken: "x", callbackUrl: `${SITE}/en` } }),
    );
    expect((await out.json()).url).toBe(`${SITE}/en`);
    expect(await session()).toBeNull();
  });

  test("a role change or a rename applies on the next request, without update()", async () => {
    await signIn("owner@example.test", PASSWORD);
    await sql("UPDATE users SET role = 'practitioner', name = 'Renamed' WHERE id = $1", [OWNER]);
    const updated = await (await answer(request("/session", { form: { data: "{}" } }))).json();
    expect(updated.user).toMatchObject({ role: "practitioner", name: "Renamed" });
  });

  test("account deletion signs the person out at once", async () => {
    await signIn("owner@example.test", PASSWORD);
    await sql("DELETE FROM users WHERE id = $1", [OWNER]);
    expect(await session()).toBeNull();
    expect(await sql("SELECT 1 FROM auth_users WHERE id = $1", [OWNER])).toHaveLength(0);
  });

  test("Surf Your Life's registration writer reaches the shared row, so the new person signs in", async () => {
    await sql(
      `INSERT INTO users (email, name, password) VALUES ('fresh@example.test', 'Fresh', $1)`,
      [await bcrypt.hash("a brand new password", 4)],
    );
    const result = await signIn("fresh@example.test", "a brand new password");
    expect(new URL(result.url).searchParams.get("error")).toBeNull();
    expect((await session()).user).toMatchObject({
      email: "fresh@example.test",
      role: "client",
    });
  });

  test("changing your own password keeps your session and ends every other one", async () => {
    await signIn("owner@example.test", PASSWORD);
    const mine = browser.cookie;
    browser.cookie = "";
    await signIn("owner@example.test", PASSWORD);
    const other = browser.cookie;

    const { compat } = await import("../compat");
    const keep = await compat.sessionIdFor(new Headers({ cookie: mine }));
    expect(keep).toBeTruthy();
    const client = await (await pool()).connect();
    try {
      await client.query("BEGIN");
      await client.query("SELECT set_config('surf.keep_session', $1, true)", [keep]);
      await client.query("UPDATE users SET password = $1 WHERE id = $2", [
        await bcrypt.hash("the new password", 4),
        OWNER,
      ]);
      await client.query("COMMIT");
    } finally {
      client.release();
    }

    browser.cookie = mine;
    expect((await session())?.user?.id, "the changing session stays").toBe(OWNER);
    browser.cookie = other;
    expect(await session(), "every other session ends").toBeNull();
    browser.cookie = "";
    const old = await signIn("owner@example.test", PASSWORD);
    expect(new URL(old.url).searchParams.get("error")).toBe("CredentialsSignin");
    const fresh = await signIn("owner@example.test", "the new password");
    expect(new URL(fresh.url).searchParams.get("error")).toBeNull();
  });

  test("a reset through Surf Your Life's link ends every session", async () => {
    await signIn("owner@example.test", PASSWORD);
    await sql("UPDATE users SET password = $1 WHERE id = $2", [
      await bcrypt.hash("reset password", 4),
      OWNER,
    ]);
    expect(await session()).toBeNull();
  });

  test("an OrangeCat sub is imported as the pair AccountKit's OIDC sign-in looks up", async () => {
    const rows = await sql(
      "SELECT user_id, account_id FROM auth_accounts WHERE provider_id = 'orangecat'",
    );
    expect(rows).toEqual([{ user_id: OC_ONLY, account_id: "oc-actor-1" }]);
  });

  test("a person AccountKit creates itself gets a Surf Your Life row under the same id", async () => {
    const { ensureSurfUser } = await import("../accounts");
    const id = "00000000-0000-4000-8000-0000000000aa";
    await sql(
      `INSERT INTO auth_users (id, name, email) VALUES ($1, 'New', 'new@orangecat.invalid')`,
      [id],
    );
    await ensureSurfUser({ userId: id, providerId: "orangecat", accountId: "oc-actor-2" });
    await ensureSurfUser({ userId: id, providerId: "orangecat", accountId: "oc-actor-2" });
    const [row] = await sql("SELECT role, orangecat_sub, email_verified FROM users WHERE id = $1", [
      id,
    ]);
    expect(row).toMatchObject({
      role: "client",
      orangecat_sub: "oc-actor-2",
      email_verified: null,
    });
  });

  test("OrangeCat is offered only with its client configured", async () => {
    const { compat } = await import("../compat");
    expect(Object.keys(compat.providers())).toEqual(["credentials"]);
    Object.assign(process.env, {
      ORANGECAT_OAUTH_CLIENT_ID: "surf-your-life",
      ORANGECAT_OAUTH_CLIENT_SECRET: "s",
    });
    try {
      expect(Object.keys(compat.providers())).toEqual(["orangecat", "credentials"]);
    } finally {
      delete process.env.ORANGECAT_OAUTH_CLIENT_ID;
      delete process.env.ORANGECAT_OAUTH_CLIENT_SECRET;
    }
  });

  test("AccountKit's own credential writers stay closed until Surf Your Life adopts its screens", async () => {
    for (const route of ["/sign-up/email", "/change-password", "/request-password-reset"]) {
      const res = await answer(request(route, { form: { email: "x@example.test" } }));
      expect(res.status, route).toBe(404);
    }
  });

  test("the import is a no-op for the same snapshot and refuses drift", async () => {
    await importAccounts();
    // A write that bypassed the mirror (the trigger detached) is drift.
    await sql(`DROP TRIGGER surf_accountkit_from_users ON users`);
    await sql("UPDATE users SET email_verified = now() WHERE id = $1", [OWNER]);
    await expect(importAccounts()).rejects.toThrow(/snapshot differs/);
  });

  test("the import refuses addresses that collide once lower-cased", async () => {
    await sql(`DROP TRIGGER surf_accountkit_from_users ON users;
      TRUNCATE auth_users CASCADE`);
    await sql(`INSERT INTO users (email, name) VALUES ('VET@example.test', 'Twin')`);
    await expect(importAccounts()).rejects.toThrow(/address reconciliation/);
  });
});
