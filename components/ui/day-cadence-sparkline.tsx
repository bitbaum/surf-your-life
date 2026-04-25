interface Props {
  /** Day-string keys to render, oldest first (e.g. from `buildLastNDayStrings`). */
  days: string[]
  /** The subset of `days` the user actually checked in on. */
  checkedIn: Set<string>
  /** Tooltip + accessible label. */
  hint: string
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

export function DayCadenceSparkline({ days, checkedIn, hint, size = "sm" }: Props) {
  return (
    <span
      className={`inline-flex items-center ${GAP_SIZE[size]}`}
      aria-label={hint}
      title={hint}
    >
      {days.map((day) => (
        <span
          key={day}
          className={`${DOT_SIZE[size]} rounded-full ${checkedIn.has(day) ? "bg-teal-500" : "bg-slate-200"}`}
        />
      ))}
    </span>
  )
}
