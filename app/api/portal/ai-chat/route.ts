import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { aiMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { generateAiReply } from "@/lib/domain/ai-chat"
import { AI_CHAT_HISTORY_LIMIT, AI_CHAT_DISPLAY_LIMIT, AI_CHAT_MAX_LENGTH, API_ERR_SERVER_ERROR } from "@/lib/constants"
import { okData, parseBody, requireAuth } from "@/lib/api"
import { z } from "zod"

const messageSchema = z.object({
  content: z.string().min(1).max(AI_CHAT_MAX_LENGTH),
})

export async function GET(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") ?? String(AI_CHAT_DISPLAY_LIMIT)), AI_CHAT_DISPLAY_LIMIT)

  try {
    const messages = await db.query.aiMessages.findMany({
      where: eq(aiMessages.userId, session.user.id),
      orderBy: [desc(aiMessages.createdAt)],
      limit,
      columns: { id: true, role: true, content: true, createdAt: true },
    })
    return okData(messages.reverse())
  } catch (err) {
    console.error("[ai-chat GET]", err)
    return NextResponse.json({ success: false, error: API_ERR_SERVER_ERROR }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, messageSchema)
  if (!result.ok) return result.response

  try {
    // Save user message
    await db.insert(aiMessages).values({
      userId: session.user.id,
      role: "user",
      content: result.data.content,
    })

    // Fetch recent history for context
    const history = await db.query.aiMessages.findMany({
      where: eq(aiMessages.userId, session.user.id),
      orderBy: [desc(aiMessages.createdAt)],
      limit: AI_CHAT_HISTORY_LIMIT,
      columns: { role: true, content: true },
    })
    const historyAsc = history.reverse().slice(0, -1) // exclude the message we just inserted

    // Generate reply
    const reply = await generateAiReply(
      session.user.id,
      result.data.content,
      historyAsc
    )

    // Save assistant reply
    const [saved] = await db
      .insert(aiMessages)
      .values({
        userId: session.user.id,
        role: "assistant",
        content: reply,
      })
      .returning({ id: aiMessages.id, content: aiMessages.content, createdAt: aiMessages.createdAt })

    return okData({ id: saved.id, content: saved.content, createdAt: saved.createdAt })
  } catch (err) {
    console.error("[ai-chat POST]", err)
    return NextResponse.json({ success: false, error: API_ERR_SERVER_ERROR }, { status: 500 })
  }
}
