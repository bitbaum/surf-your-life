import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { serviceSchema } from "@/lib/domain/services"
import { isStaff } from "@/lib/domain/auth"
import { asc } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, SERVICES_MAX_LIMIT } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const data = await db.select().from(services).orderBy(asc(services.sortOrder), asc(services.name)).limit(SERVICES_MAX_LIMIT)
  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const body = await req.json()
  const parsed = serviceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
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
