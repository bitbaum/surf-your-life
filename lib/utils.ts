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
