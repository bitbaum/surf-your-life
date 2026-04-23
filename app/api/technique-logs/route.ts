import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniqueLogs, techniqueAssignments } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { logTechniqueSchema } from "@/lib/domain/techniques"
import { toDateString } from "@/lib/utils"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // Default to last 14 days so debt can be computed client-side
  const since = searchParams.get("since") ?? (() => {
    const d = new Date()
    d.setDate(d.getDate() - 14)
    return toDateString(d)
  })()

  const rows = await db.query.techniqueLogs.findMany({
    where: and(
      eq(techniqueLogs.userId, session.user.id),
      gte(techniqueLogs.date, since)
    ),
    orderBy: (l, { desc }) => [desc(l.date)],
  })

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const body = await req.json()
  const result = logTechniqueSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error.flatten() }, { status: 400 })
  }

  // Verify the assignment belongs to this user
  const assignment = await db.query.techniqueAssignments.findFirst({
    where: and(
      eq(techniqueAssignments.id, result.data.assignmentId),
      eq(techniqueAssignments.clientId, session.user.id)
    ),
  })
  if (!assignment) {
    return NextResponse.json({ success: false, error: "Assignment not found" }, { status: 404 })
  }

  const [log] = await db
    .insert(techniqueLogs)
    .values({
      ...result.data,
      notes: result.data.notes ?? null,
      userId: session.user.id,
    })
    .returning()

  return NextResponse.json({ success: true, data: log }, { status: 201 })
}
