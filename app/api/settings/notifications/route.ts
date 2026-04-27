import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { parseBody } from "@/lib/api"

const schema = z.object({ receiveReminders: z.boolean() })

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const result = await parseBody(req, schema)
  if (!result.ok) return result.response

  await db
    .update(profiles)
    .set({ receiveReminders: result.data.receiveReminders, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  return NextResponse.json({ success: true })
}
