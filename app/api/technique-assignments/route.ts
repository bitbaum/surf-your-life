import { isStaff } from "@/lib/domain/auth";
import { db } from "@/lib/db";
import { techniqueAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createAssignmentSchema } from "@/lib/domain/techniques";
import { CLIENT_ASSIGNMENTS_MAX } from "@/lib/constants";
import { created, okData, parseBody, requireAuth, requireStaffAuth } from "@/lib/api";

export async function GET(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  // Practitioners can query any client; clients can only query themselves
  const targetId = isStaff(session.user.role) ? (clientId ?? session.user.id) : session.user.id;

  const rows = await db.query.techniqueAssignments.findMany({
    where: and(
      eq(techniqueAssignments.clientId, targetId),
      eq(techniqueAssignments.isActive, true),
    ),
    with: { technique: true },
    orderBy: (a, { asc }) => [asc(a.createdAt)],
    limit: CLIENT_ASSIGNMENTS_MAX,
  });

  return okData(rows);
}

export async function POST(req: Request) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;
  const { session } = authResult;

  const result = await parseBody(req, createAssignmentSchema);
  if (!result.ok) return result.response;

  const [assignment] = await db
    .insert(techniqueAssignments)
    .values({
      ...result.data,
      endDate: result.data.endDate ?? null,
      notes: result.data.notes ?? null,
      assignedBy: session.user.id,
    })
    .returning();

  return created(assignment);
}
