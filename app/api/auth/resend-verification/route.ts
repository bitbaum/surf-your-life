import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"
import { SITE_URL, DAY_MS, API_ERR_UNAUTHORIZED, API_ERR_NOT_FOUND } from "@/lib/constants"
import { EMAIL_SUBJECT_VERIFY } from "@/lib/email/subjects"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { ok, retryAfterSecs } = checkRateLimit(`resend-verification:${session.user.id}`, 3)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  if (user.emailVerified) {
    return NextResponse.json(
      { success: false, error: "Email already verified" },
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

  void sendEmail({
    to: email,
    subject: EMAIL_SUBJECT_VERIFY,
    html: verificationEmail({ email, verifyUrl }),
  }).catch((e) => console.error("[resend-verification]", e))

  return NextResponse.json({ success: true })
}
