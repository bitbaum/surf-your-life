import { db } from "@/lib/db"
import { threadMessages, threads } from "@/lib/db/schema"
import { count, eq, and, sql } from "drizzle-orm"

/**
 * Count of the client's threads with at least one unread message NOT sent
 * by them — i.e. the "activity I haven't seen" inbox. Matches the per-row
 * unread dot the portal messages list renders so the sidebar badge agrees
 * with what the page shows. Mirrors the admin-side `getUnreadThreadsCount`.
 */
export async function getClientUnreadThreadsCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(threads)
    .where(and(
      eq(threads.clientId, userId),
      sql`EXISTS (
        SELECT 1 FROM ${threadMessages}
        WHERE ${threadMessages.threadId} = ${threads.id}
          AND ${threadMessages.senderId} != ${userId}
          AND ${threadMessages.readAt} IS NULL
      )`
    ))
  return result?.value ?? 0
}
