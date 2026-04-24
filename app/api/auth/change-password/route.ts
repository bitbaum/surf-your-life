import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, API_ERR_RATE_LIMITED, BCRYPT_SALT_ROUNDS, PASSWORD_MIN_LENGTH } from "@/lib/constants"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(PASSWORD_MIN_LENGTH),
})

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "change-password"), 5)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user?.password) {
    return NextResponse.json(
      { success: false, error: "Password authentication not available for this account" },
      { status: 400 }
    )
  }

  const valid = await bcrypt.compare(parsed.data.currentPassword, user.password)
  if (!valid) {
    return NextResponse.json(
      { success: false, error: "Current password is incorrect" },
      { status: 400 }
    )
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, BCRYPT_SALT_ROUNDS)
  await db.update(users).set({ password: hashed }).where(eq(users.id, session.user.id))

  return NextResponse.json({ success: true })
}
