/**
 * Cron job: daily check-in reminders
 * Runs at 19:00 CET every day via the self-hosted scheduler (systemd timer on the Hetzner box).
 * Sends a reminder to each client who hasn't checked in today.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns, profiles } from "@/lib/db/schema"
import { eq, and, gte, desc, inArray, sql } from "drizzle-orm"
import { sendEmailSafe } from "@/lib/email"
import { checkInReminderEmail } from "@/lib/email/templates"
import { EMAIL_SUBJECT_CHECKIN_REMINDER } from "@/lib/email/subjects"
import { SITE_URL, STREAK_LOOKBACK_DAYS, DAY_MS, CLINIC_TZ } from "@/lib/constants"
import { generateMissedCheckInAlerts, generateTechniqueAdherenceAlerts } from "@/lib/domain/alerts"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { verifyCronAuth } from "@/lib/auth/cron"
import { computeStreak } from "@/lib/domain/check-in"

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const todayInClinicTz = sql`(${checkIns.createdAt} AT TIME ZONE ${CLINIC_TZ})::date = (NOW() AT TIME ZONE ${CLINIC_TZ})::date`

  const allClients = await db.query.users.findMany({
    where: eq(users.role, CLIENT_ROLE),
    columns: { id: true, name: true, email: true },
  })

  if (allClients.length === 0) {
    const missedAlerts = await generateMissedCheckInAlerts()
    return NextResponse.json({ success: true, sent: 0, skipped: 0, missedAlerts })
  }

  const clientIds = allClients.map((c) => c.id)

  // Batch: fetch reminder preferences — clients without a profile default to opted-in
  const profilePrefs = await db
    .select({ userId: profiles.userId, receiveReminders: profiles.receiveReminders })
    .from(profiles)
    .where(inArray(profiles.userId, clientIds))
  const optedOut = new Set(
    profilePrefs.filter((p) => !p.receiveReminders).map((p) => p.userId)
  )

  // Batch 1: find all clients who already checked in today (one query instead of N)
  const todayCheckIns = await db.query.checkIns.findMany({
    where: and(inArray(checkIns.userId, clientIds), todayInClinicTz),
    columns: { userId: true },
  })
  const clientsCheckedInToday = new Set(todayCheckIns.map((ci) => ci.userId))

  // Skip clients who already checked in OR who have opted out of reminders
  const clientsNeedingReminders = allClients.filter(
    (c) => !clientsCheckedInToday.has(c.id) && !optedOut.has(c.id)
  )
  const skipped = allClients.length - clientsNeedingReminders.length

  let sent = 0
  let failed = 0

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

      const delivered = await sendEmailSafe(
        {
          to: client.email,
          subject: EMAIL_SUBJECT_CHECKIN_REMINDER,
          html: checkInReminderEmail({
            clientName: client.name,
            portalUrl: SITE_URL,
            currentStreak: streak,
          }),
        },
        "cron-reminders"
      )

      // Count deliveries, not attempts — a failed batch must not report success.
      if (delivered) sent++
      else failed++
    }
  }

  // Generate daily alerts (missed check-ins + technique adherence decline)
  const [missedAlerts, techniqueAlerts] = await Promise.all([
    generateMissedCheckInAlerts(),
    generateTechniqueAdherenceAlerts(),
  ])

  return NextResponse.json({ success: true, sent, ...(failed > 0 && { failed }), skipped, missedAlerts, techniqueAlerts })
}
