/**
 * AI chat logic for the client portal.
 *
 * When ANTHROPIC_API_KEY is set: calls Claude with check-in context.
 * When not set: returns a rule-based response grounded in the client's actual data.
 *
 * To enable AI: set ANTHROPIC_API_KEY in your environment.
 * The generateAiReply function handles both paths — no other changes needed.
 */

import { db } from "@/lib/db"
import { checkIns, medicationLog, functionalAssessments } from "@/lib/db/schema"
import { eq, desc, isNull, and } from "drizzle-orm"
import { SEVEN_DAYS_MS, MOOD_SCORE, AI_CONTEXT_CHECKINS, AI_CHAT_CONTEXT_WINDOW, AI_CHAT_CHECKIN_CONTEXT_LIMIT, AI_CHAT_JOURNAL_EXCERPT_LENGTH } from "@/lib/constants"
import { summariseCheckIns } from "@/lib/domain/check-in"
export { summariseCheckIns, type CheckInSummaryRow } from "@/lib/domain/check-in"
import { callClaude } from "@/lib/domain/anthropic"
import { semanticCheckInSearch } from "@/lib/domain/embeddings"


// ─── Context builder ─────────────────────────────────────────────────────────

async function buildContext(userId: string, query?: string) {
  const recentColumns = {
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
  } as const

  const [recentFallback, semanticResults, medications, latestAssessment] = await Promise.all([
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, userId),
      orderBy: [desc(checkIns.createdAt)],
      limit: AI_CONTEXT_CHECKINS,
      columns: recentColumns,
    }),
    query ? semanticCheckInSearch(userId, query, AI_CONTEXT_CHECKINS) : Promise.resolve(null),
    db.query.medicationLog.findMany({
      where: and(eq(medicationLog.userId, userId), isNull(medicationLog.endDate)),
      columns: { medicationName: true, dose: true, frequency: true, startDate: true, notes: true },
    }),
    db.query.functionalAssessments.findFirst({
      where: eq(functionalAssessments.userId, userId),
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
  ])

  // Use semantic results when available, otherwise fall back to recency
  const recent = semanticResults ?? recentFallback
  return { recent, medications, latestAssessment }
}

type BuildContextResult = Awaited<ReturnType<typeof buildContext>>
export type CheckInRow = BuildContextResult["recent"][number]
export type MedicationRow = BuildContextResult["medications"][number]
export type AssessmentRow = NonNullable<BuildContextResult["latestAssessment"]>

function getJournalText(r: CheckInRow): string | null {
  return r.journalEntry ?? r.notes ?? null
}

// ─── Rule-based response ──────────────────────────────────────────────────────

