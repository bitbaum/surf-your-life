import { cn } from "@/lib/utils"

interface ProgressBarProps {
  /** Percentage 0–100. Clamped automatically. */
  value: number
  /** h-1.5 (sm) or h-2 (md). Default md. */
  size?: "sm" | "md"
  /** Track background. Use "teal" when the bar sits inside a teal-tinted surface. */
  track?: "teal" | "slate"
  className?: string
}

export function ProgressBar({ value, size = "md", track = "slate", className }: ProgressBarProps) {
  const pct = Math.min(Math.max(value, 0), 100)
  return (
    <div
      className={cn(
        "rounded-full overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2",
        track === "teal" ? "bg-teal-100" : "bg-slate-100",
        className
      )}
    >
      <div
        className="h-full rounded-full bg-teal-500 transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
