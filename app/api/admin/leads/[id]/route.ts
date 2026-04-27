import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { leads, leadStatusEnum } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { notFound, parseBody, requireStaffAuth } from "@/lib/api"

const patchSchema = z.object({
  status: z.enum(leadStatusEnum.enumValues),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  const result = await parseBody(req, patchSchema)
  if (!result.ok) return result.response

  const [updated] = await db
    .update(leads)
    .set({ status: result.data.status })
    .where(eq(leads.id, id))
    .returning({ id: leads.id, status: leads.status })

  if (!updated) {
    return notFound()
  }

  return NextResponse.json({ success: true, data: updated })
}
