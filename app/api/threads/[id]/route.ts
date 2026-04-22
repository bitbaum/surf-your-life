import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, and, isNull, ne } from "drizzle-orm"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { id } = await params
  const isAdmin = isStaff(session.user.role)

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, id),
    with: {
      client: true,
      messages: {
        with: { sender: true },
        orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
      },
    },
  })

  if (!thread) return Response.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  // Authorization: clients can only see their own threads
  if (!isAdmin && thread.clientId !== session.user.id) {
    return Response.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  // Mark unread messages as read (messages not sent by current user that haven't been read)
  await db
    .update(threadMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(threadMessages.threadId, id),
        isNull(threadMessages.readAt),
        ne(threadMessages.senderId, session.user.id)
      )
    )

  return Response.json({ success: true, data: thread })
}
