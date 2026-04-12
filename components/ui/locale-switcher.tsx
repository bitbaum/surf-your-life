"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const labels: Record<string, string> = { de: "DE", en: "EN", fr: "FR" }

interface LocaleSwitcherProps {
  /** Compact mode: smaller padding, used in mobile top bars */
  compact?: boolean
  /** Dark mode: inverted colours for dark sidebars */
  dark?: boolean
}

export function LocaleSwitcher({ compact, dark }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next })
  }

  return (
    <div className="flex items-center gap-1">
      {routing.locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={[
            "text-xs font-medium rounded transition-colors",
            compact ? "px-1.5 py-0.5" : "px-2 py-1",
            l === locale
              ? dark
                ? "text-teal-400 bg-slate-800"
                : "text-teal-600 bg-teal-50"
              : dark
              ? "text-slate-500 hover:text-slate-200"
              : "text-slate-400 hover:text-slate-700",
          ].join(" ")}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  )
}
