/**
 * Embedding generation via OpenAI text-embedding-3-small (1536 dims).
 *
 * Gracefully degrades when OPENAI_API_KEY is absent — never blocks critical
 * paths. "Degrades gracefully" must not mean "degrades invisibly": every
 * failure here is logged and every write outcome is reported to the caller,
 * because the box scheduler discards cron response bodies and a swallowed
 * failure has nowhere else to surface.
 */

import { db } from "@/lib/db";
import { checkIns, documents } from "@/lib/db/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import {
  AI_CONTEXT_CHECKINS,
  EMBEDDING_DIMENSIONS,
  EMBEDDING_MODEL,
  OPENAI_EMBEDDINGS_URL,
} from "@/lib/constants";

async function generateEmbedding(text: string, tag = "embeddings"): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  // A missing key is a configured state, not an anomaly: semantic search is
  // designed to fall back to recency. The callers that CANNOT degrade (the
  // backfill cron) check for the key themselves and fail closed.
  if (!apiKey) return null;

  try {
    const res = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text,
        dimensions: EMBEDDING_DIMENSIONS,
      }),
    });

    if (!res.ok) {
      // The status IS the diagnosis — 401 revoked key, 429 rate limit, 400
      // malformed input, 402 quota. Collapsing all of them into a bare `null`
      // is why production can accumulate zero embeddings without a clue which.
      const body = await res.text().catch(() => "");
      console.error(`[${tag}] OpenAI ${res.status} ${res.statusText}: ${body.slice(0, 200)}`);
      return null;
    }
    const data = await res.json();
    const embedding = data.data?.[0]?.embedding ?? null;
    if (!embedding) console.error(`[${tag}] OpenAI 200 but no embedding in the response`);
    return embedding;
  } catch (err) {
    console.error(`[${tag}] embedding request failed:`, err);
    return null;
  }
}

/**
 * Build a text representation of a check-in suitable for semantic indexing.
 * Structured fields are serialized to prose so the embedding captures clinical meaning.
 */
function checkInToText(row: {
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
}): string {
  const parts: string[] = [];

  if (row.mood) parts.push(`Mood: ${row.mood}`);
  if (row.energyLevel != null) parts.push(`Energy: ${row.energyLevel}/10`);
  if (row.sleepHours != null) parts.push(`Sleep: ${row.sleepHours}h`);
  if (row.activityLevel) parts.push(`Activity: ${row.activityLevel}`);
  if (row.pemFlag)
    parts.push(`PEM: yes${row.pemSeverity != null ? ` (severity ${row.pemSeverity}/10)` : ""}`);
  if (row.symptomFatigue != null) parts.push(`Fatigue: ${row.symptomFatigue}/10`);
  if (row.symptomBrainFog != null) parts.push(`Brain fog: ${row.symptomBrainFog}/10`);
  if (row.symptomPain != null) parts.push(`Pain: ${row.symptomPain}/10`);
  if (row.stressLevel != null) parts.push(`Stress: ${row.stressLevel}/10`);
  if (row.sleepQuality != null) parts.push(`Sleep quality: ${row.sleepQuality}/5`);
  if (row.orthostaticSymptoms) parts.push("Orthostatic symptoms: yes");
  if (row.journalEntry) parts.push(`Journal: ${row.journalEntry}`);
  else {
    if (row.wins) parts.push(`Wins: ${row.wins}`);
    if (row.challenges) parts.push(`Challenges: ${row.challenges}`);
    if (row.notes) parts.push(`Notes: ${row.notes}`);
  }

  return parts.join(". ");
}

/**
 * Generate and store an embedding for the given check-in.
 *
 * Returns whether an embedding was actually WRITTEN. Request-path callers keep
 * ignoring it (`void embedCheckIn(id)`) — this never throws, so a failed
 * embedding still cannot break a check-in. The backfill cron needs the answer:
 * counting attempts instead of writes is what let it report "fully caught up"
 * every night while every row stayed un-embedded.
 */
