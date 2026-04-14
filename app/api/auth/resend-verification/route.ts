import { NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, verificationTokens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { verificationEmail } from "@/lib/email/templates"

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
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
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
  await db.insert(verificationTokens).values({ identifier: email, token, expires })

  const baseUrl = process.env.AUTH_URL ?? "https://surf-your-life.ch"
  const verifyUrl = `${baseUrl}/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  void sendEmail({
    to: email,
    subject: "Verify your email — Surf Your Life",
    html: verificationEmail({ email, verifyUrl }),
  }).catch((e) => console.error("[resend-verification]", e))

  return NextResponse.json({ success: true })
}
