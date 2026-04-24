import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and, gt } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { API_ERR_INVALID_INPUT, API_ERR_INVALID_TOKEN } from "@/lib/constants"

// POST /api/auth/verify-email — consume token and mark email as verified
const verifySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { token, email } = parsed.data
  const now = new Date()

  const vt = await db.query.verificationTokens.findFirst({
    where: and(
      eq(verificationTokens.identifier, email),
      eq(verificationTokens.token, token),
      gt(verificationTokens.expires, now)
    ),
  })

  if (!vt) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_TOKEN }, { status: 400 })
  }

  await Promise.all([
    db.update(users)
      .set({ emailVerified: now })
      .where(eq(users.email, email)),
    db.delete(verificationTokens)
      .where(and(eq(verificationTokens.identifier, email), eq(verificationTokens.token, token))),
  ])

  return NextResponse.json({ success: true })
}
