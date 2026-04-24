import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { newsletterSchema } from "@/lib/domain/lead"
import { API_ERR_INVALID_INPUT, API_ERR_RATE_LIMITED } from "@/lib/constants"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "leads"), 10)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const body = await req.json()
  const parsed = newsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  await db.insert(leads).values({
    name: parsed.data.email, // email as name for newsletter signups
    email: parsed.data.email,
    source: parsed.data.source,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
