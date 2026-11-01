/**
 * Surf Your Life's accounts, on AccountKit's shared runtime: email and
 * password, an email sign-in link, passkeys, two-factor codes, password
 * recovery, Sign in with OrangeCat and the shared bitbaum sign-in, each shown
 * when its env is set (signInMethods in lib/auth/methods.ts). AccountKit is the
 * only writer of credentials (docs/ACCOUNTKIT-MIGRATION.md).
 */
import bcrypt from "bcryptjs";
import { createAuthRuntime } from "@bitbaum/accountkit/auth/next";
import { createAuthMailer } from "@bitbaum/accountkit/auth/mail";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { authTables } from "@/lib/db/accountkit";
import { ensureSurfUser } from "./accounts";
import { surfPlugin } from "./surf-plugin";

/** The public origin every redirect and every AccountKit origin check uses. */
export function siteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.AUTH_URL || SITE_URL).replace(/\/$/, "");
}

const site = { url: siteUrl(), title: "Surf Your Life", slug: "surf-your-life" };

/** Account mail through the fleet transport (RESEND_*), as Surf Your Life's own is. */
export const authMail = createAuthMailer({ site });

// The secret is BETTER_AUTH_SECRET, or the AUTH_SECRET the box already holds.
export const sharedAuth = createAuthRuntime({
  site,
  mail: authMail,
  isDatabaseConfigured: (env) => Boolean(env.DATABASE_URL),
  getDatabase: () => db,
  schema: authTables,
  // Hashes imported from Auth.js are bcrypt; every password set through
  // AccountKit is its native scrypt.
  legacyBcrypt: bcrypt,
  // users.id is a uuid that every Surf Your Life table references.
  ids: "uuid",
  onAccountCreated: ensureSurfUser,
  plugins: [surfPlugin()],
});
