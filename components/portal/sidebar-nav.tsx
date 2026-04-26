"use client"

import { usePathname, Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  ClipboardList, LayoutDashboard, History, Activity, TrendingUp,
  Pill, Sparkles, BookOpen, Bot, MessageSquare, CalendarPlus, FileText,
} from "lucide-react"

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

interface Props {
  onClose: () => void
  unreadThreads?: number
}

export function PortalSidebarNav({ onClose, unreadThreads = 0 }: Props) {
  const t = useTranslations("sidebar")
  const pathname = usePathname()

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href))

  const navLink = (href: string, label: string, Icon: React.ElementType, badge = 0) => (
    <Link
      key={href}
      href={href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive(href)
          ? "bg-teal-50 text-teal-700"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
      {badge > 0 && (
        <span className="ml-auto text-xs bg-teal-600 text-white rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center leading-none">
          {badge}
        </span>
      )}
    </Link>
  )

  return (
    <nav className="flex flex-col flex-1 gap-4">
      <Link
        href="/check-in"
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
          isActive("/check-in") ? "bg-teal-600 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
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
            {group.items.map(({ href, labelKey, icon }) => navLink(href, t(labelKey), icon, href === "/messages" ? unreadThreads : 0))}
          </div>
        </div>
      ))}
    </nav>
  )
}
