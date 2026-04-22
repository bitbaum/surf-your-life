import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { passwordResetTokens } from "@/lib/db/schema"
import { randomBytes } from "crypto"
import { z } from "zod"
import { SITE_URL, HOUR_MS , API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { CLIENT_ROLE } from "@/lib/domain/auth"

const schema = z.object({ userId: z.string().uuid() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role === CLIENT_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + HOUR_MS)

  await db.insert(passwordResetTokens).values({
    userId: parsed.data.userId,
    token,
    expiresAt,
  })

  const link = `${SITE_URL}/reset-password?token=${token}`

  return NextResponse.json({ success: true, data: { link } })
}
