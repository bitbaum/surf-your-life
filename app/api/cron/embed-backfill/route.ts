/**
 * Cron job: backfill embeddings for check-ins and documents that don't have one.
 * Runs daily; once all records are embedded it becomes a no-op.
 * Processes up to EMBED_BACKFILL_BATCH records per table per run to avoid timeouts.
 *
 * This job reports what it ACHIEVED, not what it attempted. The box scheduler
 * curls it with `-o /dev/null`, so the HTTP status and the app journal are the
 * only two signals that exist — which is exactly how it ran nightly against a
 * database where every single row was un-embedded, answered 200, and said
 * "fully caught up" every time.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkIns, documents } from "@/lib/db/schema"
import { count, isNull } from "drizzle-orm"
import { embedCheckIn, embedDocument } from "@/lib/domain/embeddings"
import { verifyCronAuth } from "@/lib/auth/cron"
import { EMBED_BACKFILL_BATCH } from "@/lib/constants"

/** Rows still lacking an embedding — the ground truth, not batch arithmetic. */
async function countUnembedded() {
  const [ci] = await db.select({ n: count() }).from(checkIns).where(isNull(checkIns.embedding))
  const [doc] = await db.select({ n: count() }).from(documents).where(isNull(documents.embedding))
  return { checkIns: ci?.n ?? 0, documents: doc?.n ?? 0 }
}

export async function GET(req: Request) {
  const authError = verifyCronAuth(req)
  if (authError) return authError

  if (!process.env.OPENAI_API_KEY) {
    // Fail closed in production, same rule as RESEND_API_KEY in lib/email: a
    // scheduled job that cannot possibly do its work must not answer 200. The
    // runner uses `curl -fsS`, so a non-2xx fails the systemd oneshot and pages
    // instead of accumulating silence. Dev keeps the no-op so local runs need
    // no OpenAI account.
    if (process.env.NODE_ENV === "production") {
      console.error("[embed-backfill] OPENAI_API_KEY is not set — no embedding can be generated")
      return NextResponse.json(
        { success: false, error: "OPENAI_API_KEY is not set" },
        { status: 503 }
      )
    }
    return NextResponse.json({ success: true, message: "OPENAI_API_KEY not set — skipping" })
  }

  const unembeddedCheckIns = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(isNull(checkIns.embedding))
    .limit(EMBED_BACKFILL_BATCH)

  const unembeddedDocs = await db
    .select({ id: documents.id })
    .from(documents)
    .where(isNull(documents.embedding))
    .limit(EMBED_BACKFILL_BATCH)

  // Sequential, to avoid hammering the OpenAI rate limit. embedCheckIn and
  // embedDocument never throw and return whether a row was actually written,
  // so one failure cannot abort the batch and cannot be miscounted as a write.
  let checkInsEmbedded = 0
  let checkInsFailed = 0
  for (const { id } of unembeddedCheckIns) {
    if (await embedCheckIn(id)) checkInsEmbedded++
    else checkInsFailed++
  }

  let docsEmbedded = 0
  let docsFailed = 0
  for (const { id } of unembeddedDocs) {
    if (await embedDocument(id)) docsEmbedded++
    else docsFailed++
  }

  const remaining = await countUnembedded()
  const failed = checkInsFailed + docsFailed
  if (failed > 0) {
    console.error(
      `[embed-backfill] ${failed} of ${unembeddedCheckIns.length + unembeddedDocs.length} records could not be embedded`
    )
  }

  return NextResponse.json({
    success: failed === 0,
    checkInsEmbedded,
    docsEmbedded,
    ...(checkInsFailed > 0 && { checkInsFailed }),
    ...(docsFailed > 0 && { docsFailed }),
    // Counted, not inferred. The previous version derived this from whether the
    // batch came back full, so a 16-row backlog under a 50-row batch reported
    // "fully caught up" while embedding nothing.
    remainingCheckIns: remaining.checkIns,
    remainingDocuments: remaining.documents,
  })
}
