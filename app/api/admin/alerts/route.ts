import { db } from "@/lib/db";
import { clientAlerts } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { requireStaffAuth, ok, parseBody } from "@/lib/api";
import { z } from "zod";

const schema = z.object({ ids: z.array(z.string().uuid()).min(1).max(200) });

export async function PATCH(req: Request) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const parsed = await parseBody(req, schema);
  if (!parsed.ok) return parsed.response;

  const now = new Date();
  await db
    .update(clientAlerts)
    .set({ isResolved: true, resolvedAt: now })
    .where(and(inArray(clientAlerts.id, parsed.data.ids), eq(clientAlerts.isResolved, false)));

  return ok();
}
