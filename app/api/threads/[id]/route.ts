import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, and, isNull, ne } from "drizzle-orm"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === "admin" || session.user.role === "practitioner"

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

  if (!thread) return Response.json({ success: false, error: "Not found" }, { status: 404 })

  // Authorization: clients can only see their own threads
  if (!isAdmin && thread.clientId !== session.user.id) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
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
