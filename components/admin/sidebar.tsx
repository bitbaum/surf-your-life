"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, LogOut, Waves } from "lucide-react"

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-slate-900 py-6 px-4">
      <div className="flex items-center gap-2 px-2 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-teal-500">
          <Waves className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="font-semibold text-white text-sm">Surf Your Life</span>
          <p className="text-slate-400 text-xs">Admin</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname.startsWith(href)
                ? "bg-teal-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <LogOut className="w-4 h-4" />
        Sign out
      </button>
    </aside>
  )
}
