import { db } from "@/lib/db"
import { threadMessages, users, clientAlerts } from "@/lib/db/schema"
import { count, isNull, eq, and } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"

export async function getUnresolvedAlertCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(clientAlerts)
    .where(eq(clientAlerts.isResolved, false))
  return result?.value ?? 0
}

export async function getUnreadCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(threadMessages)
    .innerJoin(users, eq(threadMessages.senderId, users.id))
    .where(and(isNull(threadMessages.readAt), eq(users.role, CLIENT_ROLE)))
  return result?.value ?? 0
}

export async function UnreadCount() {
  const c = await getUnreadCount()
  if (c === 0) return null
  return (
    <span className="ml-auto text-xs bg-teal-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
      {c}
    </span>
  )
}
