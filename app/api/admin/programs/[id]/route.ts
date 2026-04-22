import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programs } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { createProgramSchema } from "@/lib/domain/program"
import { isStaff, ADMIN_ROLE } from "@/lib/domain/auth"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  const existing = await db.query.programs.findFirst({ where: eq(programs.id, id) })
  if (!existing) {
    return NextResponse.json({ success: false, error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = createProgramSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  await db
    .update(programs)
    .set({
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      durationWeeks: parsed.data.durationWeeks ?? null,
      targetConcern: parsed.data.targetConcern ?? null,
      isTemplate: parsed.data.isTemplate ?? false,
      phaseConfig: parsed.data.phaseConfig ?? null,
      updatedAt: new Date(),
    })
    .where(eq(programs.id, id))

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== ADMIN_ROLE) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id } = await params

  await db.delete(programs).where(eq(programs.id, id))

  return NextResponse.json({ success: true })
}
