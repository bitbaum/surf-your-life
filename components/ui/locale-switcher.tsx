"use client"

import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"

const labels: Record<string, string> = { de: "DE", en: "EN", fr: "FR" }

export function LocaleSwitcher() {
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
          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
            l === locale
              ? "text-teal-600 bg-teal-50"
              : "text-slate-400 hover:text-slate-700"
          }`}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  )
}
