/**
 * Cron job: daily check-in reminders
 * Runs at 19:00 CET every day via Vercel cron.
 * Sends a reminder to each client who hasn't checked in today.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, and, gte, desc, inArray } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { checkInReminderEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_CHECKIN_REMINDER } from "@/lib/email/subjects"
import { SITE_URL, STREAK_LOOKBACK_DAYS, DAY_MS, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { generateMissedCheckInAlerts } from "@/lib/domain/alerts"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { computeStreak } from "@/lib/domain/check-in"

export async function GET(req: Request) {
  // Vercel cron authentication — only allow requests from Vercel cron
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const allClients = await db.query.users.findMany({
    where: eq(users.role, CLIENT_ROLE),
    columns: { id: true, name: true, email: true },
  })

  if (allClients.length === 0) {
    const missedAlerts = await generateMissedCheckInAlerts()
    return NextResponse.json({ success: true, sent: 0, skipped: 0, missedAlerts })
  }

  const clientIds = allClients.map((c) => c.id)

  // Batch 1: find all clients who already checked in today (one query instead of N)
  const todayCheckIns = await db.query.checkIns.findMany({
    where: and(inArray(checkIns.userId, clientIds), gte(checkIns.createdAt, startOfToday)),
    columns: { userId: true },
  })
  const clientsCheckedInToday = new Set(todayCheckIns.map((ci) => ci.userId))

  const clientsNeedingReminders = allClients.filter((c) => !clientsCheckedInToday.has(c.id))
  const skipped = allClients.length - clientsNeedingReminders.length

  let sent = 0

  if (clientsNeedingReminders.length > 0) {
    // Batch 2: recent check-ins for streak computation — one query for all remaining clients
    const streakCutoff = new Date(Date.now() - STREAK_LOOKBACK_DAYS * DAY_MS)
    const recentCheckInsAll = await db.query.checkIns.findMany({
      where: and(
        inArray(checkIns.userId, clientsNeedingReminders.map((c) => c.id)),
        gte(checkIns.createdAt, streakCutoff)
      ),
      orderBy: [desc(checkIns.createdAt)],
      columns: { userId: true, createdAt: true },
    })

    // Group by userId — order is preserved newest-first per client
    const recentByClient = new Map<string, Date[]>()
    for (const ci of recentCheckInsAll) {
      if (!recentByClient.has(ci.userId)) recentByClient.set(ci.userId, [])
      recentByClient.get(ci.userId)!.push(new Date(ci.createdAt))
    }

    for (const client of clientsNeedingReminders) {
      // computeStreak deduplicates multiple same-day check-ins before counting
      const streak = computeStreak(recentByClient.get(client.id) ?? [])

      await sendEmail({
        to: client.email,
        subject: EMAIL_SUBJECT_CHECKIN_REMINDER,
        html: checkInReminderEmail({
          clientName: client.name,
          portalUrl: SITE_URL,
          currentStreak: streak,
        }),
      }).catch(() => {}) // swallow individual failures

      sent++
    }
  }

  // Generate missed check-in alerts for practitioners (runs daily alongside reminders)
  const missedAlerts = await generateMissedCheckInAlerts()

  return NextResponse.json({ success: true, sent, skipped, missedAlerts })
}
