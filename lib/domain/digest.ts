import { callClaude } from "@/lib/domain/anthropic";

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
 * Returns null when the API key is absent or the Claude call fails.
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

  return callClaude({ messages: [{ role: "user", content: prompt }], maxTokens: 300 });
}
