import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { medicationLog } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { medicationEntrySchema } from "@/lib/domain/clinical"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { parseBody, requireAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const data = await db.query.medicationLog.findMany({
    where: eq(medicationLog.userId, session.user.id),
    orderBy: [desc(medicationLog.createdAt)],
    limit: PAGINATION_DEFAULT,
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, medicationEntrySchema)
  if (!result.ok) return result.response

  const [created] = await db
    .insert(medicationLog)
    .values({ ...result.data, userId: session.user.id })
    .returning({ id: medicationLog.id })

  return NextResponse.json({ success: true, data: { id: created.id } }, { status: 201 })
}
