import { db } from "@/lib/db";
import { programEnrollments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateEnrollmentSchema } from "@/lib/domain/program";
import { notFound, parseBody, requireStaffAuth, ok } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  const result = await parseBody(req, updateEnrollmentSchema);
  if (!result.ok) return result.response;

  const enrollment = await db.query.programEnrollments.findFirst({
    where: eq(programEnrollments.id, id),
  });
  if (!enrollment) {
    return notFound();
  }

  await db
    .update(programEnrollments)
    .set({
      status: result.data.status,
      ...(result.data.notes !== undefined ? { notes: result.data.notes } : {}),
    })
    .where(eq(programEnrollments.id, id));

  return ok();
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const { id } = await params;

  await db.delete(programEnrollments).where(eq(programEnrollments.id, id));

  return ok();
}
