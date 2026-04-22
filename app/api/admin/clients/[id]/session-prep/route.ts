/**
 * Pre-session AI prep: generates a clinical summary for a practitioner
 * before a session with a specific client.
 * Uses Anthropic API directly (no SDK). Gracefully degrades when key is absent.
 */
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { isStaff } from "@/lib/domain/auth"
import { db } from "@/lib/db"
import { users, checkIns, clientAlerts } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || !isStaff(session.user.role)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
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
      limit: 10,
    }),
    db.query.clientAlerts.findMany({
      where: eq(clientAlerts.clientId, clientId),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: 5,
    }),
  ])

  if (!client) {
    return NextResponse.json({ success: false, error: "Client not found" }, { status: 404 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Graceful degradation: return a rule-based summary without AI
    return NextResponse.json({
      success: true,
      data: { summary: buildRuleBasedSummary(client, recentCheckIns, activeAlerts), aiGenerated: false },
    })
  }

  // Build a clinical context string for the AI
  const context = buildClinicalContext(client, recentCheckIns, activeAlerts)

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
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
      }),
    })

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()
    const summary = data.content?.[0]?.text ?? buildRuleBasedSummary(client, recentCheckIns, activeAlerts)

    return NextResponse.json({ success: true, data: { summary, aiGenerated: true } })
  } catch {
    // Graceful degradation: fall back to rule-based on AI failure
    return NextResponse.json({
      success: true,
      data: { summary: buildRuleBasedSummary(client, recentCheckIns, activeAlerts), aiGenerated: false },
    })
  }
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
      const date = ci.createdAt.toISOString().split("T")[0]
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
    `${client.name ?? "Client"}'s latest check-in shows mood "${latest.mood.replace("_", " ")}" and energy ${latest.energyLevel}/10 (5-session average: ${avgEnergy}/10).`,
  ]

  if (pemCount > 0) {
    parts.push(`${pemCount} PEM episode(s) recorded in recent check-ins — review pacing plan.`)
  }

  if (highAlerts.length > 0) {
    parts.push(`High-priority alert: ${highAlerts[0].title}.`)
  }

  return parts.join(" ")
}
