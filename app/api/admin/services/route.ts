import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { serviceSchema } from "@/lib/domain/services"
import { isStaff } from "@/lib/domain/auth"
import { asc } from "drizzle-orm"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const data = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name))
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = serviceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [created] = await db
    .insert(services)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      durationMinutes: parsed.data.durationMinutes ?? null,
      available: true,
      sortOrder: 0,
    })
    .returning()

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
