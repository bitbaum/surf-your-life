import type { Session } from "next-auth";
import { compat } from "./shared/compat";

/**
 * Who is signed in: AccountKit's session, in Surf Your Life's shape (`id`,
 * `role`, `emailVerified`, `name`), re-read from the `users` row on every
 * request (lib/auth/shared/compat.ts, docs/ACCOUNTKIT-MIGRATION.md).
 */
export function auth(): Promise<Session | null> {
  return compat.currentSession();
}

/** /api/auth/*: AccountKit's endpoints and the next-auth/react protocol. */
export const handlers = compat.route;
