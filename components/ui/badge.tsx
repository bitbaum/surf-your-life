import { cn } from "@/lib/utils";

export type BadgeVariant = "teal" | "blue" | "yellow" | "red" | "slate";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  teal: "bg-brand-subtle text-brand-dark border border-brand-dim",
  blue: "bg-info-subtle text-info border border-info-dim",
  yellow: "bg-caution-subtle text-caution-dark border border-caution-dim",
  red: "bg-error-subtle text-error border border-error-dim",
  slate: "bg-surface-muted text-ink-muted border border-border",
};

interface BadgeProps {
  label: string;
  variant: BadgeVariant;
  className?: string;
}

export function Badge({ label, variant, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-pill text-xs font-medium",
        VARIANT_STYLES[variant],
        className,
      )}
    >
      {label}
    </span>
  );
}
