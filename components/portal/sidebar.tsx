"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
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

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/check-in", label: "Check-in", icon: ClipboardList },
  { href: "/check-ins", label: "History", icon: History },
  { href: "/profile", label: "My Profile", icon: User },
]

export function PortalSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

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

  const logo = (
    <div className="flex items-center gap-2 px-2 mb-8">
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
        <Waves className="w-4 h-4 text-white" />
      </div>
      <span className="font-semibold text-slate-900">Surf Your Life</span>
    </div>
  )

  const signOutBtn = (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
            <Waves className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-semibold text-slate-900 text-sm">Surf Your Life</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile drawer + desktop sidebar */}
      <aside
        className={cn(
          "flex flex-col w-60 bg-white border-r border-slate-200 py-6 px-4",
          // Desktop: always visible
          "hidden md:flex md:min-h-screen",
          // Mobile: fixed overlay, shown when open
          open && "!flex fixed inset-y-0 left-0 z-50 shadow-xl"
        )}
      >
        {/* Mobile close button */}
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
        {signOutBtn}
      </aside>

    </>
  )
}
