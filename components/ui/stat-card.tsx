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
  teal: "bg-teal-50 text-teal-600",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-600",
}

export function StatCard({ label, value, icon: Icon, color = "teal", href }: StatCardProps) {
  const inner = (
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block rounded-xl border border-slate-200 bg-white shadow-sm p-6 hover:border-teal-300 hover:shadow-md transition-all">
        {inner}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
      {inner}
    </div>
  )
}
