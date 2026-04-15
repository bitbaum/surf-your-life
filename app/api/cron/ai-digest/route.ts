/**
 * Cron job: AI-powered weekly client digests for practitioners.
 * Runs every Sunday at 19:00 CET (after weekly-report at 17:00).
 * For each client with ≥3 check-ins in the past 7 days, generates an AI
 * narrative summary and stores it in the most recent check-in's aiInsight field.
 * Gracefully degrades when ANTHROPIC_API_KEY is absent.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { users, checkIns, clientAlerts } from "@/lib/db/schema"
import { eq, and, gte, desc, inArray, count } from "drizzle-orm"
import { SEVEN_DAYS_MS, SITE_URL } from "@/lib/constants"
import { sendEmail } from "@/lib/email"
import { practitionerWeeklyDigestEmail, type PractitionerDigestClientRow } from "@/lib/email/templates"

// Maps mood enum values to numeric scores (for averaging) and back to labels
const MOOD_NUM: Record<string, number> = {
  very_low: 1,
  low: 2,
  neutral: 3,
  good: 4,
  excellent: 5,
}
const MOOD_LABEL: Record<number, string> = {
  1: "very low",
  2: "low",
  3: "neutral",
  4: "good",
  5: "excellent",
}

const AI_DIGEST_MIN_CHECKINS = 3

async function generateDigest(clientName: string, rows: {
  createdAt: Date
  mood: string | null
  energyLevel: number | null
  sleepHours: number | null
  activityLevel: string | null
  pemFlag: boolean | null
  pemSeverity: number | null
  symptomFatigue: number | null
  symptomBrainFog: number | null
  symptomPain: number | null
  stressLevel: number | null
  sleepQuality: number | null
  orthostaticSymptoms: boolean | null
  journalEntry: string | null
  wins: string | null
  challenges: string | null
  notes: string | null
}[]): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const summary = rows.map((r, i) => {
    const parts = [`Day ${i + 1} (${r.createdAt.toLocaleDateString("en-GB")})`]
    if (r.mood) parts.push(`mood=${r.mood}`)
    if (r.energyLevel != null) parts.push(`energy=${r.energyLevel}/10`)
    if (r.sleepHours != null) parts.push(`sleep=${r.sleepHours}h`)
    if (r.activityLevel) parts.push(`activity=${r.activityLevel}`)
    if (r.pemFlag) parts.push(`PEM=yes${r.pemSeverity != null ? `(${r.pemSeverity}/10)` : ""}`)
    if (r.symptomFatigue != null) parts.push(`fatigue=${r.symptomFatigue}/10`)
    if (r.symptomBrainFog != null) parts.push(`brain_fog=${r.symptomBrainFog}/10`)
    if (r.symptomPain != null) parts.push(`pain=${r.symptomPain}/10`)
    if (r.sleepQuality != null) parts.push(`sleep_quality=${r.sleepQuality}/5`)
    if (r.orthostaticSymptoms) parts.push("orthostatic=yes")
    if (r.stressLevel != null) parts.push(`stress=${r.stressLevel}/10`)
    if (r.wins) parts.push(`wins: ${r.wins}`)
    if (r.challenges) parts.push(`challenges: ${r.challenges}`)
    if (r.notes) parts.push(`notes: ${r.notes}`)
    return parts.join(", ")
  }).join("\n")

  const prompt = `You are a clinical assistant helping a practitioner understand a client's weekly health data.

Client: ${clientName}
Check-ins this week (${rows.length} entries):
${summary}

Write a concise clinical narrative (3-5 sentences) summarising:
1. Overall trend (improving, declining, or stable)
2. Key symptoms or concerns to discuss
3. Notable wins or positive signals

Be factual, empathetic, and clinically precise. No bullet points — flowing prose only.`

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text ?? null
  } catch {
    return null
  }
}

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

  let processed = 0
  let skipped = 0
  const digestRows: PractitionerDigestClientRow[] = []

  for (const client of allClients) {
    const weekCheckIns = await db.query.checkIns.findMany({
      where: and(
        eq(checkIns.userId, client.id),
        gte(checkIns.createdAt, sevenDaysAgo)
      ),
      columns: {
        id: true,
        createdAt: true,
        mood: true,
        energyLevel: true,
        sleepHours: true,
        sleepQuality: true,
        activityLevel: true,
        pemFlag: true,
        pemSeverity: true,
        orthostaticSymptoms: true,
        symptomFatigue: true,
        symptomBrainFog: true,
        symptomPain: true,
        stressLevel: true,
        journalEntry: true,
        wins: true,
        challenges: true,
        notes: true,
      },
      orderBy: [desc(checkIns.createdAt)],
    })

    if (weekCheckIns.length < AI_DIGEST_MIN_CHECKINS) {
      skipped++
      continue
    }

    const digest = await generateDigest(client.name ?? "Client", weekCheckIns)
    if (!digest) {
      skipped++
      continue
    }

    // Store on the most recent check-in
    const mostRecentId = weekCheckIns[0].id
    await db
      .update(checkIns)
      .set({ aiInsight: digest })
      .where(eq(checkIns.id, mostRecentId))
      .catch(() => {})

    processed++

    // Collect stats for the practitioner digest email
    const energyValues = weekCheckIns
      .map((r) => r.energyLevel)
      .filter((v): v is number => v != null)
    const avgEnergy = energyValues.length > 0
      ? Math.round((energyValues.reduce((a, b) => a + b, 0) / energyValues.length) * 10) / 10
      : 0

    const moodValues = weekCheckIns
      .map((r) => r.mood ? (MOOD_NUM[r.mood] ?? null) : null)
      .filter((v): v is number => v != null)
    const avgMoodNum = moodValues.length > 0
      ? Math.round(moodValues.reduce((a, b) => a + b, 0) / moodValues.length)
      : 3
    const avgMood = MOOD_LABEL[avgMoodNum] ?? "neutral"

    const pemEpisodes = weekCheckIns.filter((r) => r.pemFlag === true).length

    const alertResult = await db.select({ count: count() })
      .from(clientAlerts)
      .where(and(
        eq(clientAlerts.clientId, client.id),
        eq(clientAlerts.isResolved, false),
        gte(clientAlerts.createdAt, sevenDaysAgo)
      ))
    const clientAlertCount = alertResult[0]?.count ?? 0

    digestRows.push({
      name: client.name ?? client.email,
      email: client.email,
      checkInCount: weekCheckIns.length,
      avgEnergy,
      avgMood,
      pemEpisodes,
      alertCount: clientAlertCount,
      aiNarrative: digest,
    })
  }

  // Send weekly digest to all practitioners and admins
  if (digestRows.length > 0) {
    const practitioners = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.role, ["admin", "practitioner"]))

    if (practitioners.length > 0) {
      const weekEnd = new Date()
      const weekStart = new Date(weekEnd.getTime() - SEVEN_DAYS_MS)
      const fmt = (d: Date) =>
        d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

      const html = practitionerWeeklyDigestEmail({
        weekStart: fmt(weekStart),
        weekEnd: fmt(weekEnd),
        clients: digestRows,
        adminUrl: `${SITE_URL}/admin/clients`,
      })

      await Promise.all(
        practitioners.map((p) =>
          sendEmail({
            to: p.email,
            subject: `Weekly client overview – ${fmt(weekStart)} to ${fmt(weekEnd)}`,
            html,
          }).catch(() => {})
        )
      )
    }
  }

  return NextResponse.json({ success: true, processed, skipped, emailedPractitioners: digestRows.length > 0 })
}
