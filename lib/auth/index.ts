import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema, CLIENT_ROLE, type AppRole } from "@/lib/domain/auth";
import {
  orangecatClient,
  orangecatProvider,
  withOrangecatIdentity,
} from "@bitbaum/accountkit/orangecat";
import { googleClient } from "./google";
import { orangecatUserStore } from "./orangecat-store";
import type { Session } from "next-auth";
import type { NextRequest } from "next/server";
import { roleAfterSignIn } from "./claims";
import { sharedAuth, sharedAuthEnabled } from "./shared/runtime";
import { sharedSession } from "./shared/session";
import { nextAuthClientCompat } from "./shared/bridge";

// Absent (not broken) until the box has ORANGECAT_OAUTH_CLIENT_ID/_SECRET.
const orangecat = orangecatClient();
// Absent until the box has GOOGLE_CLIENT_ID/_SECRET (it has neither today).
const google = googleClient();

const nextAuth = NextAuth({
  adapter: withOrangecatIdentity(DrizzleAdapter(db), orangecatUserStore),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Identity only — no OrangeCat token refresh in jwt(): rotation breaks
    // inside page renders. The session lives on this app's own JWT.
    ...(orangecat ? [orangecatProvider(orangecat)] : []),
    ...(google ? [Google({ clientId: google.clientId, clientSecret: google.clientSecret })] : []),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        });

        if (!user?.password) return null;

        const valid = await bcrypt.compare(parsed.data.password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: user.emailVerified,
        } as {
          id: string;
          email: string;
          name: string | null;
          role: string;
          emailVerified: Date | null;
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null;

        const existingRole = ((user as { role?: string }).role ?? CLIENT_ROLE) as AppRole;
        const role = roleAfterSignIn(account?.provider, user.email, existingRole);
        if (role !== existingRole && user.id) {
          await db.update(users).set({ role }).where(eq(users.id, user.id));
        }
        token.role = role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as AppRole;
      session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null;
      return session;
    },
  },
});

export const { signIn, signOut } = nextAuth;

/**
 * Who is signed in. One reader for both runtimes: AccountKit's shared session
 * with AUTH_RUNTIME=accountkit, the Auth.js JWT otherwise. Same shape either
 * way (docs/ACCOUNTKIT-MIGRATION.md).
 */
export async function auth(): Promise<Session | null> {
  return sharedAuthEnabled() ? sharedSession() : nextAuth.auth();
}

/** The Auth.js proxy wrapper; proxy.ts uses it only with the switch off. */
export const authJsProxy = nextAuth.auth;

/** /api/auth/*: AccountKit answers when the shared runtime is on. */
export const handlers = {
  GET: async (request: NextRequest) =>
    sharedAuthEnabled()
      ? ((await nextAuthClientCompat(request)) ?? sharedAuth.GET(request))
      : nextAuth.handlers.GET(request),
  POST: async (request: NextRequest) =>
    sharedAuthEnabled()
      ? ((await nextAuthClientCompat(request)) ?? sharedAuth.POST(request))
      : nextAuth.handlers.POST(request),
};
