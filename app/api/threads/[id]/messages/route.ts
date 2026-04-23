import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { sendMessageSchema, notifyMessageParty } from "@/lib/domain/messaging"
import { SITE_URL, API_ERR_FORBIDDEN, API_ERR_INVALID_INPUT, API_ERR_NOT_FOUND, API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const { id } = await params
  const isAdmin = isStaff(session.user.role)

  const thread = await db.query.threads.findFirst({ where: eq(threads.id, id) })
  if (!thread) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  if (!isAdmin && thread.clientId !== session.user.id) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })

  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.flatten() }, { status: 422 })
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
    baseUrl: SITE_URL,
  })

  return NextResponse.json({ success: true, data: { id: message.id } })
}
