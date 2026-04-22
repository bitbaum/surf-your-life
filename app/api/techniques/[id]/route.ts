import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { updateTechniqueSchema } from "@/lib/domain/techniques"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const result = updateTechniqueSchema.safeParse(body)
  if (!result.success) {
    return Response.json({ success: false, error: result.error.flatten() }, { status: 400 })
  }

  const { resourceUrl, ...rest } = result.data
  const updates = {
    ...rest,
    ...(resourceUrl !== undefined ? { resourceUrl: resourceUrl || null } : {}),
    updatedAt: new Date(),
  }

  const [updated] = await db
    .update(techniques)
    .set(updates)
    .where(eq(techniques.id, id))
    .returning()

  if (!updated) return Response.json({ success: false, error: "Not found" }, { status: 404 })

  return Response.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params
  // Soft-delete: mark inactive rather than delete (preserves logs)
  const [updated] = await db
    .update(techniques)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(techniques.id, id))
    .returning()

  if (!updated) return Response.json({ success: false, error: "Not found" }, { status: 404 })

  return Response.json({ success: true })
}
