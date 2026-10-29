import * as React from "react";
import { cn } from "@/lib/utils";
import { DateInput } from "@/components/ui/date-input";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    const fieldClass = cn(
      "flex h-10 w-full rounded-element border border-border bg-surface px-3 py-2 text-sm",
      "placeholder:text-ink-faint focus:outline-none focus:ring-2 focus:ring-brand-ring focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50",
      error && "border-error-ring focus:ring-error-ring",
      className,
    );
    // A date is picked, not typed: the value reads in words in this same field
    // styling, and the platform picker still opens on tap (@bitbaum/whenkit).
    const isDate = props.type === "date" || props.type === "datetime-local";
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        {isDate ? (
          <DateInput
            id={inputId}
            {...(props as React.ComponentProps<typeof DateInput>)}
            type={props.type as "date" | "datetime-local"}
            className={fieldClass}
            aria-invalid={error ? true : undefined}
            ref={ref}
          />
        ) : (
          <input id={inputId} className={fieldClass} ref={ref} {...props} />
        )}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
