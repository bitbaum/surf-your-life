import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { clientAlerts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const result = await db
    .update(clientAlerts)
    .set({ isResolved: true })
    .where(and(eq(clientAlerts.id, id), eq(clientAlerts.isResolved, false)))
    .returning({ id: clientAlerts.id })

  if (result.length === 0) {
    return NextResponse.json({ success: false, error: "Alert not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
