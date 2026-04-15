/**
 * Cron job: weekly client summary reports
 * Runs every Sunday at 18:00 CET via Vercel cron.
 * Sends each client a summary of their week: check-ins, avg energy, PEM episodes, wins.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { sendEmail } from "@/lib/email"
import { weeklyReportEmail } from "@/lib/email/templates"
import { SITE_URL, SEVEN_DAYS_MS, MOOD_SCORE, MOODS } from "@/lib/constants"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)

  const allClients = await db.query.users.findMany({
    where: eq(users.role, "client"),
    columns: { id: true, name: true, email: true },
  })

  let sent = 0

  for (const client of allClients) {
    const weekCheckIns = await db.query.checkIns.findMany({
      where: and(
        eq(checkIns.userId, client.id),
        gte(checkIns.createdAt, sevenDaysAgo)
      ),
      columns: {
        energyLevel: true, mood: true, pemFlag: true, wins: true, createdAt: true,
      },
    })

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
