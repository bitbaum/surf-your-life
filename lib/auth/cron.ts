import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"

/**
 * Validates the cron job Bearer token.
 * Returns a 401 NextResponse when the header is missing or wrong,
 * or null when auth passes (caller continues normally).
 *
 * Fails CLOSED: if CRON_SECRET is unset or empty, every request is denied.
 * The previous implementation compared against `Bearer ${process.env.CRON_SECRET}`,
 * which evaluates to the literal string "Bearer undefined" when the variable is
 * missing — so an unset secret authorized anyone who sent that header. These
 * routes send reminders, run the weekly report, the AI digest, and the embedding
 * backfill; none of them should ever run for an unauthenticated caller.
 */
export function verifyCronAuth(req: Request): NextResponse | null {
  const expected = process.env.CRON_SECRET
  if (!expected || expected.length === 0) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const header = req.headers.get("authorization")
  if (!header || !header.startsWith("Bearer ")) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }

  const provided = header.slice("Bearer ".length)
  if (!secretsMatch(provided, expected)) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }
  return null
}

/** Constant-time comparison; length mismatch short-circuits (timingSafeEqual throws on it). */
function secretsMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
