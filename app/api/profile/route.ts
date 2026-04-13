import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles, users } from "@/lib/db/schema"
import { profileSchema } from "@/lib/domain/profile"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return NextResponse.json({ success: true, data: profile })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const parsed = profileSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 })
  }

  const { name, ...profileData } = parsed.data

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
