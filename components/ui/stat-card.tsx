import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  color?: "teal" | "slate" | "amber"
}

const colorMap = {
  teal: "bg-teal-50 text-teal-600",
  slate: "bg-slate-100 text-slate-600",
  amber: "bg-amber-50 text-amber-600",
}

export function StatCard({ label, value, icon: Icon, color = "teal" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-xs text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
