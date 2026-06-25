"use client"

import { Link } from "@/i18n/navigation"
import { Waves } from "lucide-react"
import { useTranslations } from "next-intl"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"

export function MarketingFooter() {
  const tNav = useTranslations("nav")
  const tFooter = useTranslations("landing.footer")

  return (
    <footer className="py-10 px-6 border-t border-border-subtle bg-surface">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-brand flex items-center justify-center">
            <Waves className="w-3 h-3 text-ink-on-overlay" />
          </div>
          <span className="text-sm text-ink-faint">{tFooter("address")}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/privacy" className="text-xs text-ink-faint hover:text-brand transition-colors">
            {tNav("privacy")}
          </Link>
          <LocaleSwitcher direction="up" />
        </div>
      </div>
    </footer>
  )
}
