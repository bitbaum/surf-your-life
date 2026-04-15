"use client"

import { useRef, useState, useEffect } from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter } from "@/i18n/navigation"
import { routing } from "@/i18n/routing"
import { Globe, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const LANGUAGES: Record<string, string> = {
  de: "Deutsch",
  en: "English",
  fr: "Français",
}

interface LocaleSwitcherProps {
  dark?: boolean
  /** Which direction the dropdown opens. Default: "up" (sidebars). Use "down" for top navbars. */
  direction?: "up" | "down"
}

export function LocaleSwitcher({ dark, direction = "up" }: LocaleSwitcherProps) {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  function switchLocale(next: string) {
    router.replace(pathname, { locale: next })
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium rounded-lg px-2 py-1.5 transition-colors",
          dark
            ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
        )}
        aria-label="Switch language"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
        <span>{LANGUAGES[locale] ?? locale.toUpperCase()}</span>
      </button>

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute z-50 mt-1 w-36 rounded-xl border shadow-md py-1 overflow-hidden",
            dark
              ? "bg-slate-800 border-slate-700"
              : "bg-white border-slate-200"
          )}
          style={direction === "up"
            ? { bottom: "calc(100% + 4px)", left: 0 }
            : { top: "calc(100% + 4px)", left: 0 }}
        >
          {routing.locales.map((l) => (
            <button
              key={l}
              role="option"
              aria-selected={l === locale}
              onClick={() => switchLocale(l)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors",
                l === locale
                  ? dark
                    ? "text-teal-400 bg-slate-700"
                    : "text-teal-600 bg-teal-50"
                  : dark
                  ? "text-slate-300 hover:bg-slate-700"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {LANGUAGES[l]}
              {l === locale && <Check className="w-3.5 h-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
