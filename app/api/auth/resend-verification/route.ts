import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmailFire } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"
import { SITE_URL, DAY_MS, API_ERR_RATE_LIMITED, API_ERR_EMAIL_ALREADY_VERIFIED } from "@/lib/constants"
import { EMAIL_SUBJECT_VERIFY } from "@/lib/email/subjects"
import { checkRateLimit } from "@/lib/rate-limit"
import { notFound, requireAuth, ok } from "@/lib/api"

export async function POST() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { ok: rateOk, retryAfterSecs } = checkRateLimit(`resend-verification:${session.user.id}`, 3)
  if (!rateOk) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    return notFound()
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { success: false, error: API_ERR_EMAIL_ALREADY_VERIFIED },
      { status: 400 }
    )
  }

  const email = user.email

  // Delete any existing token for this email
  await db
    .delete(verificationTokens)
    .where(eq(verificationTokens.identifier, email))

  // Generate new token
  const token = randomBytes(32).toString("hex")
  const expires = new Date(Date.now() + DAY_MS)
  await db.insert(verificationTokens).values({ identifier: email, token, expires })

  const verifyUrl = `${SITE_URL}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  sendEmailFire({ to: email, subject: EMAIL_SUBJECT_VERIFY, html: verificationEmail({ email, verifyUrl }) }, "resend-verification")

  return ok()
}
