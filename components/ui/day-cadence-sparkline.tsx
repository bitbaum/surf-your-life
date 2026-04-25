import { formatDate } from "@/lib/utils"

export type DayState = "missed" | "checkedIn" | "pem"

interface Props {
  /** Day-string keys to render, oldest first (e.g. from `buildLastNDayStrings`). */
  days: string[]
  /** The subset of `days` the user actually checked in on. */
  checkedIn: Set<string>
  /** Days within `checkedIn` that were marked as PEM/crash days. Optional. */
  pemDays?: Set<string>
  /** Tooltip + accessible label for the whole sparkline. */
  hint: string
  /**
   * Localized labels per state. When provided, each dot gets its own
   * tooltip "{date} · {stateLabel}" — much more useful than a single
   * wrapper-level hint when scanning many sparklines.
   */
  dayLabels?: Record<DayState, string>
  /** Dot size — "sm" for tight admin tables, "md" for standalone widgets. Defaults to "sm". */
  size?: "sm" | "md"
}

const DOT_SIZE = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
} as const

const GAP_SIZE = {
  sm: "gap-0.5",
  md: "gap-1",
} as const

export function DayCadenceSparkline({ days, checkedIn, pemDays, hint, dayLabels, size = "sm" }: Props) {
  return (
    <span
      className={`inline-flex items-center ${GAP_SIZE[size]}`}
      aria-label={hint}
      // Wrapper hint stays as the accessible label; per-dot titles take over visually when provided.
      title={dayLabels ? undefined : hint}
    >
      {days.map((day) => {
        const state: DayState =
          pemDays?.has(day) ? "pem"
          : checkedIn.has(day) ? "checkedIn"
          : "missed"
        const fill =
          state === "pem" ? "bg-red-500"
          : state === "checkedIn" ? "bg-teal-500"
          : "bg-slate-200"
        return (
          <span
            key={day}
            className={`${DOT_SIZE[size]} rounded-full ${fill}`}
            title={dayLabels ? `${formatDate(day)} · ${dayLabels[state]}` : undefined}
          />
        )
      })}
    </span>
  )
}
