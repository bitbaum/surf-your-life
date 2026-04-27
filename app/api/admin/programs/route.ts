import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { programs, programEnrollments } from "@/lib/db/schema"
import { desc, count, eq } from "drizzle-orm"
import { createProgramSchema } from "@/lib/domain/program"
import { ADMIN_PROGRAMS_MAX } from "@/lib/constants"
import { created, parseBody, requireStaffAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

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
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

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

  return created({ id: program.id })
}
