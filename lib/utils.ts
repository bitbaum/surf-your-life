import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { CLINIC_TZ, DAY_MS, PAGINATION_DEFAULT } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-CH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Converts snake_case enum values to human-readable display strings.
// e.g. "very_low" → "Very low", "long_covid" → "Long covid"
export function formatEnumValue(value: string): string {
  return value.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
}

// ─── Date helpers ────────────────────────────────────────────────────────────
// The five functions below form a related set; pick by what you need:
//   localDateString(d, tz?)  → day-string in CLINIC_TZ for user-facing dates
//   toDateString(d)          → day-string in UTC for SQL cutoffs / arithmetic
//   dayKey(d)                → stable numeric key for the LOCAL calendar day
//   addDaysISO(s, n)         → shift "YYYY-MM-DD" by N days (DST-safe)
//   buildLastNDayStrings(n)  → last N day-strings ending today in CLINIC_TZ
// All five are DST-safe by construction.

// UTC calendar day of `date` as "YYYY-MM-DD". Use for SQL cutoff filters and
// internal date arithmetic where the "few-hours UTC offset from local" doesn't
// change the result set. For user-facing day bucketing (cadence, streak,
// "today" UI) where the day must match the user's wall clock, use
// `localDateString` instead.
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
}

// Returns `isoDate` ("YYYY-MM-DD") shifted by N calendar days. UTC-stepped
// (parses via Date.UTC, walks via DAY_MS) so DST transitions don't drop or
// duplicate days the way `new Date(isoDate).setDate(getDate() + n)` does
// — that local-day approach silently shifts the underlying ms across the
// spring-forward / fall-back boundary.
export function addDaysISO(isoDate: string, n: number): string {
  const [y, m, d] = isoDate.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d) + n * 86_400_000).toISOString().slice(0, 10)
}

// Calendar day of `date` in the given timezone as "YYYY-MM-DD". Defaults to
// CLINIC_TZ (Europe/Zurich) so check-ins at 00:30 local count against today
// (not yesterday's UTC day). Uses Intl with sv-SE which formats short dates
// as ISO YYYY-MM-DD. Companion to `toDateString` — same shape, different TZ.
export function localDateString(date: Date, tz: string = CLINIC_TZ): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

// Stable numeric key for the LOCAL calendar day of `d`, anchored at UTC
// midnight (so DAY_MS-step arithmetic stays exact across DST — local
// midnights are not all 86_400_000 ms apart on transition days).
//
// Two Date objects on the same local calendar day always return the same key.
// Two Dates one local calendar day apart always differ by exactly DAY_MS.
//
// Use for streak / gap computations on Date arrays. For day-strings, see
// `localDateString` (single date) or `buildLastNDayStrings` (a sequence).
export function dayKey(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

// Returns the last N day strings ("YYYY-MM-DD"), oldest first, ending the
// calendar day of `now` in the given timezone (defaults to CLINIC_TZ).
// Iterates back via UTC-step arithmetic so DST transitions don't shift bucket
// boundaries — only the *anchor* (today) is local; the back-walk is exact.
// Result is consistent with `localDateString` per check-in for set-membership
// comparisons in the cadence sparkline pipeline.
export function buildLastNDayStrings(n: number, now: Date = new Date(), tz: string = CLINIC_TZ): string[] {
  const todayStr = localDateString(now, tz)
  const days: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDaysISO(todayStr, -i))
  }
  return days
}

// Rounds a number to one decimal place for display in stats / summaries.
export function roundOne(n: number): number {
  return Math.round(n * 10) / 10
}

// Pagination helpers — all three used together on every paginated page.
// Centralised here so a change to pagination logic touches one place.

// Parses the ?page= query param safely, clamping to a minimum of 1.
export function parsePage(param: string | undefined): number {
  return Math.max(1, parseInt(param ?? "1") || 1)
}

// Computes the SQL offset for a given 1-based page number and page size.
export function computeOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize
}

// Computes total page count for pagination given a total row count and page size.
export function computeTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}

// Parses page param and computes SQL offset in one call using the default page size.
export function parsePagination(param: string | undefined): { page: number; offset: number } {
  const page = parsePage(param)
  return { page, offset: computeOffset(page, PAGINATION_DEFAULT) }
}

export function daysSince(date: Date): number
export function daysSince(date: Date | null): number | null
export function daysSince(date: Date | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - date.getTime()) / DAY_MS)
}

// Returns the person's name if set, otherwise falls back to the email username.
export function displayName(name: string | null | undefined, email: string): string {
  return name ?? email.split("@")[0]
}

export function groupBy<T>(arr: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of arr) {
    const key = keyFn(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}
