import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, users } from "@/lib/db/schema"
import { profileSchema } from "@/lib/domain/profile"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { parseBody } from "@/lib/api"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return NextResponse.json({ success: true, data: profile })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })

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