export function ruleBasedResponse(question: string, rows: CheckInRow[], medications: MedicationRow[], latestAssessment: AssessmentRow | undefined): string {
  const stats = summariseCheckIns(rows)
  const q = question.toLowerCase()

  if (!stats || stats.count === 0) {
    return "You haven't logged any check-ins yet. Start tracking your daily wellbeing and I'll be able to give you personalised insights based on your actual data."
  }

  const dataNote = `(Based on your last ${stats.count} check-ins.)`

  // PEM / post-exertional malaise
  if (q.includes("pem") || q.includes("crash") || q.includes("exertional") || q.includes("after activity") || q.includes("after exercise")) {
    if (stats.pemCount === 0) {
      return `You haven't flagged any PEM episodes in your recent check-ins — that's a positive sign. Keep monitoring your activity levels and energy the day after moderate or active days. ${dataNote}`
    }
    return `You've logged ${stats.pemCount} PEM episode${stats.pemCount === 1 ? "" : "s"} in your last ${stats.count} check-ins. This pattern is worth discussing with your practitioner. Tracking which activity levels precede crashes can help you find your personal energy envelope. ${dataNote}`
  }

  // Energy
  if (q.includes("energy") || q.includes("tired") || q.includes("exhausted") || q.includes("fatigue")) {
    const trend = stats.avgEnergy >= 6 ? "above average" : stats.avgEnergy >= 4 ? "moderate" : "low"
    return `Your average energy over the last ${stats.count} check-ins is ${stats.avgEnergy.toFixed(1)}/10 — ${trend}. ${
      stats.pemCount > 0
        ? `You've also had ${stats.pemCount} PEM episodes, which suggests some days of overexertion. `
        : ""
    }Consistent sleep and pacing your activity are the two biggest levers for energy. ${dataNote}`
  }

  // Sleep
  if (q.includes("sleep") || q.includes("rest") || q.includes("insomnia") || q.includes("night")) {
    const sleepRows = rows.filter((r) => r.sleepHours != null)
    if (sleepRows.length === 0) {
      return `You haven't been logging your sleep hours. Try adding sleep data to your check-ins — it's one of the strongest predictors of next-day energy and mood. ${dataNote}`
    }
    const avg = stats.avgSleep!  // non-null guaranteed by sleepRows.length > 0 guard above
    const quality = avg >= 7.5 ? "good" : avg >= 6 ? "adequate" : "below optimal"
    return `Your average sleep is ${avg.toFixed(1)} hours — ${quality}. Most adults need 7–9 hours for full recovery, though individual needs vary. ${dataNote}`
  }

  // Mood
  if (q.includes("mood") || q.includes("happy") || q.includes("sad") || q.includes("depressed") || q.includes("anxious") || q.includes("anxiety")) {
    const moodLabel =
      stats.avgMoodNum >= 4.5 ? "mostly good to excellent" :
      stats.avgMoodNum >= 3.5 ? "generally neutral to good" :
      stats.avgMoodNum >= 2.5 ? "mixed, with some low days" :
      stats.avgMoodNum >= 1.5 ? "frequently low" :
      "frequently very low"
    return `Your mood over the last ${stats.count} check-ins has been ${moodLabel}. Mood and energy often move together — if you notice consistent low mood, it's worth flagging with your practitioner. ${dataNote}`
  }

  // Stress
  if (q.includes("stress") || q.includes("overwhelm") || q.includes("burnout") || q.includes("pressure")) {
    if (stats.avgStress == null) {
      return `You haven't been logging your stress levels. Adding this to your daily check-ins helps identify patterns and early warning signs. ${dataNote}`
    }
    const level = stats.avgStress >= 7 ? "high" : stats.avgStress >= 5 ? "moderate" : "relatively low"
    return `Your average stress is ${stats.avgStress.toFixed(1)}/10 — ${level}. Sustained stress above 7 is a known trigger for symptom flares. Your practitioner can help you build stress-management strategies tailored to your situation. ${dataNote}`
  }

  // Progress / trend
  if (q.includes("progress") || q.includes("improving") || q.includes("better") || q.includes("worse") || q.includes("trend")) {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS)
    const recentWeek = rows.filter((r) => r.createdAt >= sevenDaysAgo)
    const olderRows = rows.filter((r) => r.createdAt < sevenDaysAgo)

    if (recentWeek.length === 0 || olderRows.length === 0) {
      return `You have ${stats.count} check-in${stats.count === 1 ? "" : "s"} logged so far. Keep tracking daily and trends will become visible after a couple of weeks. ${dataNote}`
    }

    const recentEnergy = recentWeek.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / recentWeek.length
    const olderEnergy = olderRows.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / olderRows.length
    const diff = recentEnergy - olderEnergy

    if (Math.abs(diff) < 0.5) {
      return `Your energy has been stable recently (${recentEnergy.toFixed(1)}/10 this week vs ${olderEnergy.toFixed(1)}/10 previously). Stability can be a good sign — it means you're holding your baseline. ${dataNote}`
    }
    return diff > 0
      ? `Your energy is trending upward — ${recentEnergy.toFixed(1)}/10 this week compared to ${olderEnergy.toFixed(1)}/10 previously. Keep doing what's working. ${dataNote}`
      : `Your energy has dipped recently — ${recentEnergy.toFixed(1)}/10 this week compared to ${olderEnergy.toFixed(1)}/10 previously. This might be worth discussing in your next session. ${dataNote}`
  }

  // Orthostatic symptoms
  if (q.includes("dizzy") || q.includes("dizziness") || q.includes("lightheaded") || q.includes("orthostatic") || q.includes("standing")) {
    const orthoCount = rows.filter((r) => r.orthostaticSymptoms).length
    if (orthoCount === 0) {
      return `You haven't reported dizziness on standing in your recent check-ins — that's reassuring. Keep logging this daily; it's a key indicator for conditions like POTS which are common in Long COVID. ${dataNote}`
    }
    return `You've reported dizziness on standing in ${orthoCount} of your last ${stats.count} check-ins. This is worth discussing with your practitioner — orthostatic intolerance is common in Long COVID and there are specific strategies to manage it. ${dataNote}`
  }

  // Wins / journal
  if (q.includes("win") || q.includes("achievement") || q.includes("goal") || q.includes("challenge")) {
    const journalCount = rows.filter((r) => getJournalText(r)).length
    return `You've written journal entries on ${journalCount} of your last ${stats.count} check-in days. Reflecting on your wins is a powerful part of recovery — it helps your brain register progress even when energy is low. Keep it up. ${dataNote}`
  }

  // Medications
  if (q.includes("medication") || q.includes("medicine") || q.includes("drug") || q.includes("supplement") || q.includes("pill") || q.includes("tablet")) {
    if (medications.length === 0) {
      return "You haven't logged any current medications. You can add them in the Medications section of the portal. Keeping an accurate medication log helps your practitioner give you better support."
    }
    const list = medications.map((m) => `${m.medicationName}${m.dose ? ` (${m.dose})` : ""}${m.frequency ? `, ${m.frequency}` : ""}`).join("; ")
    return `You currently have ${medications.length} medication${medications.length === 1 ? "" : "s"} logged: ${list}. Always discuss any changes with your prescribing doctor before adjusting doses.`
  }

  // Functional assessment / capacity
  if (q.includes("assessment") || q.includes("capacity") || q.includes("function") || q.includes("cognitive") || q.includes("physical capacity")) {
    if (!latestAssessment) {
      return "You haven't completed a functional assessment yet. You can do one in the Assessments section — it takes about 2 minutes and helps track your overall recovery capacity over time."
    }
    const parts = [
      `Overall capacity: ${latestAssessment.overallCapacity}/10`,
      latestAssessment.cognitiveCapacity != null ? `Cognitive: ${latestAssessment.cognitiveCapacity}/10` : null,
      latestAssessment.physicalCapacity != null ? `Physical: ${latestAssessment.physicalCapacity}/10` : null,
      latestAssessment.emotionalCapacity != null ? `Emotional: ${latestAssessment.emotionalCapacity}/10` : null,
      latestAssessment.socialCapacity != null ? `Social: ${latestAssessment.socialCapacity}/10` : null,
    ].filter(Boolean).join(", ")
    return `Your last functional assessment shows: ${parts}. Doing these regularly (weekly or monthly) lets you see capacity trends that aren't always visible in daily check-ins.`
  }

  // Generic / what can you do
  if (q.includes("what can you") || q.includes("help me") || q.includes("how does") || q.includes("what do")) {
    return `I can answer questions about your check-in data — things like your energy trends, sleep patterns, PEM episodes, mood over time, and stress levels. Try asking: "How has my energy been lately?" or "Have I had any PEM episodes?" ${dataNote}`
  }

  // Default: summarise current state
  const sleepSummary = stats.avgSleep != null ? `, average sleep is ${stats.avgSleep.toFixed(1)}h` : ""
  return `Here's a quick snapshot: over your last ${stats.count} check-ins, your average energy is ${stats.avgEnergy.toFixed(1)}/10${sleepSummary}, and you've had ${stats.pemCount} PEM episode${stats.pemCount === 1 ? "" : "s"}. Ask me about any of these in more detail. ${dataNote}`
}

