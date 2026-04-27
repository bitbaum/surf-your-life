import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { techniqueAssignments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { API_ERR_NOT_FOUND } from "@/lib/constants"
import { requireStaffAuth } from "@/lib/api"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params

  // Verify the assignment exists before deactivating
  const existing = await db.query.techniqueAssignments.findFirst({
    where: eq(techniqueAssignments.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  const [updated] = await db
    .update(techniqueAssignments)
    .set({ isActive: false })
    .where(and(eq(techniqueAssignments.id, id), eq(techniqueAssignments.isActive, true)))
    .returning()

  if (!updated) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  return NextResponse.json({ success: true })
}
