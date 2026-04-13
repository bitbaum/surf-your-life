import { db } from "@/lib/db"
import { threadMessages, users } from "@/lib/db/schema"
import { count, isNull, eq, and } from "drizzle-orm"

export async function getUnreadCount(): Promise<number> {
  const [result] = await db
    .select({ value: count() })
    .from(threadMessages)
    .innerJoin(users, eq(threadMessages.senderId, users.id))
    .where(and(isNull(threadMessages.readAt), eq(users.role, "client")))
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
