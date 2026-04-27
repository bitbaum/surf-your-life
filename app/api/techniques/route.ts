import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq, asc } from "drizzle-orm"
import { createTechniqueSchema } from "@/lib/domain/techniques"
import { SERVICES_MAX_LIMIT } from "@/lib/constants"
import { created, okData, parseBody, requireAuth, requireStaffAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response

  const rows = await db.query.techniques.findMany({
    where: eq(techniques.isActive, true),
    orderBy: [asc(techniques.category), asc(techniques.name)],
    limit: SERVICES_MAX_LIMIT,
  })

  return okData(rows)
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

  return created(technique)
}
