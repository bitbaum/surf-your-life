import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { techniqueAssignments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return Response.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const { id } = await params

  // Verify the assignment exists before deactivating
  const existing = await db.query.techniqueAssignments.findFirst({
    where: eq(techniqueAssignments.id, id),
  })
  if (!existing) return Response.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  const [updated] = await db
    .update(techniqueAssignments)
    .set({ isActive: false })
    .where(and(eq(techniqueAssignments.id, id), eq(techniqueAssignments.isActive, true)))
    .returning()

  if (!updated) return Response.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  return Response.json({ success: true })
}
