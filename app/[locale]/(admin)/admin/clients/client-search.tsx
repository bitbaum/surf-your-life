"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Search } from "lucide-react"

interface ClientSearchProps {
  defaultValue?: string
}

export function ClientSearch({ defaultValue = "" }: ClientSearchProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const t = useTranslations("admin.clients")

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString())
        const value = e.target.value.trim()
        if (value) {
          params.set("q", value)
        } else {
          params.delete("q")
        }
        params.delete("page")
        router.push(`${pathname}?${params.toString()}`)
      }, 300)
    },
    [router, pathname, searchParams]
  )

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type="search"
        defaultValue={defaultValue}
        onChange={handleChange}
        placeholder={t("searchPlaceholder")}
        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
      />
    </div>
  )
}
