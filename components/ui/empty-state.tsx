import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

interface EmptyStateProps {
  message: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ message, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      {icon && <div className="text-slate-300">{icon}</div>}
      <p className="text-slate-500 font-medium">{message}</p>
      {description && <p className="text-sm text-slate-400">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
