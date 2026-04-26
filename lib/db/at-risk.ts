import { isNull, lt, max, or, type SQL } from "drizzle-orm"
import { checkIns } from "./schema"

/**
 * SQL HAVING fragment for "at-risk" clients: a client whose most recent
 * check-in is older than `cutoff`, OR who has never checked in at all.
 *
 * Use in groupBy queries that aggregate `max(checkIns.createdAt)` per
 * client (typically left-joined from `users`). Single source of truth for
 * the at-risk predicate so the count, preview list, and dedicated page
 * agree on which clients qualify.
 */
export function atRiskHaving(cutoff: Date): SQL<unknown> {
  return or(
    isNull(max(checkIns.createdAt)),
    lt(max(checkIns.createdAt), cutoff)
  )!
}
