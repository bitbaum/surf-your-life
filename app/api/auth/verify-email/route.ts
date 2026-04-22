import { NextResponse } from "next/server"
import { z } from "zod"
import { eq, and, gt } from "drizzle-orm"
import crypto from "crypto"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { auth } from "@/lib/auth"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"
import { SITE_URL, BRAND_NAME } from "@/lib/constants"

// POST /api/auth/verify-email — consume token and mark email as verified
const verifySchema = z.object({
  token: z.string().min(1),
  email: z.string().email(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = verifySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
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
    return NextResponse.json({ success: false, error: "Invalid or expired link" }, { status: 400 })
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

// PUT /api/auth/verify-email — resend verification email (authenticated user only)
export async function PUT() {
  const session = await auth()
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { email } = session.user

  // Delete any existing tokens for this email, then create a fresh one
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email))

  const token = crypto.randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.insert(verificationTokens).values({ identifier: email, token, expires })

  const verifyUrl = `${SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
  await sendEmail({
    to: email,
    subject: `Verify your email — ${BRAND_NAME}`,
    html: verificationEmail({ email, verifyUrl }),
  }).catch(e => console.error("[verify-email] resend failed", e))

  return NextResponse.json({ success: true })
}
