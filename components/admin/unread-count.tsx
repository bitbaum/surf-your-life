import { db } from "@/lib/db"
import { threads, clientAlerts, leads } from "@/lib/db/schema"
import { count, eq } from "drizzle-orm"
import { unreadFromClientExists } from "@/lib/db/thread-unread"

export async function getUnresolvedAlertCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(clientAlerts)
    .where(eq(clientAlerts.isResolved, false))
  return result?.value ?? 0
}

/**
 * Count of threads with at least one unread message from a client — i.e. the
 * "needs my reply" inbox. Matches the badge on the /admin/messages "Unread"
 * filter tab so the sidebar number agrees with what the page shows.
 */
export async function getUnreadThreadsCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(threads)
    .where(unreadFromClientExists())
  return result?.value ?? 0
}

export async function getNewLeadsCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(leads)
    .where(eq(leads.status, "new"))
  return result?.value ?? 0
}
