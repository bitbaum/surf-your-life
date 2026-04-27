import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { practitionerNoteSchema } from "@/lib/domain/profile"
import { eq } from "drizzle-orm"
import { practitionerNoteEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_PRACTITIONER_NOTE } from "@/lib/email/subjects"
import { SITE_URL } from "@/lib/constants"
import { notFound, parseBody, requireStaffAuth } from "@/lib/api"
import { findUserContact } from "@/lib/db/queries"
import { sendEmailFire } from "@/lib/email"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return notFound()

  const result = await parseBody(req, practitionerNoteSchema)
  if (!result.ok) return result.response

  const [updated] = await db
    .update(checkIns)
    .set({ practitionerNote: result.data.note, practitionerNoteAt: new Date() })
    .where(eq(checkIns.id, id))
    .returning()

  // Notify the client by email (fire-and-forget)
  const client = await findUserContact(existing.userId)
  if (client?.email) {
    sendEmailFire({
      to: client.email,
      subject: EMAIL_SUBJECT_PRACTITIONER_NOTE,
      html: practitionerNoteEmail({
        clientName: client.name ?? client.email,
        checkInDate: existing.createdAt,
        note: result.data.note,
        portalUrl: `${SITE_URL}/check-ins`,
      }),
    }, "practitioner-note")
  }

  return NextResponse.json({ success: true, data: updated })
}
