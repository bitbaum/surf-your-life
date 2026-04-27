import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { newsletterSchema } from "@/lib/domain/lead"
import { API_ERR_RATE_LIMITED } from "@/lib/constants"
import { parseBody } from "@/lib/api"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "leads"), 10)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const result = await parseBody(req, newsletterSchema)
  if (!result.ok) return result.response

  await db.insert(leads).values({
    name: result.data.email, // email as name for newsletter signups
    email: result.data.email,
    source: result.data.source,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
