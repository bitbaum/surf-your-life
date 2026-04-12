"use client"

import { useState } from "react"
import { usePathname, Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"
import {
  LayoutDashboard,
  User,
  ClipboardList,
  History,
  LogOut,
  Waves,
  Menu,
  X,
} from "lucide-react"

export function PortalSidebar() {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/check-in", label: t("checkIn"), icon: ClipboardList },
    { href: "/check-ins", label: t("history"), icon: History },
    { href: "/profile", label: t("profile"), icon: User },
  ]

  const logo = (
    <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-8" onClick={() => setOpen(false)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
        <Waves className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-slate-900">Surf Your Life</span>
    </Link>
  )

  const nav = (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname === href || (href === "/check-ins" && pathname.startsWith("/check-ins"))
              ? "bg-teal-50 text-teal-700"
              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </Link>
      ))}
    </nav>
  )

  const bottom = (
    <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
      <div className="px-2">
        <p className="text-xs text-slate-400 mb-1.5">{t("language")}</p>
        <LocaleSwitcher />
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t("signOut")}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Waves className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">Surf Your Life</span>
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher compact />
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "flex flex-col w-60 bg-white border-r border-slate-200 py-6 px-4",
          "hidden md:flex md:min-h-screen",
          open && "!flex fixed inset-y-0 left-0 z-50 shadow-xl"
        )}
      >
        <div className="md:hidden flex justify-end mb-4">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {logo}
        {nav}
        {bottom}
      </aside>
    </>
  )
}
