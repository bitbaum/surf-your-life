/**
 * Cron job: daily check-in reminders
 * Runs at 19:00 CET every day via Vercel cron.
 * Sends a reminder to each client who hasn't checked in today.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, and, gte, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { checkInReminderEmail } from "@/lib/email/templates"
import { SITE_URL, DAY_MS, STREAK_LOOKBACK_DAYS , API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { generateMissedCheckInAlerts } from "@/lib/domain/alerts"
import { CLIENT_ROLE } from "@/lib/domain/auth"

export async function GET(req: Request) {
  // Vercel cron authentication — only allow requests from Vercel cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  // Get all clients who have NOT checked in today
  const allClients = await db.query.users.findMany({
    where: eq(users.role, CLIENT_ROLE),
    columns: { id: true, name: true, email: true },
  })

  let sent = 0
  let skipped = 0

  for (const client of allClients) {
    const todayCheckIn = await db.query.checkIns.findFirst({
      where: and(
        eq(checkIns.userId, client.id),
        gte(checkIns.createdAt, startOfToday)
      ),
      columns: { id: true },
    })

    if (todayCheckIn) {
      skipped++
      continue
    }

    // Calculate current streak for personalized message
    const recentCheckIns = await db.query.checkIns.findMany({
      where: eq(checkIns.userId, client.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: STREAK_LOOKBACK_DAYS,
      columns: { createdAt: true },
    })

    let streak = 0
    const now = Date.now()
    for (let i = 0; i < recentCheckIns.length; i++) {
      const expectedDay = new Date(now - (i + 1) * DAY_MS)
      expectedDay.setHours(0, 0, 0, 0)
      const ciDay = new Date(recentCheckIns[i].createdAt)
      ciDay.setHours(0, 0, 0, 0)
      if (ciDay.getTime() === expectedDay.getTime()) {
        streak++
      } else {
        break
      }
    }

    await sendEmail({
      to: client.email,
      subject: "Time for your daily check-in",
      html: checkInReminderEmail({
        clientName: client.name,
        portalUrl: SITE_URL,
        currentStreak: streak,
      }),
    }).catch(() => {}) // swallow individual failures

    sent++
  }

  // Generate missed check-in alerts for practitioners (runs daily alongside reminders)
  const missedAlerts = await generateMissedCheckInAlerts()

  return NextResponse.json({ success: true, sent, skipped, missedAlerts })
}
