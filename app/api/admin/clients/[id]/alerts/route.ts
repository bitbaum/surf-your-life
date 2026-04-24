import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { clientAlerts } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { API_ERR_FORBIDDEN, CLIENT_ALERTS_HISTORY_LIMIT } from "@/lib/constants"

// GET /api/admin/clients/[id]/alerts — returns resolved alerts for a client (lazy-loaded for history toggle)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const resolved = await db.query.clientAlerts.findMany({
    where: and(eq(clientAlerts.clientId, id), eq(clientAlerts.isResolved, true)),
    orderBy: [desc(clientAlerts.createdAt)],
    limit: CLIENT_ALERTS_HISTORY_LIMIT,
  })

  return NextResponse.json({ success: true, data: resolved })
}
