/**
 * /api/auth/*: AccountKit's own endpoints (its sign-in, sign-up, recovery and
 * account screens call them), plus the next-auth/react protocol that
 * `useSession` and `signOut` on Surf Your Life's pages still speak, answered
 * with its session shape (roles live on `users`). docs/ACCOUNTKIT-MIGRATION.md.
 */
import { eq } from "drizzle-orm";
import type { Session } from "next-auth";
import { createNextAuthCompat } from "@bitbaum/accountkit/auth/nextauth-compat";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { promote } from "./surf-plugin";
import { sharedAuth, siteUrl } from "./runtime";

/** Surf Your Life's session from the `users` row, re-read on every request. */
async function surfSession(userId: string, expiresAt: Date | string): Promise<Session | null> {
  const row = await db.query.users.findFirst({ where: eq(users.id, userId) });
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
    expires: new Date(expiresAt).toISOString(),
  };
}

export const compat = createNextAuthCompat<Session>({
  runtime: sharedAuth,
  siteUrl: () => siteUrl(),
  signInPath: "/login",
  landing: "/dashboard",
  toSession: (shared) => surfSession(shared.user.id, shared.session.expiresAt),
  credentials: {
    credentials: {
      name: "Credentials",
      resolve: async (form) => {
        const email = String(form.get("email") ?? "").trim();
        return email ? { email } : null;
      },
    },
  },
  onSignedIn: ({ user }) => promote(user.id),
  // "Sign in with OrangeCat" always signs in; Surf Your Life has no "connect" screen.
  linkWhenSignedIn: () => false,
  // Surf Your Life renders AccountKit's screens and has no credential writer of its own.
  screens: "accountkit",
});
