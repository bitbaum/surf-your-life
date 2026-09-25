import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { callLLM } from "@/lib/domain/llm";
import { AI_DIGEST_MIN_CHECKINS, SEVEN_DAYS_MS } from "@/lib/constants";

type CheckInRow = {
  createdAt: Date;
  mood: string | null;
  energyLevel: number | null;
  sleepHours: number | null;
  activityLevel: string | null;
  pemFlag: boolean | null;
  pemSeverity: number | null;
  symptomFatigue: number | null;
  symptomBrainFog: number | null;
  symptomPain: number | null;
  stressLevel: number | null;
  sleepQuality: number | null;
  orthostaticSymptoms: boolean | null;
  journalEntry: string | null;
  wins: string | null;
  challenges: string | null;
  notes: string | null;
};

/**
 * Generate a clinical AI narrative for a client's weekly check-in data.
 * Returns null when no provider is configured or every provider refused.
 */
export async function generateWeeklyDigest(
  clientName: string,
  rows: CheckInRow[],
): Promise<string | null> {
  const summary = rows
    .map((r, i) => {
      const parts = [`Day ${i + 1} (${r.createdAt.toLocaleDateString("en-GB")})`];
      if (r.mood) parts.push(`mood=${r.mood}`);
      if (r.energyLevel != null) parts.push(`energy=${r.energyLevel}/10`);
      if (r.sleepHours != null) parts.push(`sleep=${r.sleepHours}h`);
      if (r.activityLevel) parts.push(`activity=${r.activityLevel}`);
      if (r.pemFlag) parts.push(`PEM=yes${r.pemSeverity != null ? `(${r.pemSeverity}/10)` : ""}`);
      if (r.symptomFatigue != null) parts.push(`fatigue=${r.symptomFatigue}/10`);
      if (r.symptomBrainFog != null) parts.push(`brain_fog=${r.symptomBrainFog}/10`);
      if (r.symptomPain != null) parts.push(`pain=${r.symptomPain}/10`);
      if (r.sleepQuality != null) parts.push(`sleep_quality=${r.sleepQuality}/5`);
      if (r.orthostaticSymptoms) parts.push("orthostatic=yes");
      if (r.stressLevel != null) parts.push(`stress=${r.stressLevel}/10`);
      if (r.journalEntry) parts.push(`journal: ${r.journalEntry.slice(0, 300)}`);
      if (r.wins) parts.push(`wins: ${r.wins}`);
      if (r.challenges) parts.push(`challenges: ${r.challenges}`);
      if (r.notes) parts.push(`notes: ${r.notes}`);
      return parts.join(", ");
    })
    .join("\n");

  const prompt = `You are a clinical assistant helping a practitioner understand a client's weekly health data.

Client: ${clientName}
Check-ins this week (${rows.length} entries):
${summary}

Write a concise clinical narrative (3-5 sentences) summarising:
1. Overall trend (improving, declining, or stable)
2. Key symptoms or concerns to discuss
3. Notable wins or positive signals

Be factual, empathetic, and clinically precise. No bullet points — flowing prose only.`;

  return callLLM({ messages: [{ role: "user", content: prompt }], maxTokens: 300 });
}

export type ClientDigestResult =
  | { status: "generated"; digest: string; checkInCount: number }
  | { status: "not_enough_check_ins"; checkInCount: number }
  | { status: "unavailable"; checkInCount: number };

/**
 * On-demand weekly digest for ONE client, triggered by a staff member.
 *
 * This used to be a Sunday cron over every client. It spent the shared free AI
 * pool (one key set across the box's apps) with nobody asking for the result,
 * so it was removed: a model is only called here because a person clicked.
 * `__tests__/cron-no-llm.test.ts` keeps it that way.
 *
 * The digest is stored on the client's most recent check-in (`aiInsight`), which
 * is where the client dashboard and the weekly report email already read it.
 */
export async function generateClientDigest(
  clientId: string,
  clientName: string,
): Promise<ClientDigestResult> {
  const weekCheckIns = await db.query.checkIns.findMany({
    where: and(
      eq(checkIns.userId, clientId),
      gte(checkIns.createdAt, new Date(Date.now() - SEVEN_DAYS_MS)),
    ),
    orderBy: [desc(checkIns.createdAt)],
  });
  const checkInCount = weekCheckIns.length;

  if (checkInCount < AI_DIGEST_MIN_CHECKINS) {
    return { status: "not_enough_check_ins", checkInCount };
  }

  const digest = await generateWeeklyDigest(clientName, weekCheckIns);
  if (!digest) return { status: "unavailable", checkInCount };

  await db.update(checkIns).set({ aiInsight: digest }).where(eq(checkIns.id, weekCheckIns[0].id));
  return { status: "generated", digest, checkInCount };
}
