"use client"

import { Link } from "@/i18n/navigation"
import { Waves } from "lucide-react"
import { useTranslations } from "next-intl"

export function MarketingFooter() {
  const t = useTranslations("nav")

  return (
    <footer className="py-10 px-6 border-t border-slate-100 bg-white">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
            <Waves className="w-3 h-3 text-white" />
          </div>
          <span className="text-sm text-slate-400">Surf Your Life · Zürich</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-xs text-slate-400 hover:text-teal-600 transition-colors">
            {t("privacy")}
          </Link>
          <Link href="/" className="text-xs text-slate-400 hover:text-teal-600 transition-colors">
            surf-your-life.ch
          </Link>
        </div>
      </div>
    </footer>
  )
}
