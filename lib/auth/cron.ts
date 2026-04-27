import { NextResponse } from "next/server"
import { API_ERR_UNAUTHORIZED } from "@/lib/constants"

/**
 * Validates the cron job Bearer token.
 * Returns a 401 NextResponse when the header is missing or wrong,
 * or null when auth passes (caller continues normally).
 */
export function verifyCronAuth(req: Request): NextResponse | null {
  const authHeader = req.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ success: false, error: API_ERR_UNAUTHORIZED }, { status: 401 })
  }
  return null
}
