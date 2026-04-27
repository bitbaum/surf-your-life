import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { programEnrollments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { updateEnrollmentSchema } from "@/lib/domain/program"
import { API_ERR_NOT_FOUND } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  const result = await parseBody(req, updateEnrollmentSchema)
  if (!result.ok) return result.response

  const enrollment = await db.query.programEnrollments.findFirst({
    where: eq(programEnrollments.id, id),
  })
  if (!enrollment) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  await db
    .update(programEnrollments)
    .set({
      status: result.data.status,
      ...(result.data.notes !== undefined ? { notes: result.data.notes } : {}),
    })
    .where(eq(programEnrollments.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  await db.delete(programEnrollments).where(eq(programEnrollments.id, id))

  return NextResponse.json({ success: true })
}
