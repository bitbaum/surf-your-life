import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { users, passwordResetTokens } from "@/lib/db/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import bcrypt from "bcryptjs"

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
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
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
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
