import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientAlerts } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { CLIENT_ALERTS_HISTORY_LIMIT } from "@/lib/constants"
import { requireStaffAuth } from "@/lib/api"

// GET /api/admin/clients/[id]/alerts — returns resolved alerts for a client (lazy-loaded for history toggle)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const resolved = await db.query.clientAlerts.findMany({
    where: and(eq(clientAlerts.clientId, id), eq(clientAlerts.isResolved, true)),
    orderBy: [desc(clientAlerts.createdAt)],
    limit: CLIENT_ALERTS_HISTORY_LIMIT,
  })

  return NextResponse.json({ success: true, data: resolved })
}
