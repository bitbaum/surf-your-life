import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { clientAlerts } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND } from "@/lib/constants"

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const now = new Date()
  const result = await db
    .update(clientAlerts)
    .set({ isResolved: true, resolvedAt: now })
    .where(and(eq(clientAlerts.id, id), eq(clientAlerts.isResolved, false)))
    .returning({ id: clientAlerts.id })

  if (result.length === 0) {
    return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
