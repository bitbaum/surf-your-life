import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { inviteEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_INVITE } from "@/lib/email/subjects"
import { NextRequest } from "next/server"
import { SITE_URL } from "@/lib/constants"
import { notFound, requireStaffAuth } from "@/lib/api"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { id } = await params
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) })
  if (!lead) {
    return notFound()
  }

  const registerUrl = `${SITE_URL}/register?email=${encodeURIComponent(lead.email)}`

  const practitionerName = session.user.name ?? "Your practitioner"

  await sendEmail({
    to: lead.email,
    subject: EMAIL_SUBJECT_INVITE,
    html: inviteEmail({ name: lead.name, registerUrl, practitionerName }),
  })

  await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, id))

  return Response.json({ success: true })
}
