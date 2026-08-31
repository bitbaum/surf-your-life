/**
 * AI chat logic for the client portal.
 *
 * When ANTHROPIC_API_KEY is set: calls Claude with check-in context.
 * When not set: returns a rule-based response grounded in the client's actual data.
 *
 * To enable AI: set ANTHROPIC_API_KEY in your environment.
 * The generateAiReply function handles both paths — no other changes needed.
 */

import { db } from "@/lib/db";
import {
  checkIns,
  medicationLog,
  functionalAssessments,
  techniqueAssignments,
  techniqueLogs,
  programEnrollments,
} from "@/lib/db/schema";
import { eq, desc, isNull, and, gte } from "drizzle-orm";
import {
  SEVEN_DAYS_MS,
  AI_CONTEXT_CHECKINS,
  AI_CHAT_CONTEXT_WINDOW,
  AI_CHAT_CHECKIN_CONTEXT_LIMIT,
  AI_CHAT_JOURNAL_EXCERPT_LENGTH,
  TECHNIQUE_LOG_WINDOW_DAYS,
  CLIENT_ASSIGNMENTS_MAX,
} from "@/lib/constants";
import { summariseCheckIns, computeCurrentProgramWeek } from "@/lib/domain/check-in";
export { summariseCheckIns, type CheckInSummaryRow } from "@/lib/domain/check-in";
import { callClaude } from "@/lib/domain/anthropic";
import { semanticCheckInSearch } from "@/lib/domain/embeddings";
import { localDateString, addDaysISO } from "@/lib/utils";
import { computeDailyAdherenceTrend } from "@/lib/domain/techniques";
import type { ProgramPhase } from "@/lib/domain/program";

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
  } as const;

  const today = localDateString(new Date());
  const logSince = addDaysISO(today, -TECHNIQUE_LOG_WINDOW_DAYS);

  const [
    recentFallback,
    semanticResults,
    medications,
    latestAssessment,
    activeAssignments,
    recentTechniqueLogs,
    activeEnrollment,
  ] = await Promise.all([
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
    db.query.techniqueAssignments.findMany({
      where: and(
        eq(techniqueAssignments.clientId, userId),
        eq(techniqueAssignments.isActive, true),
      ),
      with: { technique: { columns: { name: true, category: true } } },
      columns: { id: true, frequencyPerDay: true, startDate: true, endDate: true },
      limit: CLIENT_ASSIGNMENTS_MAX,
    }),
    db.query.techniqueLogs.findMany({
      where: and(eq(techniqueLogs.userId, userId), gte(techniqueLogs.date, logSince)),
      columns: { assignmentId: true, date: true, completedReps: true },
    }),
    db.query.programEnrollments.findFirst({
      where: and(eq(programEnrollments.clientId, userId), eq(programEnrollments.status, "active")),
      with: { program: { columns: { title: true, durationWeeks: true, phaseConfig: true } } },
      orderBy: [desc(programEnrollments.createdAt)],
    }),
  ]);

  // Use semantic results when available, otherwise fall back to recency
  const recent = semanticResults ?? recentFallback;
  return {
    recent,
    medications,
    latestAssessment,
    activeAssignments,
    recentTechniqueLogs,
    activeEnrollment,
  };
}

type BuildContextResult = Awaited<ReturnType<typeof buildContext>>;
export type CheckInRow = BuildContextResult["recent"][number];
export type MedicationRow = BuildContextResult["medications"][number];
export type AssessmentRow = NonNullable<BuildContextResult["latestAssessment"]>;

// ─── Technique/program context helpers ───────────────────────────────────────

