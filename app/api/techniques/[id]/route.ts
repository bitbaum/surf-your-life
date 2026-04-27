import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { updateTechniqueSchema } from "@/lib/domain/techniques"
import { notFound, parseBody, requireStaffAuth } from "@/lib/api"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params
  const result = await parseBody(req, updateTechniqueSchema)
  if (!result.ok) return result.response

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

  if (!updated) return notFound()

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id } = await params
  // Soft-delete: mark inactive rather than delete (preserves logs)
  const [updated] = await db
    .update(techniques)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(techniques.id, id))
    .returning()

  if (!updated) return notFound()

  return NextResponse.json({ success: true })
}
