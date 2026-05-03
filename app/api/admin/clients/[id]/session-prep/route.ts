/**
 * Pre-session AI prep: generates a clinical summary for a practitioner
 * before a session with a specific client.
 * Uses Anthropic API directly (no SDK). Gracefully degrades when key is absent.
 */
import { formatEnumValue, roundOne } from "@/lib/utils"
import { db } from "@/lib/db"
import { users, checkIns, clientAlerts, techniqueAssignments, techniqueLogs, documents, functionalAssessments, medicationLog, programEnrollments } from "@/lib/db/schema"
import { eq, desc, and, gte, isNull } from "drizzle-orm"
import type { ProgramPhase } from "@/lib/domain/program"
import { callClaude } from "@/lib/domain/anthropic"
import { localDateString, addDaysISO } from "@/lib/utils"
import { computeDailyAdherenceTrend } from "@/lib/domain/techniques"
import { SESSION_PREP_CHECKIN_LIMIT, SESSION_PREP_ALERTS_LIMIT, SESSION_PREP_ENERGY_AVG_WINDOW, SESSION_PREP_NOTES_LIMIT, SEVEN_DAYS_MS } from "@/lib/constants"
import { notFound, okData, requireStaffAuth } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireStaffAuth()
  if (!authResult.ok) return authResult.response

  const { id: clientId } = await params

  const today = localDateString(new Date())
  const thirtyDaysAgo = addDaysISO(today, -30)

  const [client, recentCheckIns, activeAlerts, clientAssignments, techLogs, recentSessionNotes, latestAssessment, currentMedications, activeEnrollment] = await Promise.all([
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
      where: and(eq(clientAlerts.clientId, clientId), eq(clientAlerts.isResolved, false)),
      orderBy: [desc(clientAlerts.createdAt)],
      limit: SESSION_PREP_ALERTS_LIMIT,
    }),
    db.query.techniqueAssignments.findMany({
      where: and(eq(techniqueAssignments.clientId, clientId), eq(techniqueAssignments.isActive, true)),
      columns: { id: true, frequencyPerDay: true, startDate: true, endDate: true },
      with: { technique: { columns: { name: true, category: true } } },
    }),
    db.query.techniqueLogs.findMany({
      where: and(eq(techniqueLogs.userId, clientId), gte(techniqueLogs.date, thirtyDaysAgo)),
      columns: { assignmentId: true, date: true, completedReps: true },
    }),
    db.query.documents.findMany({
      where: and(eq(documents.userId, clientId), eq(documents.type, "session_note")),
      orderBy: [desc(documents.createdAt)],
      limit: SESSION_PREP_NOTES_LIMIT,
      columns: { title: true, content: true, createdAt: true },
    }),
    db.query.functionalAssessments.findFirst({
      where: eq(functionalAssessments.userId, clientId),
      orderBy: [desc(functionalAssessments.assessedAt)],
      columns: {
        assessedAt: true,
        overallCapacity: true,
        cognitiveCapacity: true,
        physicalCapacity: true,
        emotionalCapacity: true,
        socialCapacity: true,
        notes: true,
      },
    }),
    db.query.medicationLog.findMany({
      where: and(eq(medicationLog.userId, clientId), isNull(medicationLog.endDate)),
      columns: { medicationName: true, dose: true, frequency: true },
    }),
    db.query.programEnrollments.findFirst({
      where: and(eq(programEnrollments.clientId, clientId), eq(programEnrollments.status, "active")),
      with: { program: { columns: { title: true, durationWeeks: true, phaseConfig: true } } },
      orderBy: [desc(programEnrollments.createdAt)],
    }),
  ])

  if (!client) {
    return notFound()
  }

  const dailyTrend = computeDailyAdherenceTrend(clientAssignments, techLogs, today)
  const avgTechAdherence = clientAssignments.length > 0 && dailyTrend.length > 0
    ? Math.round(dailyTrend.reduce((s, d) => s + d.pct, 0) / dailyTrend.length)
    : null
  const reversedTrend = [...dailyTrend].reverse()
  const rawStreak = reversedTrend.findIndex((d) => d.pct < 100)
  const techniqueStreak = rawStreak === -1 ? dailyTrend.length : rawStreak

  const techniqueNames = clientAssignments.map((a) => a.technique?.name).filter(Boolean) as string[]
  const context = buildClinicalContext(client, recentCheckIns, activeAlerts, avgTechAdherence, techniqueStreak, techniqueNames, recentSessionNotes, latestAssessment ?? null, currentMedications, activeEnrollment ?? null)

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

  // Structured snapshot — computed from already-fetched data, no extra queries
  const energyWindow = recentCheckIns.slice(0, SESSION_PREP_ENERGY_AVG_WINDOW)
  const latestEnergy = recentCheckIns[0]?.energyLevel ?? null
  const avgEnergy = energyWindow.length > 0
    ? roundOne(energyWindow.reduce((s, ci) => s + ci.energyLevel, 0) / energyWindow.length)
    : null
  const prevAvgEnergy = recentCheckIns.length > 1
    ? roundOne(recentCheckIns.slice(1, SESSION_PREP_ENERGY_AVG_WINDOW + 1).reduce((s, ci) => s + ci.energyLevel, 0) / Math.min(SESSION_PREP_ENERGY_AVG_WINDOW, recentCheckIns.length - 1))
    : null
  const energyDirection: "up" | "down" | "stable" =
    avgEnergy == null || prevAvgEnergy == null ? "stable"
    : avgEnergy > prevAvgEnergy + 0.5 ? "up"
    : avgEnergy < prevAvgEnergy - 0.5 ? "down"
    : "stable"

  const stats = {
    alertCount: activeAlerts.length,
    highAlertCount: activeAlerts.filter((a) => a.severity === "high").length,
    pemCount: recentCheckIns.filter((ci) => ci.pemFlag).length,
    latestEnergy,
    avgEnergy,
    energyDirection,
    checkInCount: recentCheckIns.length,
    techniqueAdherence: avgTechAdherence,
    techniqueStreak,
  }

  return okData({ summary, aiGenerated: aiSummary !== null, stats })
}

