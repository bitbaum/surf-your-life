import { sql, and, eq, isNull, ne, type SQL } from "drizzle-orm";
import { threadMessages, threads, users } from "./schema";
import { CLIENT_ROLE } from "@/lib/domain/auth";
import { db } from "./index";

/**
 * SQL EXISTS fragment: the thread has at least one unread message authored by
 * a client (not staff). Use as a where/having predicate against `threads`.
 *
 * "Unread" from the practitioner's perspective — there's something a client
 * sent that hasn't been read yet, i.e. the thread needs a reply.
 */
export function unreadFromClientExists(): SQL<unknown> {
  return sql`EXISTS (
    SELECT 1 FROM ${threadMessages}
    JOIN ${users} ON ${users.id} = ${threadMessages.senderId}
    WHERE ${threadMessages.threadId} = ${threads.id}
      AND ${threadMessages.readAt} IS NULL
      AND ${users.role} = ${CLIENT_ROLE}
  )`;
}

/**
 * Mark all unread messages in a thread as read for `userId` — skips messages
 * they sent themselves. Called whenever a user opens a thread.
 */
export async function markThreadAsReadFor(threadId: string, userId: string): Promise<void> {
  await db
    .update(threadMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(threadMessages.threadId, threadId),
        isNull(threadMessages.readAt),
        ne(threadMessages.senderId, userId),
      ),
    );
}

/**
 * SQL EXISTS fragment: the thread has at least one unread message NOT
 * authored by `userId`. Use as a where/having predicate against `threads`.
 *
 * "Unread" from the client's perspective — there's something someone else
 * sent (typically a practitioner) that they haven't read yet.
 */
export function unreadFromOthersExists(userId: string): SQL<unknown> {
  return sql`EXISTS (
    SELECT 1 FROM ${threadMessages}
    WHERE ${threadMessages.threadId} = ${threads.id}
      AND ${threadMessages.senderId} != ${userId}
      AND ${threadMessages.readAt} IS NULL
  )`;
}
