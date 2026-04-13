import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { contactSchema } from "@/lib/domain/lead"

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  await db.insert(leads).values({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
