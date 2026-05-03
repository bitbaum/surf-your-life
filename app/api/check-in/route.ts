import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkIns, users, assignments } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { generateAlerts } from "@/lib/domain/alerts"
import { embedCheckIn } from "@/lib/domain/embeddings"
import { sendEmail } from "@/lib/email"
import { firstCheckInAlertEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_FIRST_CHECKIN } from "@/lib/email/subjects"
import { STAFF_ROLES } from "@/lib/domain/auth"
import { eq, and, count, inArray, sql } from "drizzle-orm"
import { API_ERR_CHECKIN_DUPLICATE, CLINIC_TZ } from "@/lib/constants"
import { created, parseBody, requireAuth } from "@/lib/api"
import { findUserContact } from "@/lib/db/queries"

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  // Prevent duplicate check-ins on the same calendar day (in Zurich timezone)
  const todayInClinicTz = sql`(${checkIns.createdAt} AT TIME ZONE ${CLINIC_TZ})::date = (NOW() AT TIME ZONE ${CLINIC_TZ})::date`
  const [existing, priorCountResult] = await Promise.all([
    db.query.checkIns.findFirst({
      where: and(eq(checkIns.userId, session.user.id), todayInClinicTz),
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, session.user.id)),
  ])
  if (existing) {
    return NextResponse.json({ success: false, error: API_ERR_CHECKIN_DUPLICATE }, { status: 409 })
  }
  const isFirstCheckIn = (priorCountResult[0]?.count ?? 0) === 0

  const result = await parseBody(req, checkInSchema)
  if (!result.ok) return result.response

  const [checkIn] = await db
    .insert(checkIns)
    .values({
      ...result.data,
      userId: session.user.id,
      // journalEntry also mirrors to notes for backward compat with admin views
      notes: result.data.journalEntry ?? result.data.notes,
    })
    .returning({ id: checkIns.id })

  // Fire-and-forget: generate rule-based clinical alerts and semantic embedding
  void generateAlerts(session.user.id, checkIn.id)
  void embedCheckIn(checkIn.id)

  // Notify assigned practitioners (or all staff) on client's first check-in
  if (isFirstCheckIn) {
    void (async () => {
      try {
        const client = await findUserContact(session.user.id)
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

  return created()
}
