"use client"

import { useState } from "react"
import { Link, usePathname } from "@/i18n/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { BRAND_NAME } from "@/lib/constants"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"
import { useTranslations } from "next-intl"
import { LayoutDashboard, Users, LogOut, Waves, Menu, X, Inbox, MessageSquare, UserCog, CalendarCheck, BookOpen, Wrench, User, Sparkles, Bell, Activity } from "lucide-react"

interface AdminSidebarProps {
  unreadMessages?: number
  unresolvedAlerts?: number
  newLeads?: number
}

export function AdminSidebar({ unreadMessages = 0, unresolvedAlerts = 0, newLeads = 0 }: AdminSidebarProps) {
  const t = useTranslations("admin.sidebar")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const navItems = [
    { href: "/admin/dashboard", label: t("dashboard"), icon: LayoutDashboard, badge: 0 },
    { href: "/admin/clients", label: t("clients"), icon: Users, badge: 0 },
    { href: "/admin/check-ins", label: t("checkIns"), icon: Activity, badge: 0 },
    { href: "/admin/alerts", label: t("alerts"), icon: Bell, badge: unresolvedAlerts },
    { href: "/admin/bookings", label: t("bookings"), icon: CalendarCheck, badge: 0 },
    { href: "/admin/services", label: t("services"), icon: Wrench, badge: 0 },
    { href: "/admin/messages", label: t("messages"), icon: MessageSquare, badge: unreadMessages },
    { href: "/admin/programs", label: t("programs"), icon: BookOpen, badge: 0 },
    { href: "/admin/techniques", label: t("techniques"), icon: Sparkles, badge: 0 },
    { href: "/admin/leads", label: t("leads"), icon: Inbox, badge: newLeads },
    { href: "/admin/users", label: t("users"), icon: UserCog, badge: 0 },
  ]

  const logo = (
    <Link href="/admin/dashboard" className="flex items-center gap-2 px-2 mb-8" onClick={() => setOpen(false)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500">
        <Waves className="w-4 h-4 text-white" />
      </div>
      <div>
        <span className="font-semibold text-white text-sm block">{BRAND_NAME}</span>
        <p className="text-slate-400 text-xs">Admin</p>
      </div>
    </Link>
  )

  const nav = (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ href, label, icon: Icon, badge }) => (
        <Link
          key={href}
          href={href}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname.startsWith(href)
              ? "bg-teal-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
          {badge > 0 && (
            <span className="ml-auto text-xs bg-teal-500 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
              {badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  )

  const bottom = (
    <div className="flex flex-col gap-3 pt-4 border-t border-slate-700">
      <Link
        href="/dashboard"
        onClick={() => setOpen(false)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <User className="w-4 h-4" />
        {t("clientPortal")}
      </Link>
      <div className="px-2">
        <p className="text-xs text-slate-500 mb-1.5">{t("language")}</p>
        <LocaleSwitcher dark />
      </div>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        {t("signOut")}
      </button>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-slate-900 flex items-center justify-between px-4">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center">
            <Waves className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">{BRAND_NAME}</span>
        </Link>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          aria-label={t("openMenu")}
        >
          <Menu className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/60" onClick={() => setOpen(false)} />
      )}

      <aside
        className={cn(
          "flex flex-col w-60 bg-slate-900 py-6 px-4",
          "hidden md:flex md:min-h-screen",
          open && "!flex fixed inset-y-0 left-0 z-50 shadow-xl"
        )}
      >
        <div className="md:hidden flex justify-end mb-4">
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            aria-label={t("closeMenu")}
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {logo}
        {nav}
        {bottom}
      </aside>
    </>
  )
}
