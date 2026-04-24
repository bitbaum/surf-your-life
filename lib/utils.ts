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

// Computes total page count for pagination given a total row count and page size.
export function computeTotalPages(total: number, pageSize: number): number {
  return Math.ceil(total / pageSize)
}
