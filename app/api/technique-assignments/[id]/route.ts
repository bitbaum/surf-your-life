import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { techniqueAssignments } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "admin" && session.user.role !== "practitioner") {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const [updated] = await db
    .update(techniqueAssignments)
    .set({ isActive: false })
    .where(eq(techniqueAssignments.id, id))
    .returning()

  if (!updated) return Response.json({ success: false, error: "Not found" }, { status: 404 })

  return Response.json({ success: true })
}
