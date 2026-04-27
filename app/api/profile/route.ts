import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { profiles, users } from "@/lib/db/schema"
import { profileSchema } from "@/lib/domain/profile"
import { parseBody, requireAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return NextResponse.json({ success: true, data: profile })
}

export async function PUT(req: Request) {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const result = await parseBody(req, profileSchema)
  if (!result.ok) return result.response

  const { name, ...profileData } = result.data

  // Update display name on user record if provided
  if (name !== undefined && name.trim()) {
    await db.update(users).set({ name: name.trim() }).where(eq(users.id, session.user.id))
  }

  await db
    .update(profiles)
    .set({ ...profileData, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id))

  return NextResponse.json({ success: true })
}
