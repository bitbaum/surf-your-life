import { z } from "zod"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { parseBody, requireAuth, ok } from "@/lib/api"

const schema = z.object({ receiveReminders: z.boolean() })

export async function PATCH(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, schema)
  if (!result.ok) return result.response

  await db
    .update(profiles)
    .set({ receiveReminders: result.data.receiveReminders, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  return ok()
}
