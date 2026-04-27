import { NextResponse } from "next/server"
import { formatEnumValue } from "@/lib/utils"
import { db } from "@/lib/db"
import { documents, documentTypeEnum } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { DOCUMENTS_PER_CLIENT_LIMIT, FIELD_MAX_TITLE, DOCUMENT_ADMIN_MAX_CONTENT } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"
import { embedDocument } from "@/lib/domain/embeddings"

const createDocSchema = z.object({
  type: z.enum(documentTypeEnum.enumValues),
  title: z.string().max(FIELD_MAX_TITLE).optional(),
  content: z.string().min(1).max(DOCUMENT_ADMIN_MAX_CONTENT),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id: clientId } = await params

  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, clientId),
    orderBy: [desc(documents.createdAt)],
    limit: DOCUMENTS_PER_CLIENT_LIMIT,
    with: { author: { columns: { name: true } } },
  })

  return NextResponse.json({ success: true, data: docs })
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { id: clientId } = await params

  const result = await parseBody(req, createDocSchema)
  if (!result.ok) return result.response

  const { type, content } = result.data
  const title =
    result.data.title?.trim() ||
    `${formatEnumValue(type)} – ${new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`

  const [doc] = await db
    .insert(documents)
    .values({ userId: clientId, authorId: session.user.id, type, title, content })
    .returning({ id: documents.id })

  void embedDocument(doc.id)

  return NextResponse.json({ success: true, data: { id: doc.id } }, { status: 201 })
}
