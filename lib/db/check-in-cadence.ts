import { db } from "."
import { checkIns } from "./schema"
import { and, gte, inArray, sql } from "drizzle-orm"
import { CLINIC_TZ } from "@/lib/constants"

export type CadenceMap = Record<
  string,
  { checkedIn: string[]; pemDays: string[] }
>

/**
 * For each client in `clientIds`, returns the set of clinic-local day-strings
 * they checked in within `since` → now, plus the subset of those days that
 * had a PEM flag. Single batched query bucketed by (userId, day) with
 * `bool_or(pemFlag)` per bucket.
 *
 * Day strings are projected in CLINIC_TZ (Europe/Zurich) so a check-in at
 * 00:30 local counts against today, not yesterday's UTC day. Matches
 * `buildLastNDayStrings` (also clinic-local-anchored).
 *
 * Returns arrays (not Sets) so the result is JSON-serializable across the
 * server→client boundary; callers convert to Sets at the render site.
 */
export async function fetchCadenceMap(
  clientIds: string[],
  since: Date
): Promise<CadenceMap> {
  if (clientIds.length === 0) return {}

  // `created_at` is `timestamp without time zone` (stored as UTC by app
  // convention). AT TIME ZONE 'UTC' interprets the bare timestamp as UTC,
  // then AT TIME ZONE CLINIC_TZ converts to Zurich local time before we
  // extract the date.
  const dayExpr = sql<string>`to_char((${checkIns.createdAt} AT TIME ZONE 'UTC') AT TIME ZONE ${CLINIC_TZ}, 'YYYY-MM-DD')`
  const rows = await db
    .select({
      userId: checkIns.userId,
      day: dayExpr,
      hadPem: sql<boolean>`bool_or(${checkIns.pemFlag})`,
    })
    .from(checkIns)
    .where(and(gte(checkIns.createdAt, since), inArray(checkIns.userId, clientIds)))
    .groupBy(checkIns.userId, dayExpr)

  const out: CadenceMap = {}
  for (const r of rows) {
    const entry = out[r.userId] ?? { checkedIn: [], pemDays: [] }
    entry.checkedIn.push(r.day)
    if (r.hadPem) entry.pemDays.push(r.day)
    out[r.userId] = entry
  }
  return out
}
