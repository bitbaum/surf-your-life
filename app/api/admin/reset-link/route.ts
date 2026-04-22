import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { passwordResetTokens } from "@/lib/db/schema"
import { randomBytes } from "crypto"
import { z } from "zod"
import { SITE_URL } from "@/lib/constants"

const schema = z.object({ userId: z.string().uuid() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role === "client") {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

  await db.insert(passwordResetTokens).values({
    userId: parsed.data.userId,
    token,
    expiresAt,
  })

  const link = `${SITE_URL}/reset-password?token=${token}`

  return NextResponse.json({ success: true, data: { link } })
}
