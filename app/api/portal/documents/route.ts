import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { DOCUMENTS_PER_CLIENT_LIMIT, DOCUMENT_UPLOAD_MAX_CONTENT, FIELD_MAX_TITLE } from "@/lib/constants"
import { created, okData, parseBody, requireAuth } from "@/lib/api"
import { embedDocument } from "@/lib/domain/embeddings"

const uploadSchema = z.object({
  title: z.string().max(FIELD_MAX_TITLE).optional(),
  content: z.string().min(1).max(DOCUMENT_UPLOAD_MAX_CONTENT),
})

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, session.user.id),
    orderBy: [desc(documents.createdAt)],
    limit: DOCUMENTS_PER_CLIENT_LIMIT,
    with: { author: { columns: { name: true } } },
  })

  return okData(docs)
}

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, uploadSchema)
  if (!result.ok) return result.response

  const { content } = result.data
  const title =
    result.data.title?.trim() ||
    `Upload – ${new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`

  const [doc] = await db
    .insert(documents)
    .values({ userId: session.user.id, authorId: session.user.id, type: "upload", title, content })
    .returning({ id: documents.id })

  void embedDocument(doc.id)

  return created({ id: doc.id })
}
