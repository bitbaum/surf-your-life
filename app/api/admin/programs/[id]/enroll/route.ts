import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { programs, programEnrollments, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { enrollClientSchema } from "@/lib/domain/program"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { API_ERR_NOT_FOUND } from "@/lib/constants"
import { parseBody, requireStaffAuth } from "@/lib/api"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id: programId } = await params

  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  const result = await parseBody(req, enrollClientSchema)
  if (!result.ok) return result.response

  const client = await db.query.users.findFirst({ where: eq(users.id, result.data.clientId) })
  if (!client || client.role !== CLIENT_ROLE) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  const [enrollment] = await db
    .insert(programEnrollments)
    .values({
      clientId: result.data.clientId,
      programId,
      startDate: result.data.startDate ? new Date(result.data.startDate) : null,
      notes: result.data.notes ?? null,
      status: "active",
    })
    .returning({ id: programEnrollments.id })

  return NextResponse.json({ success: true, data: { id: enrollment.id } }, { status: 201 })
}
