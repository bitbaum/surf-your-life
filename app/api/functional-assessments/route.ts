import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { functionalAssessments } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { functionalAssessmentSchema } from "@/lib/domain/clinical"
import { PAGINATION_DEFAULT } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const data = await db.query.functionalAssessments.findMany({
    where: eq(functionalAssessments.userId, session.user.id),
    orderBy: [desc(functionalAssessments.assessedAt)],
    limit: PAGINATION_DEFAULT,
  })

  return NextResponse.json({ success: true, data })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json()
  const parsed = functionalAssessmentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const { assessedAt, ...rest } = parsed.data
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
