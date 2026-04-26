import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniqueLogs, techniqueAssignments } from "@/lib/db/schema"
import { eq, and, gte, desc } from "drizzle-orm"
import { logTechniqueSchema } from "@/lib/domain/techniques"
import { localDateString, addDaysISO } from "@/lib/utils"
import { API_ERR_UNAUTHORIZED, API_ERR_NOT_FOUND, API_ERR_INVALID_INPUT, TECHNIQUE_LOG_WINDOW_DAYS } from "@/lib/constants"

const undoSchema = z.object({
  assignmentId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { searchParams } = new URL(req.url)
  // Default to TECHNIQUE_LOG_WINDOW_DAYS back from clinic-local today so the
  // debt-window cutoff matches the user's perceived calendar.
  const since = searchParams.get("since") ?? addDaysISO(localDateString(new Date()), -TECHNIQUE_LOG_WINDOW_DAYS)

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
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  // Verify the assignment belongs to this user
  const assignment = await db.query.techniqueAssignments.findFirst({
    where: and(
      eq(techniqueAssignments.id, result.data.assignmentId),
      eq(techniqueAssignments.clientId, session.user.id)
    ),
  })
  if (!assignment) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
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

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const body = await req.json()
  const parsed = undoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { assignmentId, date } = parsed.data

  // Verify assignment belongs to this user
  const assignment = await db.query.techniqueAssignments.findFirst({
    where: and(
      eq(techniqueAssignments.id, assignmentId),
      eq(techniqueAssignments.clientId, session.user.id)
    ),
  })
  if (!assignment) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  // Find the row with the highest completedReps for today — that's the one to delete
  const topRow = await db.query.techniqueLogs.findFirst({
    where: and(
      eq(techniqueLogs.userId, session.user.id),
      eq(techniqueLogs.assignmentId, assignmentId),
      eq(techniqueLogs.date, date)
    ),
    orderBy: [desc(techniqueLogs.completedReps)],
  })

  if (!topRow) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  await db.delete(techniqueLogs).where(eq(techniqueLogs.id, topRow.id))

  // Return the new effective count (max of remaining rows, or 0)
  const newTopRow = await db.query.techniqueLogs.findFirst({
    where: and(
      eq(techniqueLogs.userId, session.user.id),
      eq(techniqueLogs.assignmentId, assignmentId),
      eq(techniqueLogs.date, date)
    ),
    orderBy: [desc(techniqueLogs.completedReps)],
  })

  return NextResponse.json({ success: true, data: { newCount: newTopRow?.completedReps ?? 0 } })
}
