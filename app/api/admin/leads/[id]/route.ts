import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { leads, leadStatusEnum } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { parseBody } from "@/lib/api"

const patchSchema = z.object({
  status: z.enum(leadStatusEnum.enumValues),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const { id } = await params

  const result = await parseBody(req, patchSchema)
  if (!result.ok) return result.response

  const [updated] = await db
    .update(leads)
    .set({ status: result.data.status })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status })

  if (!updated) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: updated })
}
