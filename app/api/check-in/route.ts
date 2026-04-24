import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, users, assignments } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { generateAlerts } from "@/lib/domain/alerts"
import { embedCheckIn } from "@/lib/domain/embeddings"
import { sendEmail } from "@/lib/email"
import { firstCheckInAlertEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_FIRST_CHECKIN } from "@/lib/email/subjects"
import { STAFF_ROLES } from "@/lib/domain/auth"
import { eq, and, gte, count, inArray } from "drizzle-orm"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED, API_ERR_CHECKIN_DUPLICATE } from "@/lib/constants"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  // Prevent duplicate check-ins on the same calendar day
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const [existing, priorCountResult] = await Promise.all([
    db.query.checkIns.findFirst({
      where: and(eq(checkIns.userId, session.user.id), gte(checkIns.createdAt, startOfDay)),
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, session.user.id)),
  ])
  if (existing) {
    return NextResponse.json({ success: false, error: API_ERR_CHECKIN_DUPLICATE }, { status: 409 })
  }
  const isFirstCheckIn = (priorCountResult[0]?.count ?? 0) === 0

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

  // Notify assigned practitioners (or all staff) on client's first check-in
  if (isFirstCheckIn) {
    void (async () => {
      try {
        const client = await db.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: { name: true, email: true },
        })
        // Prefer assigned practitioners; fall back to all staff
        const assignedRows = await db
          .select({ practitionerId: assignments.practitionerId })
          .from(assignments)
          .where(and(eq(assignments.clientId, session.user.id), eq(assignments.active, true)))
        const recipientIds = assignedRows.map((r) => r.practitionerId)
        const recipientRows = recipientIds.length > 0
          ? await db.select({ email: users.email }).from(users).where(inArray(users.id, recipientIds))
          : await db.select({ email: users.email }).from(users).where(inArray(users.role, STAFF_ROLES))
        const emails = recipientRows.map((r) => r.email).filter(Boolean) as string[]
        if (emails.length > 0) {
          await sendEmail({
            to: emails,
            subject: EMAIL_SUBJECT_FIRST_CHECKIN,
            html: firstCheckInAlertEmail({
              clientName: client?.name ?? null,
              clientEmail: client?.email ?? session.user.email ?? "",
              clientId: session.user.id,
            }),
          })
        }
      } catch (e) {
        console.error("[check-in] first check-in notification failed", e)
      }
    })()
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
