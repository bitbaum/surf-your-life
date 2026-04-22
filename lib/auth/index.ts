import NextAuth from "next-auth"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { loginSchema, resolveRole, CLIENT_ROLE, type AppRole } from "@/lib/domain/auth"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await db.query.users.findFirst({
          where: eq(users.email, parsed.data.email),
        })

        if (!user?.password) return null

        const valid = await bcrypt.compare(parsed.data.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, emailVerified: user.emailVerified } as { id: string; email: string; name: string | null; role: string; emailVerified: Date | null }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.emailVerified = (user as { emailVerified?: Date | null }).emailVerified ?? null

        // Resolve role — only apply ADMIN_EMAILS promotion when the env var is
        // actually configured. If it's not set, trust the DB role as-is so that
        // manually-assigned admin accounts don't get silently downgraded to client.
        const existingRole = (user as { role?: string }).role ?? CLIENT_ROLE
        const adminEmailsConfigured = (process.env.ADMIN_EMAILS ?? "").trim().length > 0
        if (adminEmailsConfigured) {
          const correctRole = resolveRole(user.email ?? "")
          if (correctRole !== existingRole && user.id) {
            await db.update(users).set({ role: correctRole }).where(eq(users.id, user.id))
          }
          token.role = correctRole
        } else {
          token.role = existingRole
        }
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as AppRole
      session.user.emailVerified = (token.emailVerified as Date | null | undefined) ?? null
      return session
    },
  },
})