function buildTechniqueLines(
  assignments: BuildContextResult["activeAssignments"],
  logs: BuildContextResult["recentTechniqueLogs"],
  today: string,
): string {
  if (assignments.length === 0) return "None assigned.";
  const trend = computeDailyAdherenceTrend(
    assignments.map((a) => ({
      id: a.id,
      clientId: "",
      frequencyPerDay: a.frequencyPerDay,
      startDate: a.startDate,
      endDate: a.endDate,
    })),
    logs.map((l) => ({
      assignmentId: l.assignmentId,
      date: l.date,
      completedReps: l.completedReps,
      userId: "",
    })),
    today,
    TECHNIQUE_LOG_WINDOW_DAYS,
  );
  const daysLogged = trend.filter((d) => d.pct > 0).length;
  const avgPct =
    trend.length > 0 ? Math.round(trend.reduce((s, d) => s + d.pct, 0) / trend.length) : 0;
  const lines = assignments.map((a) => {
    const aLogs = logs.filter((l) => l.assignmentId === a.id);
    const daysCompleted = [
      ...new Set(aLogs.filter((l) => l.completedReps >= a.frequencyPerDay).map((l) => l.date)),
    ].length;
    const pct =
      TECHNIQUE_LOG_WINDOW_DAYS > 0
        ? Math.round((daysCompleted / TECHNIQUE_LOG_WINDOW_DAYS) * 100)
        : 0;
    return `- ${a.technique.name} (${a.technique.category}): ${daysCompleted}/${TECHNIQUE_LOG_WINDOW_DAYS} days completed (${pct}% adherence)`;
  });
  lines.push(`Overall 14-day adherence: ${avgPct}% (${daysLogged} active days)`);
  return lines.join("\n");
}

function buildProgramLine(
  enrollment: BuildContextResult["activeEnrollment"],
  today: string,
): string {
  if (!enrollment?.startDate) return "Not enrolled in a program.";
  const week = computeCurrentProgramWeek(enrollment.startDate, new Date(today));
  const total = enrollment.program.durationWeeks ?? 0;
  if (week < 1 || (total > 0 && week > total))
    return `Program: ${enrollment.program.title} (completed or not yet started).`;
  const phases = enrollment.program.phaseConfig as ProgramPhase[] | null;
  const phase = phases?.filter((p) => p.week <= week)?.sort((a, b) => b.week - a.week)[0] ?? null;
  const phaseInfo = phase
    ? ` — Phase: "${phase.title}"${phase.guidance ? `. Guidance: ${phase.guidance}` : ""}`
    : "";
  return `${enrollment.program.title}, Week ${week}${total > 0 ? ` of ${total}` : ""}${phaseInfo}`;
}

function getJournalText(r: CheckInRow): string | null {
  return r.journalEntry ?? r.notes ?? null;
}

// ─── Rule-based response ──────────────────────────────────────────────────────

