import Link from "next/link"
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
            "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border",
            active === value
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
