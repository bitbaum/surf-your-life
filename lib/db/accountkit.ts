import { createAuthTables } from "@bitbaum/accountkit/auth/schema";

/**
 * AccountKit's account tables under the `auth_` prefix, beside Auth.js's own
 * `users` / `accounts` / `sessions`. Read and written by the shared runtime
 * (lib/auth/shared/) and the mirror triggers (migrations 0029 and 0030).
 * See docs/ACCOUNTKIT-MIGRATION.md.
 */
export const authTables = createAuthTables("auth_");

export const {
  user: authUsers,
  account: authAccounts,
  session: authSessions,
  verification: authVerifications,
  passkey: authPasskeys,
  twoFactor: authTwoFactors,
} = authTables;
