import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programs, programEnrollments } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { createProgramSchema } from "@/lib/domain/program"
import { isStaff } from "@/lib/domain/auth"
import { API_ERR_FORBIDDEN, ADMIN_PROGRAMS_MAX } from "@/lib/constants"
import { parseBody } from "@/lib/api"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
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
    .limit(ADMIN_PROGRAMS_MAX)

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const result = await parseBody(req, createProgramSchema)
  if (!result.ok) return result.response

  const [program] = await db
    .insert(programs)
    .values({
      title: result.data.title,
      description: result.data.description,
      durationWeeks: result.data.durationWeeks ?? null,
      targetConcern: result.data.targetConcern ?? null,
      isTemplate: result.data.isTemplate ?? false,
      phaseConfig: result.data.phaseConfig ?? null,
      createdBy: session.user.id,
    })
    .returning({ id: programs.id })

  return NextResponse.json({ success: true, data: { id: program.id } }, { status: 201 })
}
