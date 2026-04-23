/**
 * Cron job: weekly client summary reports
 * Runs every Sunday at 18:00 CET via Vercel cron.
 * Sends each client a summary of their week: check-ins, avg energy, PEM episodes, wins.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, and, gte, inArray } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { weeklyReportEmail } from "@/lib/email/templates"
import { SITE_URL, SEVEN_DAYS_MS, MOOD_SCORE, MOODS , API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { CLIENT_ROLE } from "@/lib/domain/auth"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

  const allClients = await db.query.users.findMany({
    where: eq(users.role, CLIENT_ROLE),
    columns: { id: true, name: true, email: true },
  })

  if (allClients.length === 0) return NextResponse.json({ success: true, sent: 0 })

  // Batch: fetch all check-ins for all clients in the last 7 days (one query instead of N)
  const allWeekCheckIns = await db.query.checkIns.findMany({
    where: and(
      inArray(checkIns.userId, allClients.map((c) => c.id)),
      gte(checkIns.createdAt, sevenDaysAgo)
    ),
    columns: { userId: true, energyLevel: true, mood: true, pemFlag: true, wins: true },
  })

  // Group by userId in memory
  const checkInsByClient = new Map<string, typeof allWeekCheckIns>()
  for (const ci of allWeekCheckIns) {
    if (!checkInsByClient.has(ci.userId)) checkInsByClient.set(ci.userId, [])
    checkInsByClient.get(ci.userId)!.push(ci)
  }

  let sent = 0

  for (const client of allClients) {
    const weekCheckIns = checkInsByClient.get(client.id) ?? []

    if (weekCheckIns.length === 0) continue // skip clients with no check-ins this week

    const avgEnergy = Math.round(
      weekCheckIns.reduce((s, ci) => s + ci.energyLevel, 0) / weekCheckIns.length
    )
    const avgMoodScore = Math.round(
      weekCheckIns.reduce((s, ci) => s + (MOOD_SCORE[ci.mood] ?? 3), 0) / weekCheckIns.length
    )
    const avgMood = MOODS.find((m) => MOOD_SCORE[m.value] === avgMoodScore)?.label.toLowerCase() ?? "neutral"
    const pemEpisodes = weekCheckIns.filter((ci) => ci.pemFlag).length
    const topWin = weekCheckIns.find((ci) => ci.wins)?.wins ?? null

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
        pemEpisodes,
        topWin,
        portalUrl: SITE_URL,
      }),
    }).catch(() => {})

    sent++
  }

  return NextResponse.json({ success: true, sent })
}
