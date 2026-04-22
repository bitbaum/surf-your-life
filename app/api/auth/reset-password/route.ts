import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import bcrypt from "bcryptjs"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"
import { API_ERR_INVALID_INPUT, PASSWORD_MIN_LENGTH } from "@/lib/constants"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(PASSWORD_MIN_LENGTH),
})

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "reset-password"), 5)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { token, password } = parsed.data
  const now = new Date()

  const resetToken = await db.query.passwordResetTokens.findFirst({
    where: and(
      eq(passwordResetTokens.token, token),
      gt(passwordResetTokens.expiresAt, now),
      isNull(passwordResetTokens.usedAt)
    ),
  })

  if (!resetToken) {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 400 })
  }

  const hash = await bcrypt.hash(password, 12)

  await Promise.all([
    db.update(users).set({ password: hash }).where(eq(users.id, resetToken.userId)),
    db.update(passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(passwordResetTokens.id, resetToken.id)),
  ])

  return NextResponse.json({ success: true })
}
