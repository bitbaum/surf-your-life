import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { isStaff, ADMIN_ROLE } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED, API_ERR_INVALID_INPUT, FIELD_MAX_TITLE } from "@/lib/constants"

const patchSchema = z.object({
  title: z.string().min(1).max(FIELD_MAX_TITLE).optional(),
  content: z.string().min(1).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  // Only the author or an admin can edit
  if (doc.authorId !== session.user.id && session.user.role !== ADMIN_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const updated = await db
    .update(documents)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(documents.id, id))
    .returning()

  return NextResponse.json({ success: true, data: updated[0] })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id } = await params

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  // Only the author or an admin can delete
  if (doc.authorId !== session.user.id && session.user.role !== ADMIN_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  await db.delete(documents).where(eq(documents.id, id))

  return NextResponse.json({ success: true })
}
