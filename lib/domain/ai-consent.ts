/**
 * Explicit AI consent — the one gate every AI path passes through.
 *
 * A client's data reaches a model vendor (Groq, OpenRouter) or the embedding
 * vendor (OpenAI) only while that client's latest decision is `granted`. That
 * holds for the paths the client starts (assistant, check-in AI help) and for
 * the ones a practitioner starts about them (session prep, weekly digest): the
 * data is the client's, so the client's consent governs.
 *
 * The check is server-side, at the point just before the vendor call, so a UI
 * that forgets to hide a button still cannot send anything. Without consent each
 * caller takes its existing non-AI path (rule-based reply, keyword parser,
 * rule-based summary) or reports that AI is off — it never calls the model.
 *
 * Decisions are appended, never updated (`ai_consent_events`), so the table is
 * the timestamped record of each grant and withdrawal.
 */
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { aiConsentEvents, checkIns, documents } from "@/lib/db/schema";

/**
 * The version of the consent wording a decision was made against. Bump it when
 * the consent screen or privacy policy section 6 changes what is sent, to whom
 * or why; the stored version then shows which text each client agreed to.
 */
export const AI_CONSENT_POLICY_VERSION = "2026-10";

export type AiConsentAction = (typeof aiConsentEvents.action.enumValues)[number];

/** `unasked` = no decision yet: the one case in which the portal asks. */
export type AiConsentState = AiConsentAction | "unasked";

export const aiConsentDecisionSchema = z.object({
  action: z.enum(aiConsentEvents.action.enumValues),
});

/** The client's current decision and when it was made (null when unasked). */
export async function getAiConsent(
  userId: string,
): Promise<{ state: AiConsentState; decidedAt: Date | null }> {
  const latest = await db.query.aiConsentEvents.findFirst({
    where: eq(aiConsentEvents.userId, userId),
    orderBy: [desc(aiConsentEvents.createdAt)],
    columns: { action: true, createdAt: true },
  });
  return { state: latest?.action ?? "unasked", decidedAt: latest?.createdAt ?? null };
}

/**
 * True only when this client's latest decision is an explicit yes. Fails
 * closed: any error reading the record counts as no consent.
 */
export async function hasAiConsent(userId: string): Promise<boolean> {
  try {
    return (await getAiConsent(userId)).state === "granted";
  } catch (err) {
    console.error("[ai-consent] could not read consent, treating as not granted:", err);
    return false;
  }
}

/**
 * SQL list of the users whose latest decision is `granted` — for bulk jobs
 * (the embedding backfill) that must skip everyone else in the query itself.
 */
export const usersWithAiConsent = sql`(
  select latest.user_id from (
    select distinct on (user_id) user_id, action
    from ai_consent_events
    order by user_id, created_at desc
  ) latest
  where latest.action = 'granted'
)`;

/**
 * Append a decision. A withdrawal (or any answer other than yes) also deletes
 * the search indexes (embeddings) computed from this client's check-ins and
 * documents, so semantic search stops using them at once; if consent is given
 * again, the backfill rebuilds them.
 */
export async function recordAiConsent(userId: string, action: AiConsentAction) {
  const [event] = await db
    .insert(aiConsentEvents)
    .values({ userId, action, policyVersion: AI_CONSENT_POLICY_VERSION })
    .returning({ action: aiConsentEvents.action, createdAt: aiConsentEvents.createdAt });

  // Any answer other than yes ends semantic search over this client's data at
  // once. For a "Not now" with no earlier yes there is nothing to clear.
  if (action !== "granted") {
    await Promise.all([
      db.update(checkIns).set({ embedding: null }).where(eq(checkIns.userId, userId)),
      db.update(documents).set({ embedding: null }).where(eq(documents.userId, userId)),
    ]);
  }

  return event;
}
