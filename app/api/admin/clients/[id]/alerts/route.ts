import { db } from "@/lib/db"
import { clientAlerts } from "@/lib/db/schema"
import { eq, and, desc } from "drizzle-orm"
import { CLIENT_ALERTS_HISTORY_LIMIT } from "@/lib/constants"
import { ok, okData, requireStaffAuth } from "@/lib/api"

// PATCH /api/admin/clients/[id]/alerts — bulk-resolve all unresolved alerts for a client
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  await db
    .update(clientAlerts)
    .set({ isResolved: true, resolvedAt: new Date() })
    .where(and(eq(clientAlerts.clientId, id), eq(clientAlerts.isResolved, false)))

  return ok()
}

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

  return okData(resolved)
}
