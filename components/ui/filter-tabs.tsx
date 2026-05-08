import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface FilterTab<T extends string> {
  value: T
  label: string
}

interface FilterTabsProps<T extends string> {
  tabs: FilterTab<T>[]
  active: T
  href: (value: T) => string
}

export function FilterTabs<T extends string>({ tabs, active, href }: FilterTabsProps<T>) {
  return (
    <div className="flex gap-1 mb-4 flex-wrap">
      {tabs.map(({ value, label }) => (
        <Link
          key={value}
          href={href(value)}
          className={cn(
            "px-4 py-1.5 rounded-element text-sm font-medium transition-colors border",
            active === value
              ? "bg-brand text-white border-brand"
              : "bg-surface text-ink-muted border-border hover:bg-surface-subtle"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
