import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, and, gt } from "drizzle-orm"
import { randomBytes } from "crypto"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const { email } = parsed.data

  // Look up user — always return 200 to prevent email enumeration
  const user = await db.query.users.findFirst({ where: eq(users.email, email) })

  if (user) {
    // Invalidate any existing unexpired tokens
    const now = new Date()
    const existing = await db.query.passwordResetTokens.findFirst({
      where: and(
        eq(passwordResetTokens.userId, user.id),
        gt(passwordResetTokens.expiresAt, now)
      ),
    })

    if (!existing) {
      const token = randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      })

      // Email sending requires Resend (RESEND_API_KEY). Until configured,
      // token is logged so admin can retrieve it from Vercel logs.
      console.log(`[password-reset] token for ${email}: ${token}`)
    }
  }

  return NextResponse.json({ success: true })
}
