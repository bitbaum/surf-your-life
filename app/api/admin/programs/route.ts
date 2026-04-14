import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programs, programEnrollments } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { createProgramSchema } from "@/lib/domain/program"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "practitioner")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const rows = await db
    .select({
      id: programs.id,
      title: programs.title,
      description: programs.description,
      durationWeeks: programs.durationWeeks,
      targetConcern: programs.targetConcern,
      createdAt: programs.createdAt,
      enrollmentCount: count(programEnrollments.id),
    })
    .from(programs)
    .leftJoin(programEnrollments, eq(programEnrollments.programId, programs.id))
    .groupBy(programs.id)
    .orderBy(desc(programs.createdAt))

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== "admin" && session.user.role !== "practitioner")) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createProgramSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const [program] = await db
    .insert(programs)
    .values({
      title: parsed.data.title,
      description: parsed.data.description,
      durationWeeks: parsed.data.durationWeeks ?? null,
      targetConcern: parsed.data.targetConcern ?? null,
      createdBy: session.user.id,
    })
    .returning({ id: programs.id })

  return NextResponse.json({ success: true, data: { id: program.id } }, { status: 201 })
}
