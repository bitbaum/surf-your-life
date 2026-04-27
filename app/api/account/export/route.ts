import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  users,
  profiles,
  checkIns,
  bookings,
  threads,
  threadMessages,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/api"

export async function GET() {
  const authResult = await requireAuth()
  if (!authResult.ok) return authResult.response
  const { session } = authResult

  const userId = session.user.id

  const [user, profile, userCheckIns, userBookings, userThreads, sentMessages] =
    await Promise.all([
      db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, name: true, email: true, createdAt: true, role: true },
      }),
      db.query.profiles.findFirst({ where: eq(profiles.userId, userId) }),
      db.query.checkIns.findMany({ where: eq(checkIns.userId, userId) }),
      db.query.bookings.findMany({
        where: eq(bookings.userId, userId),
        with: { service: true },
      }),
      db.query.threads.findMany({
        where: eq(threads.clientId, userId),
        with: { messages: true },
      }),
      db.query.threadMessages.findMany({
        where: eq(threadMessages.senderId, userId),
      }),
    ])

  const payload = {
    exportedAt: new Date().toISOString(),
    user: {
      name: user?.name ?? null,
      email: user?.email ?? "",
      createdAt: user?.createdAt ?? null,
    },
    profile: profile ?? null,
    checkIns: userCheckIns,
    bookings: userBookings,
    messages: {
      threads: userThreads,
      sent: sentMessages,
    },
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="my-data.json"`,
    },
  })
}