export async function embedCheckIn(checkInId: string): Promise<boolean> {
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
    });
    if (!row) {
      console.error(`[embed-check-in] ${checkInId} not found`);
      return false;
    }

    const text = checkInToText(row);
    if (!text) {
      console.error(`[embed-check-in] ${checkInId} has no embeddable content`);
      return false;
    }

    const embedding = await generateEmbedding(text, "embed-check-in");
    if (!embedding) return false;

    await db
      .update(checkIns)
      .set({ embedding: sql`${JSON.stringify(embedding)}::vector` })
      .where(eq(checkIns.id, checkInId));
    return true;
  } catch (err) {
    // Never propagate to the caller — but never vanish either.
    console.error(`[embed-check-in] ${checkInId} failed:`, err);
    return false;
  }
}

/**
 * Generate and store an embedding for the given document.
 * Returns whether an embedding was actually written; never throws. See
 * embedCheckIn for why the boolean matters.
 */
export async function embedDocument(documentId: string): Promise<boolean> {
  try {
    const row = await db.query.documents.findFirst({
      where: eq(documents.id, documentId),
      columns: { title: true, content: true, type: true },
    });
    // A document with no extracted content has nothing to embed. That is a
    // real terminal state, not a transient error: it will never succeed on a
    // later run, so the backfill must not keep reporting it as pending work.
    if (!row || !row.content) {
      console.error(`[embed-document] ${documentId} ${row ? "has no content" : "not found"}`);
      return false;
    }

    const text = [row.title, row.content].filter(Boolean).join("\n\n");
    const embedding = await generateEmbedding(text, "embed-document");
    if (!embedding) return false;

    await db
      .update(documents)
      .set({ embedding: sql`${JSON.stringify(embedding)}::vector` })
      .where(eq(documents.id, documentId));
    return true;
  } catch (err) {
    console.error(`[embed-document] ${documentId} failed:`, err);
    return false;
  }
}

/**
 * Semantic search over a user's check-ins using cosine similarity.
 * Returns the most relevant check-ins for a given query, ordered by relevance.
 * Falls back to null when embeddings are unavailable (no OPENAI_API_KEY or no
 * embedded check-ins yet) — callers should use recency-based fallback.
 */
export async function semanticCheckInSearch(
  userId: string,
  query: string,
  limit: number = AI_CONTEXT_CHECKINS,
): Promise<
  | {
      id: string;
      createdAt: Date;
      mood: string | null;
      energyLevel: number | null;
      sleepHours: number | null;
      sleepQuality: number | null;
      activityLevel: string | null;
      pemFlag: boolean | null;
      pemSeverity: number | null;
      orthostaticSymptoms: boolean | null;
      symptomFatigue: number | null;
      symptomBrainFog: number | null;
      symptomPain: number | null;
      stressLevel: number | null;
      journalEntry: string | null;
      wins: string | null;
      challenges: string | null;
      notes: string | null;
    }[]
  | null
> {
  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) return null;

  try {
    const rows = await db
      .select({
        id: checkIns.id,
        createdAt: checkIns.createdAt,
        mood: checkIns.mood,
        energyLevel: checkIns.energyLevel,
        sleepHours: checkIns.sleepHours,
        sleepQuality: checkIns.sleepQuality,
        activityLevel: checkIns.activityLevel,
        pemFlag: checkIns.pemFlag,
        pemSeverity: checkIns.pemSeverity,
        orthostaticSymptoms: checkIns.orthostaticSymptoms,
        symptomFatigue: checkIns.symptomFatigue,
        symptomBrainFog: checkIns.symptomBrainFog,
        symptomPain: checkIns.symptomPain,
        stressLevel: checkIns.stressLevel,
        journalEntry: checkIns.journalEntry,
        wins: checkIns.wins,
        challenges: checkIns.challenges,
        notes: checkIns.notes,
      })
      .from(checkIns)
      .where(and(eq(checkIns.userId, userId), isNotNull(checkIns.embedding)))
      .orderBy(sql`embedding <=> ${JSON.stringify(queryEmbedding)}::vector`)
      .limit(limit);

    return rows.length > 0 ? rows : null;
  } catch {
    return null;
  }
}
