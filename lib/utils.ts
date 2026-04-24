import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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

// Returns the date portion of a Date as an ISO string "YYYY-MM-DD".
// Use for date inputs and day-level comparisons (avoids duplicating .toISOString().split("T")[0]).
export function toDateString(date: Date): string {
  return date.toISOString().split("T")[0]
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
