import { NextResponse } from "next/server"
import { z } from "zod"
import { ADMIN_ROLE } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import type { InferSelectModel } from "drizzle-orm"
import { eq } from "drizzle-orm"
import { FIELD_MAX_TITLE } from "@/lib/constants"
import { forbidden, notFound, parseBody, requireStaffAuth } from "@/lib/api"

const patchSchema = z.object({
  title: z.string().min(1).max(FIELD_MAX_TITLE).optional(),
  content: z.string().min(1).optional(),
})

type Doc = InferSelectModel<typeof documents>

function verifyDocumentAccess(doc: Doc, userId: string, role: string): NextResponse | null {
  if (doc.authorId !== userId && role !== ADMIN_ROLE) {
    return forbidden()
  }
  return null
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { id } = await params
  const result = await parseBody(req, patchSchema)
  if (!result.ok) return result.response

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) return notFound()

  const accessError = verifyDocumentAccess(doc, session.user.id, session.user.role)
  if (accessError) return accessError

  const updated = await db
    .update(documents)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(documents.id, id))
    .returning()

  return NextResponse.json({ success: true, data: updated[0] })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { id } = await params

  const doc = await db.query.documents.findFirst({ where: eq(documents.id, id) })
  if (!doc) return notFound()

  const accessError = verifyDocumentAccess(doc, session.user.id, session.user.role)
  if (accessError) return accessError

  await db.delete(documents).where(eq(documents.id, id))

  return NextResponse.json({ success: true })
}