export function ruleBasedResponse(
  question: string,
  rows: CheckInRow[],
  medications: MedicationRow[],
  latestAssessment: AssessmentRow | undefined,
  assignments: BuildContextResult["activeAssignments"] = [],
  techniqueLogs: BuildContextResult["recentTechniqueLogs"] = [],
  enrollment: BuildContextResult["activeEnrollment"] = undefined,
): string {
  const stats = summariseCheckIns(rows);
  const q = question.toLowerCase();

  if (!stats || stats.count === 0) {
    return "You haven't logged any check-ins yet. Start tracking your daily wellbeing and I'll be able to give you personalised insights based on your actual data.";
  }

  const dataNote = `(Based on your last ${stats.count} check-ins.)`;

  // PEM / post-exertional malaise
  if (
    q.includes("pem") ||
    q.includes("crash") ||
    q.includes("exertional") ||
    q.includes("after activity") ||
    q.includes("after exercise")
  ) {
    if (stats.pemCount === 0) {
      return `You haven't flagged any PEM episodes in your recent check-ins — that's a positive sign. Keep monitoring your activity levels and energy the day after moderate or active days. ${dataNote}`;
    }
    return `You've logged ${stats.pemCount} PEM episode${stats.pemCount === 1 ? "" : "s"} in your last ${stats.count} check-ins. This pattern is worth discussing with your practitioner. Tracking which activity levels precede crashes can help you find your personal energy envelope. ${dataNote}`;
  }

  // Energy
  if (
    q.includes("energy") ||
    q.includes("tired") ||
    q.includes("exhausted") ||
    q.includes("fatigue")
  ) {
    const trend =
      stats.avgEnergy >= 6 ? "above average" : stats.avgEnergy >= 4 ? "moderate" : "low";
    return `Your average energy over the last ${stats.count} check-ins is ${stats.avgEnergy.toFixed(1)}/10 — ${trend}. ${
      stats.pemCount > 0
        ? `You've also had ${stats.pemCount} PEM episodes, which suggests some days of overexertion. `
        : ""
    }Consistent sleep and pacing your activity are the two biggest levers for energy. ${dataNote}`;
  }

  // Sleep
  if (q.includes("sleep") || q.includes("rest") || q.includes("insomnia") || q.includes("night")) {
    const sleepRows = rows.filter((r) => r.sleepHours != null);
    if (sleepRows.length === 0) {
      return `You haven't been logging your sleep hours. Try adding sleep data to your check-ins — it's one of the strongest predictors of next-day energy and mood. ${dataNote}`;
    }
    const avg = stats.avgSleep!; // non-null guaranteed by sleepRows.length > 0 guard above
    const quality = avg >= 7.5 ? "good" : avg >= 6 ? "adequate" : "below optimal";
    return `Your average sleep is ${avg.toFixed(1)} hours — ${quality}. Most adults need 7–9 hours for full recovery, though individual needs vary. ${dataNote}`;
  }

  // Mood
  if (
    q.includes("mood") ||
    q.includes("happy") ||
    q.includes("sad") ||
    q.includes("depressed") ||
    q.includes("anxious") ||
    q.includes("anxiety")
  ) {
    const moodLabel =
      stats.avgMoodNum >= 4.5
        ? "mostly good to excellent"
        : stats.avgMoodNum >= 3.5
          ? "generally neutral to good"
          : stats.avgMoodNum >= 2.5
            ? "mixed, with some low days"
            : stats.avgMoodNum >= 1.5
              ? "frequently low"
              : "frequently very low";
    return `Your mood over the last ${stats.count} check-ins has been ${moodLabel}. Mood and energy often move together — if you notice consistent low mood, it's worth flagging with your practitioner. ${dataNote}`;
  }

  // Stress
  if (
    q.includes("stress") ||
    q.includes("overwhelm") ||
    q.includes("burnout") ||
    q.includes("pressure")
  ) {
    if (stats.avgStress == null) {
      return `You haven't been logging your stress levels. Adding this to your daily check-ins helps identify patterns and early warning signs. ${dataNote}`;
    }
    const level =
      stats.avgStress >= 7 ? "high" : stats.avgStress >= 5 ? "moderate" : "relatively low";
    return `Your average stress is ${stats.avgStress.toFixed(1)}/10 — ${level}. Sustained stress above 7 is a known trigger for symptom flares. Your practitioner can help you build stress-management strategies tailored to your situation. ${dataNote}`;
  }

  // Progress / trend
  if (
    q.includes("progress") ||
    q.includes("improving") ||
    q.includes("better") ||
    q.includes("worse") ||
    q.includes("trend")
  ) {
    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);
    const recentWeek = rows.filter((r) => r.createdAt >= sevenDaysAgo);
    const olderRows = rows.filter((r) => r.createdAt < sevenDaysAgo);

    if (recentWeek.length === 0 || olderRows.length === 0) {
      return `You have ${stats.count} check-in${stats.count === 1 ? "" : "s"} logged so far. Keep tracking daily and trends will become visible after a couple of weeks. ${dataNote}`;
    }

    const recentEnergy =
      recentWeek.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / recentWeek.length;
    const olderEnergy = olderRows.reduce((s, r) => s + (r.energyLevel ?? 0), 0) / olderRows.length;
    const diff = recentEnergy - olderEnergy;

    if (Math.abs(diff) < 0.5) {
      return `Your energy has been stable recently (${recentEnergy.toFixed(1)}/10 this week vs ${olderEnergy.toFixed(1)}/10 previously). Stability can be a good sign — it means you're holding your baseline. ${dataNote}`;
    }
    return diff > 0
      ? `Your energy is trending upward — ${recentEnergy.toFixed(1)}/10 this week compared to ${olderEnergy.toFixed(1)}/10 previously. Keep doing what's working. ${dataNote}`
      : `Your energy has dipped recently — ${recentEnergy.toFixed(1)}/10 this week compared to ${olderEnergy.toFixed(1)}/10 previously. This might be worth discussing in your next session. ${dataNote}`;
  }

  // Orthostatic symptoms
  if (
    q.includes("dizzy") ||
    q.includes("dizziness") ||
    q.includes("lightheaded") ||
    q.includes("orthostatic") ||
    q.includes("standing")
  ) {
    const orthoCount = rows.filter((r) => r.orthostaticSymptoms).length;
    if (orthoCount === 0) {
      return `You haven't reported dizziness on standing in your recent check-ins — that's reassuring. Keep logging this daily; it's a key indicator for conditions like POTS which are common in Long COVID. ${dataNote}`;
    }
    return `You've reported dizziness on standing in ${orthoCount} of your last ${stats.count} check-ins. This is worth discussing with your practitioner — orthostatic intolerance is common in Long COVID and there are specific strategies to manage it. ${dataNote}`;
  }

  // Wins / journal
  if (
    q.includes("win") ||
    q.includes("achievement") ||
    q.includes("goal") ||
    q.includes("challenge")
  ) {
    const journalCount = rows.filter((r) => getJournalText(r)).length;
    return `You've written journal entries on ${journalCount} of your last ${stats.count} check-in days. Reflecting on your wins is a powerful part of recovery — it helps your brain register progress even when energy is low. Keep it up. ${dataNote}`;
  }

  // Medications
  if (
    q.includes("medication") ||
    q.includes("medicine") ||
    q.includes("drug") ||
    q.includes("supplement") ||
    q.includes("pill") ||
    q.includes("tablet")
  ) {
    if (medications.length === 0) {
      return "You haven't logged any current medications. You can add them in the Medications section of the portal. Keeping an accurate medication log helps your practitioner give you better support.";
    }
    const list = medications
      .map(
        (m) =>
          `${m.medicationName}${m.dose ? ` (${m.dose})` : ""}${m.frequency ? `, ${m.frequency}` : ""}`,
      )
      .join("; ");
    return `You currently have ${medications.length} medication${medications.length === 1 ? "" : "s"} logged: ${list}. Always discuss any changes with your prescribing doctor before adjusting doses.`;
  }

  // Functional assessment / capacity
  if (
    q.includes("assessment") ||
    q.includes("capacity") ||
    q.includes("function") ||
    q.includes("cognitive") ||
    q.includes("physical capacity")
  ) {
    if (!latestAssessment) {
      return "You haven't completed a functional assessment yet. You can do one in the Assessments section — it takes about 2 minutes and helps track your overall recovery capacity over time.";
    }
    const parts = [
      `Overall capacity: ${latestAssessment.overallCapacity}/10`,
      latestAssessment.cognitiveCapacity != null
        ? `Cognitive: ${latestAssessment.cognitiveCapacity}/10`
        : null,
      latestAssessment.physicalCapacity != null
        ? `Physical: ${latestAssessment.physicalCapacity}/10`
        : null,
      latestAssessment.emotionalCapacity != null
        ? `Emotional: ${latestAssessment.emotionalCapacity}/10`
        : null,
      latestAssessment.socialCapacity != null
        ? `Social: ${latestAssessment.socialCapacity}/10`
        : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `Your last functional assessment shows: ${parts}. Doing these regularly (weekly or monthly) lets you see capacity trends that aren't always visible in daily check-ins.`;
  }

  // Techniques / exercises / adherence
  if (
    q.includes("technique") ||
    q.includes("exercise") ||
    q.includes("practice") ||
    q.includes("habit") ||
    q.includes("adherence") ||
    q.includes("breathing") ||
    q.includes("meditation") ||
    q.includes("pacing")
  ) {
    if (assignments.length === 0) {
      return "You don't have any techniques assigned yet. Your practitioner will set these up for you based on your program.";
    }
    const today = localDateString(new Date());
    const lines = assignments.map((a) => {
      const aLogs = techniqueLogs.filter((l) => l.assignmentId === a.id);
      const daysCompleted = [
        ...new Set(aLogs.filter((l) => l.completedReps >= a.frequencyPerDay).map((l) => l.date)),
      ].length;
      const pct = Math.round((daysCompleted / TECHNIQUE_LOG_WINDOW_DAYS) * 100);
      return `${a.technique.name}: ${daysCompleted}/${TECHNIQUE_LOG_WINDOW_DAYS} days (${pct}%)`;
    });
    const todayLogs = techniqueLogs.filter((l) => l.date === today);
    const doneToday = assignments.filter((a) => {
      const aLog = todayLogs.find((l) => l.assignmentId === a.id);
      return aLog && aLog.completedReps >= a.frequencyPerDay;
    }).length;
    return `You have ${assignments.length} active technique${assignments.length !== 1 ? "s" : ""}. In the last 14 days: ${lines.join(", ")}. Today you've completed ${doneToday} of ${assignments.length}. Keep logging in the Techniques section — consistency is more important than perfection.`;
  }

  // Program / week / phase / plan
  if (
    q.includes("program") ||
    q.includes("plan") ||
    q.includes("week") ||
    q.includes("phase") ||
    q.includes("schedule") ||
    q.includes("what should i")
  ) {
    if (!enrollment?.startDate) {
      return "You're not currently enrolled in a program. Your practitioner will set this up for you when the time is right.";
    }
    const week = computeCurrentProgramWeek(enrollment.startDate);
    const total = enrollment.program.durationWeeks ?? 0;
    if (week < 1 || (total > 0 && week > total)) {
      return `You're enrolled in ${enrollment.program.title}. Check in with your practitioner for an update on where you are in the program.`;
    }
    const phases = enrollment.program.phaseConfig as ProgramPhase[] | null;
    const phase = phases?.filter((p) => p.week <= week)?.sort((a, b) => b.week - a.week)[0] ?? null;
    const phaseInfo = phase
      ? ` This week's focus: "${phase.title}"${phase.guidance ? ` — ${phase.guidance}` : ""}.`
      : "";
    return `You're in Week ${week}${total > 0 ? ` of ${total}` : ""} of ${enrollment.program.title}.${phaseInfo} Keep logging your check-ins so your practitioner can see your progress.`;
  }

  // Generic / what can you do
  if (
    q.includes("what can you") ||
    q.includes("help me") ||
    q.includes("how does") ||
    q.includes("what do")
  ) {
    return `I can answer questions about your check-in data, techniques, and program — things like your energy trends, sleep patterns, PEM episodes, technique adherence, and where you are in your program. Try asking: "How has my energy been lately?" or "Am I keeping up with my techniques?" ${dataNote}`;
  }

  // Default: summarise current state
  const sleepSummary =
    stats.avgSleep != null ? `, average sleep is ${stats.avgSleep.toFixed(1)}h` : "";
  return `Here's a quick snapshot: over your last ${stats.count} check-ins, your average energy is ${stats.avgEnergy.toFixed(1)}/10${sleepSummary}, and you've had ${stats.pemCount} PEM episode${stats.pemCount === 1 ? "" : "s"}. Ask me about any of these in more detail. ${dataNote}`;
}

