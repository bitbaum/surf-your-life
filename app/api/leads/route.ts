import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { newsletterSchema } from "@/lib/domain/lead"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = newsletterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  await db.insert(leads).values({
    name: parsed.data.email, // email as name for newsletter signups
    email: parsed.data.email,
    source: parsed.data.source,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
