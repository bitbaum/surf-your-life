/**
 * Surf Your Life on AccountKit's shared account runtime. Off until
 * AUTH_RUNTIME=accountkit; Auth.js stays authoritative until the import and the
 * switch (docs/ACCOUNTKIT-MIGRATION.md).
 */
import bcrypt from "bcryptjs";
import { sharedRuntimeEnabled } from "@bitbaum/accountkit/auth/switch";
import { createAuthRuntime } from "@bitbaum/accountkit/auth/next";
import { createAuthMailer } from "@bitbaum/accountkit/auth/mail";
import { SITE_URL } from "@/lib/constants";
import { db } from "@/lib/db";
import { authTables } from "@/lib/db/accountkit";
import { ensureSurfUser } from "./accounts";

/** The public origin every redirect and every AccountKit origin check uses. */
export function siteUrl(env: NodeJS.ProcessEnv = process.env): string {
  return (env.AUTH_URL || SITE_URL).replace(/\/$/, "");
}

const site = { url: siteUrl(), title: "Surf Your Life", slug: "surf-your-life" };

// The secret is BETTER_AUTH_SECRET, or the AUTH_SECRET the box already holds.
export const sharedAuth = createAuthRuntime({
  site,
  // Account mail through the fleet transport (RESEND_*), as Surf Your Life's own is.
  mail: createAuthMailer({ site }),
  isDatabaseConfigured: (env) => sharedRuntimeEnabled(env) && Boolean(env.DATABASE_URL),
  getDatabase: () => db,
  schema: authTables,
  // Imported bcrypt hashes (users.password) keep working, and Surf Your Life's own
  // writers (registration, reset, password change) keep writing bcrypt.
  legacyBcrypt: bcrypt,
  // users.id is a uuid that every Surf Your Life table references.
  ids: "uuid",
  onAccountCreated: ensureSurfUser,
});
