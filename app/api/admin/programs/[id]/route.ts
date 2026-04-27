import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { programs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createProgramSchema } from "@/lib/domain/program"
import { ADMIN_ROLE } from "@/lib/domain/auth"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { id } = await params

  const existing = await db.query.programs.findFirst({ where: eq(programs.id, id) })
  if (!existing) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  const result = await parseBody(req, createProgramSchema)
  if (!result.ok) return result.response

  await db
    .update(programs)
    .set({
      title: result.data.title,
      description: result.data.description ?? null,
      durationWeeks: result.data.durationWeeks ?? null,
      targetConcern: result.data.targetConcern ?? null,
      isTemplate: result.data.isTemplate ?? false,
      phaseConfig: result.data.phaseConfig ?? null,
      updatedAt: new Date(),
    })
    .where(eq(programs.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult
  if (session.user.role !== ADMIN_ROLE) return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })

  const { id } = await params

  await db.delete(programs).where(eq(programs.id, id))

  return NextResponse.json({ success: true })
}
