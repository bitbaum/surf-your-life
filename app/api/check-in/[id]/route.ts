import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { eq, and } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { embedCheckIn } from "@/lib/domain/embeddings"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const body = await req.json()
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const [updated] = await db
    .update(checkIns)
    .set(parsed.data)
    .where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)))
    .returning()

  // Re-embed after edit so semantic search reflects the updated content
  void embedCheckIn(id)

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  await db
    .delete(checkIns)
    .where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
