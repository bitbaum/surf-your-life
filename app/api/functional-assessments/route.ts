import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { functionalAssessments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { functionalAssessmentSchema } from "@/lib/domain/clinical"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { parseBody, requireAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const data = await db.query.functionalAssessments.findMany({
    where: eq(functionalAssessments.userId, session.user.id),
    orderBy: [desc(functionalAssessments.assessedAt)],
    limit: PAGINATION_DEFAULT,
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, functionalAssessmentSchema)
  if (!result.ok) return result.response

  const { assessedAt, ...rest } = result.data
  const [created] = await db
    .insert(functionalAssessments)
    .values({
      ...rest,
      userId: session.user.id,
      assessedAt: assessedAt ? new Date(assessedAt) : new Date(),
    })
    .returning({ id: functionalAssessments.id })

  return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
}
