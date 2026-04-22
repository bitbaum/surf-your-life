"use client"

import { useState } from "react"
import { usePathname, Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { isStaff } from "@/lib/domain/auth"
import { BRAND_NAME } from "@/lib/constants"
import { LocaleSwitcher } from "@/components/ui/locale-switcher"
import {
  LayoutDashboard,
  User,
  ClipboardList,
  History,
  CalendarPlus,
  LogOut,
  Waves,
  Menu,
  X,
  MessageSquare,
  Settings,
  BookOpen,
  Bot,
  Activity,
  Pill,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  FileText,
} from "lucide-react"

interface PortalSidebarProps {
  role?: string
}

const NAV_GROUPS = [
  {
    labelKey: "groupToday" as const,
    items: [
      { href: "/dashboard", labelKey: "dashboard" as const, icon: LayoutDashboard },
    ],
  },
  {
    labelKey: "groupTrack" as const,
    items: [
      { href: "/check-ins", labelKey: "history" as const, icon: History },
      { href: "/assessments", labelKey: "assessments" as const, icon: Activity },
      { href: "/progress", labelKey: "progress" as const, icon: TrendingUp },
      { href: "/medications", labelKey: "medications" as const, icon: Pill },
      { href: "/techniques", labelKey: "techniques" as const, icon: Sparkles },
    ],
  },
  {
    labelKey: "groupCare" as const,
    items: [
      { href: "/program", labelKey: "program" as const, icon: BookOpen },
      { href: "/ai-chat", labelKey: "aiChat" as const, icon: Bot },
      { href: "/messages", labelKey: "messages" as const, icon: MessageSquare },
      { href: "/book", labelKey: "book" as const, icon: CalendarPlus },
      { href: "/documents", labelKey: "documents" as const, icon: FileText },
    ],
  },
]

const BOTTOM_ITEMS = [
  { href: "/profile", labelKey: "profile" as const, icon: User },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
]

export function PortalSidebar({ role }: PortalSidebarProps) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) =>
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href))

  const navLink = (href: string, label: string, Icon: React.ElementType) => (
    <Link
      key={href}
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive(href)
          ? "bg-teal-50 text-teal-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  )

  const isAdminUser = isStaff(role)

  const logo = (
    <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-6" onClick={() => setOpen(false)}>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
        <Waves className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-slate-900">{BRAND_NAME}</span>
    </Link>
  )

  const nav = (
    <nav className="flex flex-col flex-1 gap-4">
      {/* Check-in CTA — primary daily action */}
      <Link
        href="/check-in"
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
          isActive("/check-in")
            ? "bg-teal-600 text-white"
            : "bg-teal-600 text-white hover:bg-teal-700"
        )}
      >
        <ClipboardList className="w-4 h-4" />
        {t("checkIn")}
      </Link>

      {NAV_GROUPS.map((group) => (
        <div key={group.labelKey}>
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            {t(group.labelKey)}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ href, labelKey, icon }) => navLink(href, t(labelKey), icon))}
          </div>
        </div>
      ))}
    </nav>
  )

  const bottom = (
    <div className="flex flex-col gap-1 pt-4 border-t border-slate-100">
      {BOTTOM_ITEMS.map(({ href, labelKey, icon }) => navLink(href, t(labelKey), icon))}

      {isAdminUser && (
        <Link
          href="/admin/dashboard"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          {t("adminArea")}
        </Link>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <LocaleSwitcher />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors"
          title={t("signOut")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
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
          <span className="font-semibold text-slate-900 text-sm">{BRAND_NAME}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/check-in"
            className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            {t("checkIn")}
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={t("openMenu")}
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
            aria-label={t("closeMenu")}
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
