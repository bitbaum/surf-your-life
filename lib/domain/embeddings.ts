/**
 * Embedding generation via OpenAI text-embedding-3-small (1536 dims).
 * Gracefully degrades when OPENAI_API_KEY is absent — never blocks critical paths.
 */

import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"

async function generateEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: text,
        dimensions: 1536,
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.data?.[0]?.embedding ?? null
  } catch {
    return null
  }
}

/**
 * Build a text representation of a check-in suitable for semantic indexing.
 * Structured fields are serialized to prose so the embedding captures clinical meaning.
 */
function checkInToText(row: {
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
}): string {
  const parts: string[] = []

  if (row.mood) parts.push(`Mood: ${row.mood}`)
  if (row.energyLevel != null) parts.push(`Energy: ${row.energyLevel}/10`)
  if (row.sleepHours != null) parts.push(`Sleep: ${row.sleepHours}h`)
  if (row.activityLevel) parts.push(`Activity: ${row.activityLevel}`)
  if (row.pemFlag) parts.push(`PEM: yes${row.pemSeverity != null ? ` (severity ${row.pemSeverity}/10)` : ""}`)
  if (row.symptomFatigue != null) parts.push(`Fatigue: ${row.symptomFatigue}/10`)
  if (row.symptomBrainFog != null) parts.push(`Brain fog: ${row.symptomBrainFog}/10`)
  if (row.symptomPain != null) parts.push(`Pain: ${row.symptomPain}/10`)
  if (row.stressLevel != null) parts.push(`Stress: ${row.stressLevel}/10`)
  if (row.sleepQuality != null) parts.push(`Sleep quality: ${row.sleepQuality}/5`)
  if (row.orthostaticSymptoms) parts.push("Orthostatic symptoms: yes")
  if (row.journalEntry) parts.push(`Journal: ${row.journalEntry}`)
  else {
    if (row.wins) parts.push(`Wins: ${row.wins}`)
    if (row.challenges) parts.push(`Challenges: ${row.challenges}`)
    if (row.notes) parts.push(`Notes: ${row.notes}`)
  }

  return parts.join(". ")
}

/**
 * Generate and store an embedding for the given check-in.
 * Called fire-and-forget after check-in creation — never throws.
 */
export async function embedCheckIn(checkInId: string): Promise<void> {
  try {
    const row = await db.query.checkIns.findFirst({
      where: eq(checkIns.id, checkInId),
      columns: {
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
    })
    if (!row) return

    const text = checkInToText(row)
    if (!text) return

    const embedding = await generateEmbedding(text)
    if (!embedding) return

    await db
      .update(checkIns)
      .set({ embedding: sql`${JSON.stringify(embedding)}::vector` })
      .where(eq(checkIns.id, checkInId))
  } catch {
    // Never surface embedding failures to callers
  }
}
