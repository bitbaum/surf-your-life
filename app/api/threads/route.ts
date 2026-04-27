import { NextResponse } from "next/server"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { createThreadSchema, notifyMessageParty } from "@/lib/domain/messaging"
import { PAGINATION_DEFAULT, SITE_URL, API_ERR_INVALID_INPUT } from "@/lib/constants"
import { requireAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const isAdmin = isStaff(session.user.role)

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

  return NextResponse.json({ success: true, data: rows })
}

export async function POST(request: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })

  const parsed = createThreadSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  const isAdmin = isStaff(session.user.role)

  let clientId: string
  if (isAdmin) {
    if (!parsed.data.clientId) {
      return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
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

  return NextResponse.json({ success: true, data: { threadId: thread.id } })
}