function buildClinicalContext(
  client: { name: string | null; profile?: { mainConcern?: string | null; goals?: string | null } | null },
  recentCheckIns: Array<{
    createdAt: Date; mood: string; energyLevel: number; sleepHours: number | null; sleepQuality: number | null;
    symptomFatigue: number | null; symptomBrainFog: number | null; symptomPain: number | null;
    pemFlag: boolean | null; pemSeverity: number | null;
    stressLevel: number | null; activityLevel: string | null;
    orthostaticSymptoms: boolean | null; journalEntry: string | null;
  }>,
  alerts: Array<{ title: string; severity: string; createdAt: Date }>,
  avgTechAdherence: number | null,
  techniqueStreak: number,
  techniqueNames: string[] = [],
  sessionNotes: Array<{ title: string; content: string | null; createdAt: Date }> = [],
  latestAssessment: {
    assessedAt: Date; overallCapacity: number;
    cognitiveCapacity: number | null; physicalCapacity: number | null;
    emotionalCapacity: number | null; socialCapacity: number | null;
    notes: string | null;
  } | null = null,
  medications: Array<{ medicationName: string; dose: string | null; frequency: string | null }> = [],
  activeEnrollment: {
    startDate: Date | null;
    program: { title: string; durationWeeks: number | null; phaseConfig: unknown };
  } | null = null
): string {
  const lines: string[] = [
    `Client: ${client.name ?? "Unknown"}`,
    `Main concern: ${client.profile?.mainConcern ?? "not specified"}`,
  ]

  if (client.profile?.goals) {
    lines.push(`Client's stated goals: ${client.profile.goals}`)
  }

  if (medications.length > 0) {
    const medList = medications.map((m) => [m.medicationName, m.dose, m.frequency].filter(Boolean).join(" ")).join("; ")
    lines.push(`Current medications: ${medList}`)
  }

  if (latestAssessment) {
    const date = localDateString(latestAssessment.assessedAt)
    const caps = [
      `overall ${latestAssessment.overallCapacity}/10`,
      latestAssessment.cognitiveCapacity != null ? `cognitive ${latestAssessment.cognitiveCapacity}/10` : null,
      latestAssessment.physicalCapacity != null ? `physical ${latestAssessment.physicalCapacity}/10` : null,
      latestAssessment.emotionalCapacity != null ? `emotional ${latestAssessment.emotionalCapacity}/10` : null,
      latestAssessment.socialCapacity != null ? `social ${latestAssessment.socialCapacity}/10` : null,
    ].filter(Boolean).join(", ")
    lines.push(`Functional assessment (${date}): ${caps}`)
    if (latestAssessment.notes) lines.push(`  Assessment notes: ${latestAssessment.notes.slice(0, 200)}`)
  }

  if (activeEnrollment?.startDate) {
    const weekNum = Math.floor((Date.now() - activeEnrollment.startDate.getTime()) / SEVEN_DAYS_MS) + 1
    const total = activeEnrollment.program.durationWeeks ?? 0
    const phases = activeEnrollment.program.phaseConfig as ProgramPhase[] | null
    // Sort descending and take the first match so result is deterministic
    // regardless of the order phases were saved (milestone-only configs are
    // sparse — practitioners don't configure every week).
    const currentPhase = phases
      ?.filter((p) => p.week <= weekNum)
      ?.sort((a, b) => b.week - a.week)[0] ?? null
    const phaseInfo = currentPhase ? ` — Phase: ${currentPhase.title}` : ""
    const weekInfo = total > 0 ? `Week ${weekNum} of ${total}` : `Week ${weekNum}`
    lines.push(`Program: ${activeEnrollment.program.title}, ${weekInfo}${phaseInfo}`)
  }

  if (techniqueNames.length > 0) {
    lines.push(`Active techniques: ${techniqueNames.join(", ")}`)
  }

  if (recentCheckIns.length > 0) {
    lines.push(`\nLast ${recentCheckIns.length} check-ins:`)
    for (const ci of recentCheckIns) {
      const date = localDateString(ci.createdAt)
      const sleep = ci.sleepHours != null ? ` | sleep ${ci.sleepHours}h${ci.sleepQuality != null ? ` (quality ${ci.sleepQuality}/5)` : ""}` : ""
      const activity = ci.activityLevel ? ` | activity=${ci.activityLevel}` : ""
      const fatigue = ci.symptomFatigue != null ? ` | fatigue ${ci.symptomFatigue}` : ""
      const brainFog = ci.symptomBrainFog != null ? ` | brain-fog ${ci.symptomBrainFog}` : ""
      const pain = ci.symptomPain != null ? ` | pain ${ci.symptomPain}` : ""
      const stress = ci.stressLevel != null ? ` | stress ${ci.stressLevel}` : ""
      const pem = ci.pemFlag ? ` | PEM${ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}` : ""
      const ortho = ci.orthostaticSymptoms === true ? " | orthostatic+" : ""
      lines.push(`  ${date}: mood=${ci.mood}, energy=${ci.energyLevel}/10${sleep}${activity}${fatigue}${brainFog}${pain}${stress}${pem}${ortho}`)
      if (ci.journalEntry) lines.push(`    → "${ci.journalEntry.slice(0, 200)}"`)
    }
  }

  if (alerts.length > 0) {
    lines.push(`\nActive alerts (${alerts.length}):`)
    for (const alert of alerts) {
      lines.push(`  [${alert.severity.toUpperCase()}] ${alert.title}`)
    }
  }

  if (avgTechAdherence != null) {
    lines.push(`\nTechnique adherence (30-day avg): ${avgTechAdherence}% | Current streak: ${techniqueStreak} day(s) at 100%`)
  }

  if (sessionNotes.length > 0) {
    lines.push(`\nRecent session notes (${sessionNotes.length}):`)
    for (const note of sessionNotes) {
      const date = localDateString(note.createdAt)
      lines.push(`  [${date}] ${note.title}`)
      if (note.content) lines.push(`    ${note.content.slice(0, 300)}`)
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
    recentCheckIns.slice(0, SESSION_PREP_ENERGY_AVG_WINDOW).reduce((s, ci) => s + ci.energyLevel, 0) / Math.min(SESSION_PREP_ENERGY_AVG_WINDOW, recentCheckIns.length)
  )
  const pemCount = recentCheckIns.filter((ci) => ci.pemFlag).length
  const highAlerts = alerts.filter((a) => a.severity === "high")

  const parts: string[] = [
    `${client.name ?? "Client"}'s latest check-in shows mood "${formatEnumValue(latest.mood)}" and energy ${latest.energyLevel}/10 (${SESSION_PREP_ENERGY_AVG_WINDOW}-session average: ${avgEnergy}/10).`,
  ]

  if (pemCount > 0) {
    parts.push(`${pemCount} PEM episode(s) recorded in recent check-ins — review pacing plan.`)
  }

  if (highAlerts.length > 0) {
    parts.push(`High-priority alert: ${highAlerts[0].title}.`)
  }

  return parts.join(" ")
}
