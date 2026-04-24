import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { eq, inArray } from "drizzle-orm"
import crypto from "crypto"
import { db } from "@/lib/db"
import { users, profiles, verificationTokens } from "@/lib/db/schema"
import { registerSchema, resolveRole, STAFF_ROLES } from "@/lib/domain/auth"
import { sendEmail } from "@/lib/email"
import { welcomeEmail, newUserAlertEmail, verificationEmail } from "@/lib/email/templates"
import { SITE_URL, DAY_MS, API_ERR_INVALID_INPUT, API_ERR_RATE_LIMITED, BCRYPT_SALT_ROUNDS, API_ERR_EMAIL_TAKEN } from "@/lib/constants"
import { EMAIL_SUBJECT_VERIFY, EMAIL_SUBJECT_WELCOME } from "@/lib/email/subjects"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "register"), 5)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: API_ERR_INVALID_INPUT, details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json(
      { success: false, error: API_ERR_EMAIL_TAKEN },
      { status: 409 }
    )
  }

  // Bootstrap: emails listed in ADMIN_EMAILS get admin role automatically on signup
  const role = resolveRole(email)

  const hashed = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS)

  // Atomic: if profile creation fails, roll back the user insert to avoid orphaned records
  const [user] = await db.transaction(async (tx) => {
    const [newUser] = await tx
      .insert(users)
      .values({ email, password: hashed, role })
      .returning({ id: users.id })
    await tx.insert(profiles).values({ userId: newUser.id })
    return [newUser]
  })

  // Fire-and-forget: welcome + verification email + alert admins
  const name = null
  const baseUrl = SITE_URL

  void Promise.all([
    // Welcome email
    sendEmail({ to: email, subject: EMAIL_SUBJECT_WELCOME, html: welcomeEmail({ name, email }) })
      .catch(e => console.error("[register] welcome email failed", e)),
    // Verification email — create a 24h token and send
    (async () => {
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + DAY_MS)
      await db.insert(verificationTokens).values({ identifier: email, token, expires })
      const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
      await sendEmail({
        to: email,
        subject: EMAIL_SUBJECT_VERIFY,
        html: verificationEmail({ email, verifyUrl }),
      })
    })().catch(e => console.error("[register] verification email failed", e)),
    (async () => {
      const admins = await db.select({ email: users.email }).from(users)
        .where(inArray(users.role, STAFF_ROLES))
      const adminEmails = admins.map(a => a.email).filter(Boolean) as string[]
      if (adminEmails.length === 0) return
      await sendEmail({
        to: adminEmails,
        subject: `New client: ${name ?? email}`,
        html: newUserAlertEmail({ name, email, createdAt: new Date() }),
      })
    })().catch(e => console.error("[register] admin alert email failed", e)),
  ])

  return NextResponse.json({ success: true }, { status: 201 })
}
