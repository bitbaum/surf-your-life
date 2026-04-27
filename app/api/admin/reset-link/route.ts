import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { passwordResetTokens } from "@/lib/db/schema"
import { randomBytes } from "crypto"
import { z } from "zod"
import { SITE_URL, HOUR_MS } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"

const schema = z.object({ userId: z.string().uuid() })

export async function POST(req: Request) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

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
