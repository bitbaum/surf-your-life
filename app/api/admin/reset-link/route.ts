import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { passwordResetTokens } from "@/lib/db/schema"
import { randomBytes } from "crypto"
import { z } from "zod"
import { SITE_URL, HOUR_MS , API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { parseBody } from "@/lib/api"
import { CLIENT_ROLE } from "@/lib/domain/auth"

const schema = z.object({ userId: z.string().uuid() })

export async function POST(req: Request) {
  const session = await auth()
  if (!session || session.user.role === CLIENT_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const result = await parseBody(req, schema)
  if (!result.ok) return result.response

  const token = randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + HOUR_MS)

  await db.insert(passwordResetTokens).values({
    userId: result.data.userId,
    token,
    expiresAt,
  })

  const link = `${SITE_URL}/reset-password?token=${token}`

  return NextResponse.json({ success: true, data: { link } })
}
