import { z } from "zod"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"
import { STAFF_ROLES } from "@/lib/domain/auth"
import { sendEmail } from "@/lib/email"
import { newMessageEmail } from "@/lib/email/templates"

export const createThreadSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(1).max(5000),
  clientId: z.string().uuid().optional(),
})

export const sendMessageSchema = z.object({
  body: z.string().min(1).max(5000),
})

type NotifyParams = {
  senderName: string | null
  senderEmail: string
  senderIsAdmin: boolean
  clientId: string
  threadId: string
  threadSubject: string | null
  body: string
  baseUrl: string
}

/** Fire-and-forget: email the other party when a message is sent. Never throws. */
export async function notifyMessageParty(params: NotifyParams): Promise<void> {
  const { senderName, senderEmail, senderIsAdmin, clientId, threadId, threadSubject, body, baseUrl } = params
  try {
    if (senderIsAdmin) {
      const client = await db.query.users.findFirst({ where: eq(users.id, clientId) })
      if (!client?.email) return
      await sendEmail({
        to: client.email,
        subject: `New message: ${threadSubject ?? "Message"}`,
        html: newMessageEmail({
          senderName,
          senderEmail,
          body,
          threadSubject,
          replyUrl: `${baseUrl}/messages/${threadId}`,
        }),
      })
    } else {
      const admins = await db
        .select({ email: users.email })
        .from(users)
        .where(inArray(users.role, STAFF_ROLES))
      const emails = admins.map((a) => a.email).filter(Boolean) as string[]
      if (emails.length === 0) return
      await sendEmail({
        to: emails,
        subject: `New message from client: ${threadSubject ?? "Message"}`,
        html: newMessageEmail({
          senderName,
          senderEmail,
          body,
          threadSubject,
          replyUrl: `${baseUrl}/admin/messages/${threadId}`,
        }),
      })
    }
  } catch (err) {
    console.error("[messaging] Failed to send notification email", err)
  }
}
