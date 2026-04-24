/**
 * Cron job: backfill embeddings for check-ins and documents that don't have one.
 * Runs daily; once all records are embedded it becomes a no-op.
 * Processes up to EMBED_BACKFILL_BATCH records per table per run to avoid timeouts.
 */
import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { checkIns, documents } from "@/lib/db/schema"
import { isNull } from "drizzle-orm"
import { embedCheckIn, embedDocument } from "@/lib/domain/embeddings"
import { EMBED_BACKFILL_BATCH , API_ERR_UNAUTHORIZED } from "@/lib/constants"

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  // No OPENAI_API_KEY means nothing to do
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ success: true, message: "OPENAI_API_KEY not set — skipping" })
  }

  // Find un-embedded check-ins
  const unembeddedCheckIns = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(isNull(checkIns.embedding))
    .limit(EMBED_BACKFILL_BATCH)

  // Find un-embedded documents that have content
  const unembeddedDocs = await db
    .select({ id: documents.id })
    .from(documents)
    .where(isNull(documents.embedding))
    .limit(EMBED_BACKFILL_BATCH)

  // Process sequentially to avoid hammering the OpenAI rate limit.
  // Per-item try-catch ensures one failure doesn't abort the entire batch.
  let checkInsProcessed = 0
  let checkInsFailed = 0
  for (const { id } of unembeddedCheckIns) {
    try {
      await embedCheckIn(id)
      checkInsProcessed++
    } catch (err) {
      console.error("[embed-backfill] check-in", id, err)
      checkInsFailed++
    }
  }

  let docsProcessed = 0
  let docsFailed = 0
  for (const { id } of unembeddedDocs) {
    try {
      await embedDocument(id)
      docsProcessed++
    } catch (err) {
      console.error("[embed-backfill] document", id, err)
      docsFailed++
    }
  }

  return NextResponse.json({
    success: true,
    checkInsProcessed,
    docsProcessed,
    ...(checkInsFailed > 0 && { checkInsFailed }),
    ...(docsFailed > 0 && { docsFailed }),
    remaining: unembeddedCheckIns.length === EMBED_BACKFILL_BATCH || unembeddedDocs.length === EMBED_BACKFILL_BATCH
      ? "more records may exist"
      : "fully caught up",
  })
}
