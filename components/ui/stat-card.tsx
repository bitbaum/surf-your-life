import { cn } from "@/lib/utils"
import { Link } from "@/i18n/navigation"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: "teal" | "slate" | "amber"
  href?: string
}

const colorMap = {
  teal:  "bg-brand-subtle text-brand",
  slate: "bg-surface-muted text-ink-muted",
  amber: "bg-warning-subtle text-warning",
}

export function StatCard({ label, value, icon: Icon, color = "teal", href }: StatCardProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="text-xs text-ink-muted">{label}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block rounded-card border border-border bg-surface shadow-card p-6 hover:border-brand-dim hover:shadow-elevated transition-all">
        {inner}
      </Link>
    )
  }

  return (
    <div className="rounded-card border border-border bg-surface shadow-card p-6">
      {inner}
    </div>
  )
}
