import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { checkInSchema } from "@/lib/domain/profile";
import { eq, and } from "drizzle-orm";
import { forbidden, notFound, okData, parseBody, requireAuth, ok } from "@/lib/api";
import { embedCheckIn } from "@/lib/domain/embeddings";

async function verifyOwnership(id: string, userId: string): Promise<NextResponse | null> {
  const existing = await db.query.checkIns.findFirst({ where: eq(checkIns.id, id) });
  if (!existing) return notFound();
  if (existing.userId !== userId) return forbidden();
  return null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const { id } = await params;
  const ownershipError = await verifyOwnership(id, session.user.id);
  if (ownershipError) return ownershipError;

  const result = await parseBody(req, checkInSchema);
  if (!result.ok) return result.response;

  const [updated] = await db
    .update(checkIns)
    .set(result.data)
    .where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)))
    .returning();

  // Re-embed after edit so semantic search reflects the updated content
  void embedCheckIn(id);

  return okData(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const { id } = await params;
  const ownershipError = await verifyOwnership(id, session.user.id);
  if (ownershipError) return ownershipError;

  await db.delete(checkIns).where(and(eq(checkIns.id, id), eq(checkIns.userId, session.user.id)));

  return ok();
}
