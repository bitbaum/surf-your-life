import { cn } from "@/lib/utils"

export type BadgeVariant = "teal" | "blue" | "yellow" | "red" | "slate"

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  teal: "bg-teal-50 text-teal-700 border border-teal-200",
  blue: "bg-blue-50 text-blue-600 border border-blue-200",
  yellow: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  red: "bg-red-50 text-red-600 border border-red-200",
  slate: "bg-slate-100 text-slate-600 border border-slate-200",
}

interface BadgeProps {
  label: string
  variant: BadgeVariant
  className?: string
}

export function Badge({ label, variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
