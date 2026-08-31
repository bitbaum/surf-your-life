import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { contactSchema } from "@/lib/domain/lead";
import { API_ERR_RATE_LIMITED } from "@/lib/constants";
import { created, parseBody } from "@/lib/api";
import { checkRateLimit, ipKey } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const { ok, retryAfterSecs } = checkRateLimit(ipKey(req, "contact"), 5);
  if (!ok) {
    return NextResponse.json(
      { success: false, error: API_ERR_RATE_LIMITED },
      { status: 429, headers: { "Retry-After": String(retryAfterSecs) } },
    );
  }

  const result = await parseBody(req, contactSchema);
  if (!result.ok) return result.response;

  await db.insert(leads).values({
    name: result.data.name,
    email: result.data.email,
    message: result.data.message,
  });

  return created();
}
