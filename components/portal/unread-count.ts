import { db } from "@/lib/db"
import { threadMessages, threads } from "@/lib/db/schema"
import { count, isNull, eq, and, ne } from "drizzle-orm"

/** Count unread messages sent TO the client by practitioners in their threads. */
export async function getClientUnreadCount(userId: string): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(threadMessages)
    .innerJoin(threads, eq(threadMessages.threadId, threads.id))
    .where(and(
      eq(threads.clientId, userId),
      ne(threadMessages.senderId, userId),
      isNull(threadMessages.readAt)
    ))
  return result?.value ?? 0
}
