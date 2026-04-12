import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { checkInSchema } from "@/lib/domain/profile"
import { eq, and, gte } from "drizzle-orm"

export async function POST(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Prevent duplicate check-ins on the same calendar day
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const existing = await db.query.checkIns.findFirst({
    where: and(
      eq(checkIns.userId, session.user.id),
      gte(checkIns.createdAt, startOfDay)
    ),
  })
  if (existing) {
    return NextResponse.json({ error: "Already checked in today" }, { status: 409 })
  }

  const body = await req.json()
  const parsed = checkInSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 })
  }

  await db.insert(checkIns).values({ ...parsed.data, userId: session.user.id })

  return NextResponse.json({ success: true }, { status: 201 })
}
