/**
 * On-demand weekly AI digest for one client (staff only).
 *
 * Replaces the Sunday `/api/cron/ai-digest` job: nothing unattended may spend
 * the shared free AI pool, so a digest is produced only when a practitioner
 * asks for it, and each practitioner is rate-limited.
 */
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { CLIENT_ROLE } from "@/lib/domain/auth";
import { generateClientDigest } from "@/lib/domain/digest";
import { checkRateLimit } from "@/lib/rate-limit";
import { AI_DIGEST_RATE_LIMIT, API_ERR_RATE_LIMITED } from "@/lib/constants";
import { notFound, okData, requireStaffAuth } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  // Keyed on the signed-in user, not the IP: the budget being protected is
  // per person, and the session cannot be forged the way a header can.
  const { ok, retryAfterSecs } = checkRateLimit(
    `ai-digest:${authResult.session.user.id}`,
    AI_DIGEST_RATE_LIMIT,
  );
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } },
    );
  }

  const { id: clientId } = await params;
  const client = await db.query.users.findFirst({
    where: and(eq(users.id, clientId), eq(users.role, CLIENT_ROLE)),
    columns: { name: true },
  });
  if (!client) return notFound();

  return okData(await generateClientDigest(clientId, client.name ?? "Client"));
}
