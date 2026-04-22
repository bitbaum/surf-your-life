import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { formatEnumValue } from "@/lib/utils"
import { db } from "@/lib/db"
import { documents, documentTypeEnum } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { DOCUMENTS_PER_CLIENT_LIMIT , API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { embedDocument } from "@/lib/domain/embeddings"

const createDocSchema = z.object({
  type: z.enum(documentTypeEnum.enumValues),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

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
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id: clientId } = await params

  const body = await req.json()
  const parsed = createDocSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const { type, content } = parsed.data
  const title =
    parsed.data.title?.trim() ||
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
