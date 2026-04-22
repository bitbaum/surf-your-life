import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { leads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { inviteEmail } from "@/lib/email/templates"
import { NextRequest, NextResponse } from "next/server"
import { SITE_URL, BRAND_NAME , API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id } = await params
  const lead = await db.query.leads.findFirst({ where: eq(leads.id, id) })
  if (!lead) {
    return NextResponse.json({ success: false, error: "Lead not found" }, { status: 404 })
  }

  const registerUrl = `${SITE_URL}/register?email=${encodeURIComponent(lead.email)}`

  const practitionerName = session.user.name ?? "Your practitioner"

  await sendEmail({
    to: lead.email,
    subject: `Your invitation to ${BRAND_NAME}`,
    html: inviteEmail({ name: lead.name, registerUrl, practitionerName }),
  })

  await db.update(leads).set({ status: "contacted" }).where(eq(leads.id, id))

  return NextResponse.json({ success: true })
}
