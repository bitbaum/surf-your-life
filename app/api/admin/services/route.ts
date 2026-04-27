import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { serviceSchema } from "@/lib/domain/services"
import { isStaff } from "@/lib/domain/auth"
import { asc } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_UNAUTHORIZED, SERVICES_MAX_LIMIT } from "@/lib/constants"
import { parseBody } from "@/lib/api"

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

  const result = await parseBody(req, serviceSchema)
  if (!result.ok) return result.response

  const [created] = await db
    .insert(services)
    .values({
      name: result.data.name,
      description: result.data.description ?? null,
      category: result.data.category,
      durationMinutes: result.data.durationMinutes ?? null,
      available: true,
      sortOrder: 0,
    })
    .returning()

  return NextResponse.json({ success: true, data: created }, { status: 201 })
}
