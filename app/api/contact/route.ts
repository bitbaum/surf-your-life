import { NextResponse } from "next/server"
import { z } from "zod"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"

const contactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(300),
  message: z.string().max(5000).optional(),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  await db.insert(leads).values({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
