import { db } from "@/lib/db"
import { threadMessages, threads, users, clientAlerts, leads } from "@/lib/db/schema"
import { count, eq, sql } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"

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
    .where(sql`EXISTS (
      SELECT 1 FROM ${threadMessages}
      JOIN ${users} ON ${users.id} = ${threadMessages.senderId}
      WHERE ${threadMessages.threadId} = ${threads.id}
        AND ${threadMessages.readAt} IS NULL
        AND ${users.role} = ${CLIENT_ROLE}
    )`)
  return result?.value ?? 0
}

export async function getNewLeadsCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(leads)
    .where(eq(leads.status, "new"))
  return result?.value ?? 0
}
