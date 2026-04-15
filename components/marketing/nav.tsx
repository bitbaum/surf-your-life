"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Waves, Menu, X, LayoutDashboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"

// anchor=true → rendered as <a href="..."> (same-page scroll)
// anchor=false → rendered as <Link href="..."> (route navigation)
const NAV_LINKS = [
  { href: "#method", labelKey: "method", anchor: true },
  { href: "#who", labelKey: "forWhom", anchor: true },
  { href: "#process", labelKey: "howItWorks", anchor: true },
  { href: "/faq", labelKey: "faq", anchor: false },
  { href: "/blog", labelKey: "blog", anchor: false },
  { href: "/contact", labelKey: "contact", anchor: false },
] as const

export function MarketingNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("nav")
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">Surf Your Life</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(({ href, labelKey, anchor }) =>
              anchor ? (
                <a key={href} href={href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  {t(labelKey)}
                </a>
              ) : (
                <Link key={href} href={href} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  {t(labelKey)}
                </Link>
              )
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LocaleSwitcher direction="down" />
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {t("dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
                  {t("signIn")}
                </Link>
                <Link href="/register">
                  <Button size="sm">{t("getStarted")}</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label={open ? t("close") : t("open")}
          >
            {open ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-slate-100 bg-white px-6 py-5 flex flex-col gap-4">
            {NAV_LINKS.map(({ href, labelKey, anchor }) =>
              anchor ? (
                <a
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-700 py-1 hover:text-teal-600 transition-colors"
                >
                  {t(labelKey)}
                </a>
              ) : (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className="text-sm text-slate-700 py-1 hover:text-teal-600 transition-colors"
                >
                  {t(labelKey)}
                </Link>
              )
            )}
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <LocaleSwitcher />
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t("dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">{t("signIn")}</Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t("getStarted")}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
