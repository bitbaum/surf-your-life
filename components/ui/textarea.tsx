import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    const textarea = (
      <textarea
        id={textareaId}
        className={cn(
          "w-full rounded-element border border-border px-3 py-2 text-sm text-ink",
          "placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-ring focus:border-transparent",
          "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          error && "border-error-ring focus:ring-error-ring",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!label) return textarea

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={textareaId} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {textarea}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
