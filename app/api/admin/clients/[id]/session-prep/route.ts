/**
 * Pre-session AI prep: generates a clinical summary for a practitioner
 * before a session with a specific client.
 * Uses Anthropic API directly (no SDK). Gracefully degrades when key is absent.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { formatEnumValue } from "@/lib/utils"
import { db } from "@/lib/db"
import { users, checkIns, clientAlerts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { callClaude } from "@/lib/domain/anthropic"
import { toDateString } from "@/lib/utils"
import { SESSION_PREP_CHECKIN_LIMIT, SESSION_PREP_ALERTS_LIMIT , API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const { id: clientId } = await params

  const [client, recentCheckIns, activeAlerts] = await Promise.all([
    db.query.users.findFirst({
      where: eq(users.id, clientId),
      with: { profile: true },
      columns: { id: true, name: true, email: true },
    }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, clientId),
      orderBy: [desc(checkIns.createdAt)],
      limit: SESSION_PREP_CHECKIN_LIMIT,
    }),
    db.query.clientAlerts.findMany({
      where: eq(clientAlerts.clientId, clientId),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: SESSION_PREP_ALERTS_LIMIT,
    }),
  ])

  if (!client) {
    return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
  }

  const context = buildClinicalContext(client, recentCheckIns, activeAlerts)

  const aiSummary = await callClaude({
    messages: [
      {
        role: "user",
        content: `You are a clinical assistant helping a burnout/Long COVID practitioner prepare for a session.
Based on the following client data, write a concise pre-session summary (3-5 sentences) covering:
1. Current trend (improving / stable / declining)
2. Key signals to address today
3. One specific recommendation for this session

Client data:
${context}

Write in a professional, clinical tone. Be specific and actionable.`,
      },
    ],
    maxTokens: 600,
  })

  const summary = aiSummary ?? buildRuleBasedSummary(client, recentCheckIns, activeAlerts)
  return NextResponse.json({ success: true, data: { summary, aiGenerated: aiSummary !== null } })
}

function buildClinicalContext(
  client: { name: string | null; profile?: { mainConcern?: string | null; goals?: string | null } | null },
  recentCheckIns: Array<{
    createdAt: Date; mood: string; energyLevel: number; sleepHours: number | null;
    symptomFatigue: number | null; pemFlag: boolean | null; pemSeverity: number | null;
    stressLevel: number | null; activityLevel: string | null;
  }>,
  alerts: Array<{ title: string; severity: string; createdAt: Date }>
): string {
  const lines: string[] = [
    `Client: ${client.name ?? "Unknown"}`,
    `Main concern: ${client.profile?.mainConcern ?? "not specified"}`,
  ]

  if (recentCheckIns.length > 0) {
    lines.push(`\nLast ${recentCheckIns.length} check-ins:`)
    for (const ci of recentCheckIns.slice(0, 7)) {
      const date = toDateString(ci.createdAt)
      const pem = ci.pemFlag ? ` | PEM${ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}` : ""
      const fatigue = ci.symptomFatigue != null ? ` | fatigue ${ci.symptomFatigue}` : ""
      const stress = ci.stressLevel != null ? ` | stress ${ci.stressLevel}` : ""
      lines.push(`  ${date}: mood=${ci.mood}, energy=${ci.energyLevel}/10${fatigue}${stress}${pem}`)
    }
  }

  if (alerts.length > 0) {
    lines.push(`\nActive alerts (${alerts.length}):`)
    for (const alert of alerts) {
      lines.push(`  [${alert.severity.toUpperCase()}] ${alert.title}`)
    }
  }

  return lines.join("\n")
}

function buildRuleBasedSummary(
  client: { name: string | null; profile?: { mainConcern?: string | null } | null },
  recentCheckIns: Array<{ mood: string; energyLevel: number; pemFlag: boolean | null; createdAt: Date }>,
  alerts: Array<{ title: string; severity: string }>
): string {
  if (recentCheckIns.length === 0) {
    return `${client.name ?? "This client"} has no check-ins recorded yet. Consider using the session to onboard them to the portal.`
  }

  const latest = recentCheckIns[0]
  const avgEnergy = Math.round(
    recentCheckIns.slice(0, 5).reduce((s, ci) => s + ci.energyLevel, 0) / Math.min(5, recentCheckIns.length)
  )
  const pemCount = recentCheckIns.filter((ci) => ci.pemFlag).length
  const highAlerts = alerts.filter((a) => a.severity === "high")

  const parts: string[] = [
    `${client.name ?? "Client"}'s latest check-in shows mood "${formatEnumValue(latest.mood)}" and energy ${latest.energyLevel}/10 (5-session average: ${avgEnergy}/10).`,
  ]

  if (pemCount > 0) {
    parts.push(`${pemCount} PEM episode(s) recorded in recent check-ins — review pacing plan.`)
  }

  if (highAlerts.length > 0) {
    parts.push(`High-priority alert: ${highAlerts[0].title}.`)
  }

  return parts.join(" ")
}
