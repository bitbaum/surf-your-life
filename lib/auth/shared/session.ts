/**
 * Surf Your Life's session shape, answered from a shared AccountKit session. Every
 * request rereads the `users` row, so a role change, a renamed account, a newly
 * verified address or a deleted account applies at once — `update()` has
 * nothing left to carry.
 */
import * as React from "react";
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sharedAuth } from "./runtime";

type SharedSession = { user: { id: string }; session: { expiresAt: Date | string } };

export async function surfSession(shared: SharedSession | null): Promise<Session | null> {
  if (!shared) return null;
  const row = await db.query.users.findFirst({ where: eq(users.id, shared.user.id) });
  if (!row) return null;
  return {
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      image: row.image,
      role: row.role,
      emailVerified: row.emailVerified,
    },
    expires: new Date(shared.session.expiresAt).toISOString(),
  };
}

// React.cache dedupes per request on the server; outside React (tests) it is absent.
const cache: <T extends (...args: never[]) => unknown>(fn: T) => T = React.cache ?? ((fn) => fn);

/** The session of this request (server components, route handlers). */
export const sharedSession = cache(async () => surfSession(await sharedAuth.getSession()));

/** The session behind request headers (the proxy, the /session endpoint). */
export async function sharedSessionFor(headers: Headers): Promise<Session | null> {
  return surfSession(await sharedAuth.sessionFor(headers).catch(() => null));
}

/** The shared session id behind these headers, for "keep this session" writes. */
export async function sharedSessionId(headers: Headers): Promise<string | null> {
  const shared = await sharedAuth.sessionFor(headers).catch(() => null);
  return shared?.session.id ?? null;
}
