import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { techniqueAssignments } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { createAssignmentSchema } from "@/lib/domain/techniques"
import { API_ERR_FORBIDDEN, API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get("clientId")

  // Practitioners can query any client; clients can only query themselves
  const targetId =
    isStaff(session.user.role)
      ? (clientId ?? session.user.id)
      : session.user.id

  const rows = await db.query.techniqueAssignments.findMany({
    where: and(
      eq(techniqueAssignments.clientId, targetId),
      eq(techniqueAssignments.isActive, true)
    ),
    with: { technique: true },
    orderBy: (a, { asc }) => [asc(a.createdAt)],
  })

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  if (!isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const body = await req.json()
  const result = createAssignmentSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error.flatten() }, { status: 400 })
  }

  const [assignment] = await db
    .insert(techniqueAssignments)
    .values({
      ...result.data,
      endDate: result.data.endDate ?? null,
      notes: result.data.notes ?? null,
      assignedBy: session.user.id,
    })
    .returning()

  return NextResponse.json({ success: true, data: assignment }, { status: 201 })
}
