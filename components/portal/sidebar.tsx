"use client"

import { useState } from "react"
import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { isStaff } from "@/lib/domain/auth"
import { BRAND_NAME } from "@/lib/constants"
import { Waves, X } from "lucide-react"
import { SidebarMobileBar } from "./sidebar-mobile-bar"
import { PortalSidebarNav } from "./sidebar-nav"
import { PortalSidebarBottom } from "./sidebar-bottom"

interface PortalSidebarProps {
  role?: string
}

export function PortalSidebar({ role }: PortalSidebarProps) {
  const t = useTranslations("sidebar")
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const isAdminUser = isStaff(role)

  return (
    <>
      <SidebarMobileBar onOpenMenu={() => setOpen(true)} />

      {open && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={close} />
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
            onClick={close}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label={t("closeMenu")}
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-6" onClick={close}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-slate-900">{BRAND_NAME}</span>
        </Link>

        <PortalSidebarNav onClose={close} />
        <PortalSidebarBottom isAdminUser={isAdminUser} onClose={close} />
      </aside>
    </>
  )
}
