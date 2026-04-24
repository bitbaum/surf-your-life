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
import { roundOne } from "@/lib/utils"
import { summariseCheckIns } from "@/lib/domain/check-in"
import { generateWeeklyDigest } from "@/lib/domain/digest"
import { sendEmail } from "@/lib/email"
import { practitionerWeeklyDigestEmail, type PractitionerDigestClientRow } from "@/lib/email/templates"

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
  let failed = 0
  const digestRows: PractitionerDigestClientRow[] = []

  for (const client of allClients) {
    const weekCheckIns = checkInsByClient.get(client.id) ?? []

    if (weekCheckIns.length < AI_DIGEST_MIN_CHECKINS) {
      skipped++
      continue
    }

    const digest = await generateWeeklyDigest(client.name ?? "Client", weekCheckIns)
    if (!digest) {
      skipped++
      continue
    }

    // Store on the most recent check-in — count only on success
    const mostRecentId = weekCheckIns[0].id
    try {
      await db
        .update(checkIns)
        .set({ aiInsight: digest })
        .where(eq(checkIns.id, mostRecentId))
    } catch (err) {
      console.error("[ai-digest] DB write failed for client", client.id, err)
      failed++
      continue
    }

    processed++

    // Collect stats for the practitioner digest email
    const stats = summariseCheckIns(weekCheckIns)!
    const avgEnergy = roundOne(stats.avgEnergy)
    const avgMood = stats.avgMood
    const avgSleep = stats.avgSleep != null ? roundOne(stats.avgSleep) : null
    const avgStress = stats.avgStress != null ? roundOne(stats.avgStress) : null
    const pemEpisodes = stats.pemCount

    digestRows.push({
      name: client.name ?? client.email,
      email: client.email,
      checkInCount: weekCheckIns.length,
      avgEnergy,
      avgMood,
      avgSleep,
      avgStress,
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

  return NextResponse.json({ success: true, processed, skipped, ...(failed > 0 && { failed }), emailedPractitioners: digestRows.length > 0 })
}
