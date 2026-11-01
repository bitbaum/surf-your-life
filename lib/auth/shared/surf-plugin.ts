/**
 * What is Surf Your Life's own on AccountKit's endpoints (`plugins` in
 * runtime.ts): ADMIN_EMAILS promotes at a password or email-link sign-in,
 * never at an OIDC one, and never demotes (lib/auth/claims.ts), the rule
 * Auth.js and the compat layer used.
 */
import type { BetterAuthPlugin } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { roleAfterSignIn } from "../claims";

/** Sign-ins whose address Surf Your Life trusts for ADMIN_EMAILS (`credentials` in claims.ts). */
const TRUSTED_SIGN_IN_PATHS = ["/sign-in/email", "/magic-link/verify"];

/** ADMIN_EMAILS promotion after a sign-in whose address is trusted. */
export async function promote(userId: string): Promise<void> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { email: true, role: true },
  });
  if (!row) return;
  const role = roleAfterSignIn("credentials", row.email, row.role);
  if (role !== row.role) await db.update(users).set({ role }).where(eq(users.id, userId));
}

export function surfPlugin(): BetterAuthPlugin {
  return {
    id: "surf-your-life",
    hooks: {
      after: [
        {
          matcher: ({ path }) => Boolean(path && TRUSTED_SIGN_IN_PATHS.includes(path)),
          handler: createAuthMiddleware(async (ctx) => {
            const userId = ctx.context.newSession?.user.id;
            if (!userId) return;
            // A promotion that fails must never fail the sign-in.
            await promote(userId).catch((error) =>
              console.error("[auth] ADMIN_EMAILS promotion failed", {
                error: error instanceof Error ? error.message : String(error),
              }),
            );
          }),
        },
      ],
    },
  };
}
