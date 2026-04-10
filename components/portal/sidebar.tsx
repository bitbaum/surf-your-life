"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  ClipboardList,
  LogOut,
  Waves,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/profile", label: "My Profile", icon: User },
  { href: "/check-in", label: "Check-in", icon: ClipboardList },
]

export function PortalSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-white border-r border-slate-200 py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-600">
          <Waves className="w-4 h-4 text-white" />
        </div>
        <span className="font-semibold text-slate-900">Surf Your Life</span>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-teal-50 text-teal-700"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </aside>
  )
}
