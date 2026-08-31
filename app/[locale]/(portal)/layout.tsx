import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalSidebar } from "@/components/portal/sidebar";
import { getClientUnreadThreadsCount } from "@/components/portal/unread-count";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const unreadThreads = await getClientUnreadThreadsCount(session.user.id);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <PortalSidebar role={session.user.role} unreadThreads={unreadThreads} />
      <main className="flex-1 p-8 pt-[5.5rem] md:pt-8 overflow-auto">{children}</main>
    </div>
  );
}
