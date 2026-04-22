import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { DOCUMENTS_PER_CLIENT_LIMIT, DOCUMENT_UPLOAD_MAX_CONTENT, DOCUMENT_UPLOAD_MAX_TITLE , API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { embedDocument } from "@/lib/domain/embeddings"

const uploadSchema = z.object({
  title: z.string().max(DOCUMENT_UPLOAD_MAX_TITLE).optional(),
  content: z.string().min(1).max(DOCUMENT_UPLOAD_MAX_CONTENT),
})

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, session.user.id),
    orderBy: [desc(documents.createdAt)],
    limit: DOCUMENTS_PER_CLIENT_LIMIT,
    with: { author: { columns: { name: true } } },
  })

  return NextResponse.json({ success: true, data: docs })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = uploadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { content } = parsed.data
  const title =
    parsed.data.title?.trim() ||
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

  return NextResponse.json({ success: true, data: { id: doc.id } }, { status: 201 })
}
