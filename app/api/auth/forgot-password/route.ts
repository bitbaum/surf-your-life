import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, passwordResetTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";
import { sendEmailFire } from "@/lib/email";
import { passwordResetEmail } from "@/lib/email/templates";
import { HOUR_MS, API_ERR_RATE_LIMITED } from "@/lib/constants";
import { parseBody, ok } from "@/lib/api";
import { EMAIL_SUBJECT_RESET_PASSWORD } from "@/lib/email/subjects";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const { ok: rateOk, retryAfterSecs } = checkRateLimit(ipKey(req, "forgot-password"), 3);
  if (!rateOk) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } },
    );
  }

  const result = await parseBody(req, schema);
  if (!result.ok) return result.response;

  const { email } = result.data;

  // Look up user — always return 200 to prevent email enumeration
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });

  if (user) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + HOUR_MS);

    // Invalidate any existing tokens, then insert a fresh one
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.userId, user.id));

    await db.insert(passwordResetTokens).values({ userId: user.id, token, expiresAt });

    // Derive origin from the request itself so the link works on any host
    // (localhost in dev, the real domain in production)
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "localhost:3000";
    const proto =
      req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    const resetUrl = `${proto}://${host}/reset-password?token=${token}`;
    sendEmailFire(
      { to: email, subject: EMAIL_SUBJECT_RESET_PASSWORD, html: passwordResetEmail({ resetUrl }) },
      "forgot-password",
    );
  }

  return ok();
}
