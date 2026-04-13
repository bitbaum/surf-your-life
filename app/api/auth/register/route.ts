import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { eq, inArray } from "drizzle-orm"
import crypto from "crypto"
import { db } from "@/lib/db"
import { users, profiles, verificationTokens } from "@/lib/db/schema"
import { registerSchema } from "@/lib/domain/auth"
import { sendEmail } from "@/lib/email"
import { welcomeEmail, newUserAlertEmail, verificationEmail } from "@/lib/email/templates"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json(
      { success: false, error: "An account with this email already exists" },
      { status: 409 }
    )
  }

  // Bootstrap: emails listed in ADMIN_EMAILS get admin role automatically on signup
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  const role = adminEmails.includes(email.toLowerCase()) ? 'admin' : 'client'

  const hashed = await bcrypt.hash(password, 12)
  const [user] = await db
    .insert(users)
    .values({ email, password: hashed, role })
    .returning({ id: users.id })

  // Create empty profile
  await db.insert(profiles).values({ userId: user.id })

  // Fire-and-forget: welcome + verification email + alert admins
  const name = null
  const baseUrl = process.env.AUTH_URL ?? "https://surf-your-life.ch"

  void Promise.all([
    // Welcome email
    sendEmail({ to: email, subject: "Welcome to Surf Your Life", html: welcomeEmail({ name, email }) })
      .catch(e => console.error("[register] welcome email failed", e)),
    // Verification email — create a 24h token and send
    (async () => {
      const token = crypto.randomBytes(32).toString("hex")
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
      await db.insert(verificationTokens).values({ identifier: email, token, expires })
      const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`
      await sendEmail({
        to: email,
        subject: "Verify your email — Surf Your Life",
        html: verificationEmail({ email, verifyUrl }),
      })
    })().catch(e => console.error("[register] verification email failed", e)),
    (async () => {
      const admins = await db.select({ email: users.email }).from(users)
        .where(inArray(users.role, ["admin", "practitioner"]))
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
