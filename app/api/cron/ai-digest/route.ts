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
import { STAFF_ROLES, CLIENT_ROLE } from "@/lib/domain/auth"
import { SEVEN_DAYS_MS, SITE_URL, AI_DIGEST_MIN_CHECKINS, API_ERR_UNAUTHORIZED } from "@/lib/constants"
import { summariseCheckIns } from "@/lib/domain/check-in"
import { callClaude } from "@/lib/domain/anthropic"
import { sendEmail } from "@/lib/email"
import { practitionerWeeklyDigestEmail, type PractitionerDigestClientRow } from "@/lib/email/templates"


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

  return callClaude({ messages: [{ role: "user", content: prompt }], maxTokens: 300 })
}

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

  if (allClients.length === 0) {
    return NextResponse.json({ success: true, processed: 0, skipped: 0, emailedPractitioners: false })
  }

  const clientIds = allClients.map((c) => c.id)

  // Batch: all check-ins for all clients this week (one query instead of N)
  const allWeekCheckIns = await db.query.checkIns.findMany({
    where: and(inArray(checkIns.userId, clientIds), gte(checkIns.createdAt, sevenDaysAgo)),
    columns: {
      userId: true,
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

  // Batch: unresolved alert counts per client this week (one query instead of N)
  const alertCountRows = await db
    .select({ clientId: clientAlerts.clientId, count: count() })
    .from(clientAlerts)
    .where(and(
      inArray(clientAlerts.clientId, clientIds),
      eq(clientAlerts.isResolved, false),
      gte(clientAlerts.createdAt, sevenDaysAgo)
    ))
    .groupBy(clientAlerts.clientId)
  const alertCountMap = new Map(alertCountRows.map((r) => [r.clientId, r.count]))

  // Group check-ins by client — order preserved newest-first per client
  const checkInsByClient = new Map<string, typeof allWeekCheckIns>()
  for (const ci of allWeekCheckIns) {
    if (!checkInsByClient.has(ci.userId)) checkInsByClient.set(ci.userId, [])
    checkInsByClient.get(ci.userId)!.push(ci)
  }

  let processed = 0
  let skipped = 0
  const digestRows: PractitionerDigestClientRow[] = []

  for (const client of allClients) {
    const weekCheckIns = checkInsByClient.get(client.id) ?? []

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
    const stats = summariseCheckIns(weekCheckIns)!
    const avgEnergy = Math.round(stats.avgEnergy * 10) / 10
    const avgMood = stats.avgMood
    const pemEpisodes = stats.pemCount

    digestRows.push({
      name: client.name ?? client.email,
      email: client.email,
      checkInCount: weekCheckIns.length,
      avgEnergy,
      avgMood,
      pemEpisodes,
      alertCount: alertCountMap.get(client.id) ?? 0,
      aiNarrative: digest,
    })
  }

  // Send weekly digest to all practitioners and admins
  if (digestRows.length > 0) {
    const practitioners = await db
      .select({ email: users.email })
      .from(users)
      .where(inArray(users.role, STAFF_ROLES))

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