// ─── AI call (to be enabled when ANTHROPIC_API_KEY is set) ────────────────────

async function callAnthropicApi(
  userMessage: string,
  context: BuildContextResult,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string | null> {
  const {
    recent,
    medications,
    latestAssessment,
    activeAssignments,
    recentTechniqueLogs,
    activeEnrollment,
  } = context;
  const today = localDateString(new Date());

  // Build check-in summary
  const checkInLines = recent
    .slice(0, AI_CHAT_CHECKIN_CONTEXT_LIMIT)
    .map((r, i) => {
      const parts = [`Day ${i + 1} (${new Date(r.createdAt).toLocaleDateString("en-GB")})`];
      if (r.mood) parts.push(`mood=${r.mood}`);
      if (r.energyLevel != null) parts.push(`energy=${r.energyLevel}/10`);
      if (r.sleepHours != null) parts.push(`sleep=${r.sleepHours}h`);
      if (r.sleepQuality != null) parts.push(`sleep_quality=${r.sleepQuality}/5`);
      if (r.activityLevel) parts.push(`activity=${r.activityLevel}`);
      if (r.pemFlag) parts.push(`PEM=yes${r.pemSeverity != null ? `(${r.pemSeverity}/10)` : ""}`);
      if (r.symptomFatigue != null) parts.push(`fatigue=${r.symptomFatigue}/10`);
      if (r.symptomBrainFog != null) parts.push(`brain_fog=${r.symptomBrainFog}/10`);
      if (r.symptomPain != null) parts.push(`pain=${r.symptomPain}/10`);
      if (r.stressLevel != null) parts.push(`stress=${r.stressLevel}/10`);
      if (r.orthostaticSymptoms) parts.push("orthostatic=yes");
      const journal = r.journalEntry ?? r.notes;
      if (journal) parts.push(`journal: "${journal.slice(0, AI_CHAT_JOURNAL_EXCERPT_LENGTH)}"`);
      return parts.join(", ");
    })
    .join("\n");

  const medLines =
    medications.length > 0
      ? medications
          .map(
            (m) =>
              `- ${m.medicationName}${m.dose ? ` ${m.dose}` : ""}${m.frequency ? `, ${m.frequency}` : ""}`,
          )
          .join("\n")
      : "None logged.";

  const assessmentLines = latestAssessment
    ? `Overall: ${latestAssessment.overallCapacity}/10, Physical: ${latestAssessment.physicalCapacity ?? "?"}/10, Cognitive: ${latestAssessment.cognitiveCapacity ?? "?"}/10, Emotional: ${latestAssessment.emotionalCapacity ?? "?"}/10, Social: ${latestAssessment.socialCapacity ?? "?"}/10`
    : "No assessment completed yet.";

  const techniqueLines = buildTechniqueLines(activeAssignments, recentTechniqueLogs, today);
  const programLine = buildProgramLine(activeEnrollment, today);

  const systemPrompt = `You are a supportive health assistant for a client recovering from burnout or Long COVID.
You have access to their recent health data. Be empathetic, practical, and clinically grounded.
Never diagnose. Never prescribe. Encourage bringing concerns to their practitioner.
Keep responses concise — 2-4 sentences. Refer to their actual data when relevant.

Recent check-ins (newest first, up to 10 days):
${checkInLines || "No check-ins yet."}

Current medications:
${medLines}

Latest functional assessment:
${assessmentLines}

Assigned techniques (14-day adherence):
${techniqueLines}

Current program:
${programLine}`;

  return callClaude({
    messages: [...history.slice(-AI_CHAT_CONTEXT_WINDOW), { role: "user", content: userMessage }],
    system: systemPrompt,
    maxTokens: 500,
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateAiReply(
  userId: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[],
): Promise<string> {
  const context = await buildContext(userId, userMessage);
  const {
    recent,
    medications,
    latestAssessment,
    activeAssignments,
    recentTechniqueLogs,
    activeEnrollment,
  } = context;

  // Try AI first (no-op until ANTHROPIC_API_KEY is set)
  const aiReply = await callAnthropicApi(userMessage, context, history);
  if (aiReply) return aiReply;

  // Fall back to rule-based response grounded in actual data
  return ruleBasedResponse(
    userMessage,
    recent,
    medications,
    latestAssessment,
    activeAssignments,
    recentTechniqueLogs,
    activeEnrollment,
  );
}
