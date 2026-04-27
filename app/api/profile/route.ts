import { eq } from "drizzle-orm"
import { db } from "@/lib/db"
import { users, profiles } from "@/lib/db/schema"
import { profileSchema } from "@/lib/domain/profile"
import { okData, parseBody, requireAuth, ok } from "@/lib/api"
import { getUserProfile } from "@/lib/db/queries"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const profile = await getUserProfile(session.user.id)

  return okData(profile)
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

  return ok()
}
