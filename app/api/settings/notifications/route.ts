import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { API_ERR_INVALID_INPUT, API_ERR_UNAUTHORIZED } from "@/lib/constants"

const schema = z.object({ receiveReminders: z.boolean() })

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: API_ERR_INVALID_INPUT }, { status: 400 })
  }

  await db
    .update(profiles)
    .set({ receiveReminders: parsed.data.receiveReminders, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  return NextResponse.json({ success: true })
}
