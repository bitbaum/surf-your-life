import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { contactSchema } from "@/lib/domain/lead"
import { API_ERR_INVALID_INPUT } from "@/lib/constants"
import { checkRateLimit, ipKey } from "@/lib/rate-limit"

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "contact"), 5)
  if (!ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } }
    )
  }

  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  await db.insert(leads).values({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
