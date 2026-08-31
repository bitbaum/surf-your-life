import { db } from "@/lib/db";
import { medicationLog } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { notFound, parseBody, requireAuth, ok } from "@/lib/api";

const patchSchema = z.object({
  endDate: z.string().optional().nullable(), // YYYY-MM-DD or null to clear
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const parseResult = await parseBody(req, patchSchema);
  if (!parseResult.ok) return parseResult.response;

  const result = await db
    .update(medicationLog)
    .set({ endDate: parseResult.data.endDate ?? null })
    .where(and(eq(medicationLog.id, id), eq(medicationLog.userId, session.user.id)))
    .returning({ id: medicationLog.id });

  if (result.length === 0) {
    return notFound();
  }

  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  await db
    .delete(medicationLog)
    .where(and(eq(medicationLog.id, id), eq(medicationLog.userId, session.user.id)));

  return ok();
}
