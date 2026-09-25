/**
 * Reading a stored session prep. Deliberately free of any model import: the
 * client page calls this during render, and render must never spend the shared
 * free AI pool (__tests__/cron-no-llm.test.ts enforces it). Generating a new
 * prep lives in POST /api/admin/clients/[id]/session-prep, behind a click.
 */
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessionPreps } from "@/lib/db/schema";

export type SessionPrepView = Pick<
  typeof sessionPreps.$inferSelect,
  "summary" | "aiGenerated" | "stats" | "createdAt"
>;

export async function getLatestSessionPrep(clientId: string): Promise<SessionPrepView | null> {
  const row = await db.query.sessionPreps.findFirst({
    where: eq(sessionPreps.clientId, clientId),
    orderBy: [desc(sessionPreps.createdAt)],
    columns: { summary: true, aiGenerated: true, stats: true, createdAt: true },
  });
  return row ?? null;
}
