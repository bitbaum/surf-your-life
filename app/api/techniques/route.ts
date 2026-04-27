import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { createTechniqueSchema } from "@/lib/domain/techniques"
import { API_ERR_UNAUTHORIZED, SERVICES_MAX_LIMIT } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const rows = await db.query.techniques.findMany({
    where: eq(techniques.isActive, true),
    orderBy: [asc(techniques.category), asc(techniques.name)],
    limit: SERVICES_MAX_LIMIT,
  })

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, createTechniqueSchema)
  if (!result.ok) return result.response

  const { resourceUrl, ...rest } = result.data
  const [technique] = await db
    .insert(techniques)
    .values({
      ...rest,
      resourceUrl: resourceUrl || null,
      createdBy: session.user.id,
    })
    .returning()

  return NextResponse.json({ success: true, data: technique }, { status: 201 })
}
