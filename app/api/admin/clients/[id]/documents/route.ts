import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"
import { DOCUMENTS_PER_CLIENT_LIMIT } from "@/lib/constants"

const createDocSchema = z.object({
  type: z.enum(["session_note", "assessment", "report"]),
  title: z.string().max(200).optional(),
  content: z.string().min(1).max(10000),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
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
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const { id: clientId } = await params

  const body = await req.json()
  const parsed = createDocSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const { type, content } = parsed.data
  const title =
    parsed.data.title?.trim() ||
    `${type.replace("_", " ")} – ${new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`

  const [doc] = await db
    .insert(documents)
    .values({ userId: clientId, authorId: session.user.id, type, title, content })
    .returning({ id: documents.id })

  return NextResponse.json({ success: true, data: { id: doc.id } }, { status: 201 })
}
