import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { getUnreadThreadsCount, getUnresolvedAlertCount, getNewLeadsCount } from "@/components/admin/unread-count"
import { CLIENT_ROLE } from "@/lib/domain/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")
  if (session.user.role === CLIENT_ROLE) redirect("/dashboard")

  const [unreadThreads, unresolvedAlerts, newLeads] = await Promise.all([
    getUnreadThreadsCount(),
    getUnresolvedAlertCount(),
    getNewLeadsCount(),
  ])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar unreadThreads={unreadThreads} unresolvedAlerts={unresolvedAlerts} newLeads={newLeads} />
      <main className="flex-1 p-8 pt-[5.5rem] md:pt-8 overflow-auto">{children}</main>
    </div>
  )
}
