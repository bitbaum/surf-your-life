import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { generateAlerts } from "@/lib/domain/alerts"
import { embedCheckIn } from "@/lib/domain/embeddings"
import { eq, and, gte } from "drizzle-orm"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  // Prevent duplicate check-ins on the same calendar day
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const existing = await db.query.checkIns.findFirst({
    where: and(
      eq(checkIns.userId, session.user.id),
      gte(checkIns.createdAt, startOfDay)
    ),
  })
  if (existing) {
    return NextResponse.json({ success: false, error: "Already checked in today" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const [created] = await db
    .insert(checkIns)
    .values({
      ...parsed.data,
      userId: session.user.id,
      // journalEntry also mirrors to notes for backward compat with admin views
      notes: parsed.data.journalEntry ?? parsed.data.notes,
    })
    .returning({ id: checkIns.id })

  // Fire-and-forget: generate rule-based clinical alerts and semantic embedding
  void generateAlerts(session.user.id, created.id)
  void embedCheckIn(created.id)

  return NextResponse.json({ success: true }, { status: 201 })
}
