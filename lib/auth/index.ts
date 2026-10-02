import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema, resolveRole, CLIENT_ROLE, type AppRole } from "@/lib/domain/auth";
import { emailEarnsPromotion, googleClient, orangecatClient, orangecatProvider } from "./provider";
import { withOrangecatIdentity } from "./orangecat-identity";
import { orangecatUserStore } from "./orangecat-store";

// Absent (not broken) until the box has ORANGECAT_OAUTH_CLIENT_ID/_SECRET.
const orangecat = orangecatClient();
// Absent until the box has GOOGLE_CLIENT_ID/_SECRET (it has neither today).
const google = googleClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: withOrangecatIdentity(DrizzleAdapter(db), orangecatUserStore),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    // Identity only — no OrangeCat token refresh in jwt(): rotation breaks
    // inside page renders. The session lives on this app's own JWT.
    ...(orangecat ? [orangecatProvider(orangecat.clientId, orangecat.clientSecret)] : []),
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

        // Resolve role — only apply ADMIN_EMAILS promotion when the env var is
        // actually configured. If it's not set, trust the DB role as-is so that
        // manually-assigned admin accounts don't get silently downgraded to client.
        const existingRole = (user as { role?: string }).role ?? CLIENT_ROLE;
        // Never for an OrangeCat sign-in (see emailEarnsPromotion).
        const adminEmailsConfigured = (process.env.ADMIN_EMAILS ?? "").trim().length > 0;
        if (adminEmailsConfigured && emailEarnsPromotion(account?.provider)) {
          const correctRole = resolveRole(user.email ?? "");
          if (correctRole !== existingRole && user.id) {
            await db.update(users).set({ role: correctRole }).where(eq(users.id, user.id));
          }
          token.role = correctRole;
        } else {
          token.role = existingRole;
        }
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
