import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns, users } from "@/lib/db/schema"
import { practitionerNoteSchema } from "@/lib/domain/profile"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { practitionerNoteEmail } from "@/lib/email/templates"
import { SITE_URL } from "@/lib/constants"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "practitioner") {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })

  const body = await req.json()
  const parsed = practitionerNoteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [updated] = await db
    .update(checkIns)
    .set({ practitionerNote: parsed.data.note, practitionerNoteAt: new Date() })
    .where(eq(checkIns.id, id))
    .returning()

  // Notify the client by email (fire-and-forget)
  const client = await db.query.users.findFirst({
    where: eq(users.id, existing.userId),
    columns: { email: true, name: true },
  })
  if (client?.email) {
    sendEmail({
      to: client.email,
      subject: "You have a new note from your practitioner",
      html: practitionerNoteEmail({
        clientName: client.name ?? client.email,
        checkInDate: existing.createdAt,
        note: parsed.data.note,
        portalUrl: `${SITE_URL}/check-ins`,
      }),
    }).catch(() => {
      // Email failure is non-fatal — the note was saved successfully
    })
  }

  return NextResponse.json({ success: true, data: updated })
}
