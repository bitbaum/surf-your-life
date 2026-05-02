import { db } from "."
import { checkIns } from "./schema"
import { and, gte, inArray, sql } from "drizzle-orm"
import { CLINIC_TZ, SEVEN_DAYS_MS } from "@/lib/constants"
import { computeWeekDelta } from "@/lib/domain/check-in"

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

export type EnergyTrend = "up" | "down" | "stable"

/**
 * For each client in `clientIds`, fetches 14 days of check-ins and returns
 * the week-over-week energy direction: "up" (≥+1.0), "down" (≤−1.0), or
 * "stable". Clients with no prior-week data are omitted from the map.
 */
export async function fetchEnergyTrendMap(
  clientIds: string[],
  staleCutoff: Date
): Promise<Map<string, EnergyTrend>> {
  if (clientIds.length === 0) return new Map()

  const fourteenDaysAgo = new Date(staleCutoff.getTime() - SEVEN_DAYS_MS)
  const rows = await db
    .select({
      userId: checkIns.userId,
      createdAt: checkIns.createdAt,
      energyLevel: checkIns.energyLevel,
      stressLevel: checkIns.stressLevel,
      pemFlag: checkIns.pemFlag,
    })
    .from(checkIns)
    .where(and(inArray(checkIns.userId, clientIds), gte(checkIns.createdAt, fourteenDaysAgo)))

  const byClient = new Map<string, typeof rows>()
  for (const r of rows) {
    const arr = byClient.get(r.userId) ?? []
    arr.push(r)
    byClient.set(r.userId, arr)
  }

  const out = new Map<string, EnergyTrend>()
  for (const [clientId, clientRows] of byClient) {
    const delta = computeWeekDelta(clientRows)
    if (!delta.hasPriorWindow || delta.energyDelta == null) continue
    if (delta.energyDelta >= 1.0) out.set(clientId, "up")
    else if (delta.energyDelta <= -1.0) out.set(clientId, "down")
    else out.set(clientId, "stable")
  }
  return out
}
