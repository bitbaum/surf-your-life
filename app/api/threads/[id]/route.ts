import { NextResponse } from "next/server"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { threads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { markThreadAsReadFor } from "@/lib/db/thread-unread"
import { API_ERR_FORBIDDEN, API_ERR_NOT_FOUND } from "@/lib/constants"
import { requireAuth } from "@/lib/api"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

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

  if (!thread) return NextResponse.json({ success: false, error: API_ERR_NOT_FOUND }, { status: 404 })

  // Authorization: clients can only see their own threads
  if (!isAdmin && thread.clientId !== session.user.id) {
    return NextResponse.json({ success: false, error: API_ERR_FORBIDDEN }, { status: 403 })
  }

  await markThreadAsReadFor(id, session.user.id)

  return NextResponse.json({ success: true, data: thread })
}
