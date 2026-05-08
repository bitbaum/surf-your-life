import * as React from "react"
import { cn } from "@/lib/utils"

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    const select = (
      <select
        id={selectId}
        className={cn(
          "w-full rounded-element border border-border bg-surface px-3 py-2 text-sm text-ink",
          "focus:outline-none focus:ring-2 focus:ring-brand-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px]",
          error && "border-error-ring focus:ring-error-ring",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )

    if (!label) return select

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={selectId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {select}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
