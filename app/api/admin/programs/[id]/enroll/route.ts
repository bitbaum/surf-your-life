import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { programs, programEnrollments, users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { enrollClientSchema } from "@/lib/domain/program"
import { isStaff } from "@/lib/domain/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const { id: programId } = await params

  const program = await db.query.programs.findFirst({ where: eq(programs.id, programId) })
  if (!program) {
    return NextResponse.json({ success: false, error: "Program not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = enrollClientSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const client = await db.query.users.findFirst({ where: eq(users.id, parsed.data.clientId) })
  if (!client || client.role !== "client") {
    return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
  }

  const [enrollment] = await db
    .insert(programEnrollments)
    .values({
      clientId: parsed.data.clientId,
      programId,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : null,
      notes: parsed.data.notes ?? null,
      status: "active",
    })
    .returning({ id: programEnrollments.id })

  return NextResponse.json({ success: true, data: { id: enrollment.id } }, { status: 201 })
}