// ─── AI call (to be enabled when ANTHROPIC_API_KEY is set) ────────────────────

async function callAnthropicApi(
  userMessage: string,
  context: BuildContextResult,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string | null> {
  const { recent, medications, latestAssessment } = context

  // Build check-in summary
  const checkInLines = recent.slice(0, AI_CHAT_CHECKIN_CONTEXT_LIMIT).map((r, i) => {
    const parts = [`Day ${i + 1} (${new Date(r.createdAt).toLocaleDateString("en-GB")})`]
    if (r.mood) parts.push(`mood=${r.mood}`)
    if (r.energyLevel != null) parts.push(`energy=${r.energyLevel}/10`)
    if (r.sleepHours != null) parts.push(`sleep=${r.sleepHours}h`)
    if (r.sleepQuality != null) parts.push(`sleep_quality=${r.sleepQuality}/5`)
    if (r.activityLevel) parts.push(`activity=${r.activityLevel}`)
    if (r.pemFlag) parts.push(`PEM=yes${r.pemSeverity != null ? `(${r.pemSeverity}/10)` : ""}`)
    if (r.symptomFatigue != null) parts.push(`fatigue=${r.symptomFatigue}/10`)
    if (r.symptomBrainFog != null) parts.push(`brain_fog=${r.symptomBrainFog}/10`)
    if (r.symptomPain != null) parts.push(`pain=${r.symptomPain}/10`)
    if (r.stressLevel != null) parts.push(`stress=${r.stressLevel}/10`)
    if (r.orthostaticSymptoms) parts.push("orthostatic=yes")
    const journal = r.journalEntry ?? r.notes
    if (journal) parts.push(`journal: "${journal.slice(0, AI_CHAT_JOURNAL_EXCERPT_LENGTH)}"`)
    return parts.join(", ")
  }).join("\n")

  const medLines = medications.length > 0
    ? medications.map((m) => `- ${m.medicationName}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? `, ${m.frequency}` : ""}`).join("\n")
    : "None logged."

  const assessmentLines = latestAssessment
    ? `Overall: ${latestAssessment.overallCapacity}/10, Physical: ${latestAssessment.physicalCapacity ?? "?"}/10, Cognitive: ${latestAssessment.cognitiveCapacity ?? "?"}/10, Emotional: ${latestAssessment.emotionalCapacity ?? "?"}/10, Social: ${latestAssessment.socialCapacity ?? "?"}/10`
    : "No assessment completed yet."

  const systemPrompt = `You are a supportive health assistant for a client recovering from burnout or Long COVID.
You have access to their recent health data. Be empathetic, practical, and clinically grounded.
Never diagnose. Never prescribe. Encourage bringing concerns to their practitioner.
Keep responses concise — 2-4 sentences. Refer to their actual data when relevant.

Recent check-ins (newest first, up to 10 days):
${checkInLines || "No check-ins yet."}

Current medications:
${medLines}

Latest functional assessment:
${assessmentLines}`

  return callClaude({
    messages: [
      ...history.slice(-AI_CHAT_CONTEXT_WINDOW),
      { role: "user", content: userMessage },
    ],
    system: systemPrompt,
    maxTokens: 500,
  })
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateAiReply(
  userId: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const context = await buildContext(userId, userMessage)
  const { recent, medications, latestAssessment } = context

  // Try AI first (no-op until ANTHROPIC_API_KEY is set)
  const aiReply = await callAnthropicApi(userMessage, context, history)
  if (aiReply) return aiReply

  // Fall back to rule-based response grounded in actual data
  return ruleBasedResponse(userMessage, recent, medications, latestAssessment)
}
