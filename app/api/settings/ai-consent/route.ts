/**
 * The signed-in client's AI consent decision.
 *
 * POST { action: "granted" | "declined" | "withdrawn" } appends a timestamped
 * row for the signed-in user only — no one can record a decision for someone
 * else. The decision applies from the next request: every AI path reads it
 * server-side (lib/domain/ai-consent), so a withdrawal is effective at once.
 */
import { okData, parseBody, requireAuth } from "@/lib/api";
import { aiConsentDecisionSchema, recordAiConsent } from "@/lib/domain/ai-consent";

export async function POST(req: Request) {
  const authResult = await requireAuth();
  if (!authResult.ok) return authResult.response;

  const result = await parseBody(req, aiConsentDecisionSchema);
  if (!result.ok) return result.response;

  const event = await recordAiConsent(authResult.session.user.id, result.data.action);
  return okData(event);
}
