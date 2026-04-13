import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { createThreadSchema, notifyMessageParty } from "@/lib/domain/messaging"
import { PAGINATION_DEFAULT, SITE_URL } from "@/lib/constants"

export async function GET() {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const isAdmin = session.user.role === "admin" || session.user.role === "practitioner"

  const rows = await db.query.threads.findMany({
    where: isAdmin ? undefined : eq(threads.clientId, session.user.id),
    orderBy: [desc(threads.updatedAt)],
    limit: PAGINATION_DEFAULT,
    with: {
      client: true,
      messages: {
        orderBy: (m, { desc: d }) => [d(m.createdAt)],
        limit: 1,
        with: { sender: true },
      },
    },
  })

  return Response.json({ success: true, data: rows })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) return Response.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return Response.json({ success: false, error: "Invalid body" }, { status: 400 })

  const parsed = createThreadSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ success: false, error: "Validation failed", details: parsed.error.flatten() }, { status: 422 })
  }

  const isAdmin = session.user.role === "admin" || session.user.role === "practitioner"

  let clientId: string
  if (isAdmin) {
    if (!parsed.data.clientId) {
      return Response.json({ success: false, error: "clientId required for admin" }, { status: 422 })
    }
    clientId = parsed.data.clientId
  } else {
    clientId = session.user.id
  }

  const [thread] = await db
    .insert(threads)
    .values({ clientId, subject: parsed.data.subject })
    .returning()

  await db.insert(threadMessages).values({
    threadId: thread.id,
    senderId: session.user.id,
    body: parsed.data.body,
  })

  void notifyMessageParty({
    senderName: session.user.name ?? null,
    senderEmail: session.user.email ?? "",
    senderIsAdmin: isAdmin,
    clientId,
    threadId: thread.id,
    threadSubject: parsed.data.subject,
    body: parsed.data.body,
    baseUrl: SITE_URL,
  })

  return Response.json({ success: true, data: { threadId: thread.id } })
}
