import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { getUnreadCount } from "@/components/admin/unread-count"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === "client") redirect("/dashboard")

  const unreadMessages = await getUnreadCount()

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar unreadMessages={unreadMessages} />
      <main className="flex-1 p-8 pt-[5.5rem] md:pt-8 overflow-auto">{children}</main>
    </div>
  )
}
