import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { techniques } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { updateTechniqueSchema } from "@/lib/domain/techniques"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { parseBody } from "@/lib/api"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

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

  if (!updated) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const { id } = await params
  // Soft-delete: mark inactive rather than delete (preserves logs)
  const [updated] = await db
    .update(techniques)
    .set({ isActive: false, updatedAt: new Date() })
    .where(eq(techniques.id, id))
    .returning()

  if (!updated) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  return NextResponse.json({ success: true })
}
