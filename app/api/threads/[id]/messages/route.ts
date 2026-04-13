import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendMessageSchema, notifyMessageParty } from "@/lib/domain/messaging"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const isAdmin = session.user.role === "admin" || session.user.role === "practitioner"

  const thread = await db.query.threads.findFirst({ where: eq(threads.id, id) })
  if (!thread) return Response.json({ success: false, error: "Not found" }, { status: 404 })

  if (!isAdmin && thread.clientId !== session.user.id) {
    return Response.json({ success: false, error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ success: false, error: "Invalid body" }, { status: 400 })

  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
  }

  const [message] = await db
    .insert(threadMessages)
    .values({ threadId: id, senderId: session.user.id, body: parsed.data.body })
    .returning()

  await db.update(threads).set({ updatedAt: new Date() }).where(eq(threads.id, id))

  void notifyMessageParty({
    senderName: session.user.name ?? null,
    senderEmail: session.user.email ?? "",
    senderIsAdmin: isAdmin,
    clientId: thread.clientId,
    threadId: id,
    threadSubject: thread.subject,
    body: parsed.data.body,
    baseUrl: process.env.AUTH_URL ?? "https://surf-your-life.ch",
  })

  return Response.json({ success: true, data: { id: message.id } })
}
