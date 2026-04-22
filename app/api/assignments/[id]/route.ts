import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { assignments } from "@/lib/db/schema"
import { and, eq } from "drizzle-orm"
import { isStaff } from "@/lib/domain/auth"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id } = await params

  await db
    .update(assignments)
    .set({ active: false })
    .where(and(eq(assignments.id, id), eq(assignments.active, true)))

  return NextResponse.json({ success: true })
}
