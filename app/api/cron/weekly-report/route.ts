/**
 * Cron job: weekly client summary reports
 * Runs every Sunday at 18:00 CET via the self-hosted scheduler (systemd timer on the Hetzner box).
 * Sends each client a summary of their week: check-ins, avg energy, PEM episodes, wins.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns, profiles } from "@/lib/db/schema"
import { eq, and, gte, inArray, isNotNull, desc } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { weeklyReportEmail } from "@/lib/email/templates"
import { SITE_URL, SEVEN_DAYS_MS, CLINICAL_TEXT_EXCERPT_MAX } from "@/lib/constants"
import { roundOne, groupBy } from "@/lib/utils"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { verifyCronAuth } from "@/lib/auth/cron"
import { summariseCheckIns } from "@/lib/domain/check-in"

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

  const allClients = await db.query.users.findMany({
    where: eq(users.role, CLIENT_ROLE),
    columns: { id: true, name: true, email: true },
  })

  if (allClients.length === 0) return NextResponse.json({ success: true, sent: 0 })

  const clientIds = allClients.map((c) => c.id)

  // Respect opt-out preference — same pattern as daily reminder cron.
  const profilePrefs = await db
    .select({ userId: profiles.userId, receiveReminders: profiles.receiveReminders })
    .from(profiles)
    .where(inArray(profiles.userId, clientIds))
  const optedOut = new Set(profilePrefs.filter((p) => !p.receiveReminders).map((p) => p.userId))
  const eligibleClients = allClients.filter((c) => !optedOut.has(c.id))

  if (eligibleClients.length === 0) return NextResponse.json({ success: true, sent: 0, skipped: allClients.length })

  // Batch: most recent stored AI insight per client (from any previous digest run)
  const allInsightRows = await db.query.checkIns.findMany({
    where: and(inArray(checkIns.userId, eligibleClients.map((c) => c.id)), isNotNull(checkIns.aiInsight)),
    columns: { userId: true, aiInsight: true },
    orderBy: [desc(checkIns.createdAt)],
  })
  const latestInsightByClient = new Map<string, string>()
  for (const ci of allInsightRows) {
    if (!latestInsightByClient.has(ci.userId)) {
      latestInsightByClient.set(ci.userId, ci.aiInsight!)
    }
  }

  // Batch: fetch all check-ins for all clients in the last 7 days (one query instead of N)
  const allWeekCheckIns = await db.query.checkIns.findMany({
    where: and(
      inArray(checkIns.userId, eligibleClients.map((c) => c.id)),
      gte(checkIns.createdAt, sevenDaysAgo)
    ),
    columns: { userId: true, energyLevel: true, mood: true, pemFlag: true, journalEntry: true, sleepHours: true, stressLevel: true },
  })

  const checkInsByClient = groupBy(allWeekCheckIns, (ci) => ci.userId)

  let sent = 0

  for (const client of eligibleClients) {
    const weekCheckIns = checkInsByClient.get(client.id) ?? []

    if (weekCheckIns.length === 0) continue // skip clients with no check-ins this week

    const stats = summariseCheckIns(weekCheckIns)!
    const avgEnergy = Math.round(stats.avgEnergy)
    const avgMood = stats.avgMood
    const avgSleep = stats.avgSleep != null ? roundOne(stats.avgSleep) : null
    const avgStress = stats.avgStress != null ? roundOne(stats.avgStress) : null
    const pemEpisodes = stats.pemCount
    const rawJournal = weekCheckIns.find((ci) => ci.journalEntry)?.journalEntry ?? null
    const topWin = rawJournal && rawJournal.length > CLINICAL_TEXT_EXCERPT_MAX ? rawJournal.slice(0, CLINICAL_TEXT_EXCERPT_MAX - 3) + "…" : rawJournal

    const now = new Date()
    const weekStart = new Date(Date.now() - SEVEN_DAYS_MS)
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })

    await sendEmail({
      to: client.email,
      subject: `Your week in review — ${fmt(weekStart)} to ${fmt(now)}`,
      html: weeklyReportEmail({
        clientName: client.name,
        weekStart: fmt(weekStart),
        weekEnd: fmt(now),
        checkInCount: weekCheckIns.length,
        avgEnergy,
        avgMood,
        avgSleep,
        avgStress,
        pemEpisodes,
        topWin,
        aiInsight: latestInsightByClient.get(client.id) ?? null,
        portalUrl: SITE_URL,
      }),
    }).catch(() => {})

    sent++
  }

  return NextResponse.json({ success: true, sent })
}
