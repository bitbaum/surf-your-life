import { randomBytes } from "crypto";
import { z } from "zod";
import { SITE_URL, HOUR_MS } from "@/lib/constants";
import { okData, parseBody, requireStaffAuth } from "@/lib/api";
import { routing } from "@/i18n/routing";
import { sharedAuth } from "@/lib/auth/shared/runtime";

const schema = z.object({ userId: z.string().uuid() });

/**
 * A password-reset link a practitioner hands to a client in person. It is
 * AccountKit's own reset token (the record better-auth's request-password-reset
 * writes: `reset-password:<token>` → the user id, one hour), so the link runs
 * through AccountKit's reset like a mailed one: validated, then the sign-in
 * page sets the new password and every session ends.
 */
export async function POST(req: Request) {
  const authResult = await requireStaffAuth();
  if (!authResult.ok) return authResult.response;

  const result = await parseBody(req, schema);
  if (!result.ok) return result.response;

  const context = await sharedAuth.getAuth().$context;
  const user = await context.internalAdapter.findUserById(result.data.userId);
  if (!user) {
    return Response.json({ success: false, error: "Not found" }, { status: 404 });
  }

  const token = randomBytes(24).toString("base64url");
  await context.internalAdapter.createVerificationValue({
    identifier: `reset-password:${token}`,
    value: user.id,
    expiresAt: new Date(Date.now() + HOUR_MS),
  });

  const signIn = `/${routing.defaultLocale}/login`;
  const link = `${SITE_URL}/api/auth/reset-password/${token}?callbackURL=${encodeURIComponent(signIn)}`;
  return okData({ link });
}
