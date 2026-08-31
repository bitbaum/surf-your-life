import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  message: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ message, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 text-center", className)}>
      {icon && <div className="text-border-strong">{icon}</div>}
      <p className="text-ink-muted font-medium">{message}</p>
      {description && <p className="text-sm text-ink-faint">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
