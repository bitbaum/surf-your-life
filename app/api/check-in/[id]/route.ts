import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { eq, and } from "drizzle-orm"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [updated] = await db
    .update(checkIns)
    .set(parsed.data)
    .where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)))
    .returning()

  return NextResponse.json({ success: true, data: updated })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const existing = await db.query.checkIns.findFirst({
    where: eq(checkIns.id, id),
  })
  if (!existing) return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  if (existing.userId !== session.user.id) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  await db
    .delete(checkIns)
    .where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)))

  return NextResponse.json({ success: true })
}
