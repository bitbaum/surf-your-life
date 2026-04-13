import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { RoleButton } from "./role-button"

export default async function UsersPage() {
  const session = await auth()
  const canEdit = session?.user?.role === "admin"

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(PAGINATION_DEFAULT)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Users" description={`${allUsers.length} users`} />

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">Name</th>
                <th className="text-left py-2 font-medium text-slate-500">Email</th>
                <th className="text-left py-2 font-medium text-slate-500">Role</th>
                <th className="text-left py-2 font-medium text-slate-500">Joined</th>
                {canEdit && <th className="text-right py-2 font-medium text-slate-500">Change Role</th>}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">{user.name ?? "—"}</td>
                  <td className="py-3 text-slate-600">{user.email}</td>
                  <td className="py-3">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="py-3 text-slate-400">{formatDate(user.createdAt)}</td>
                  {canEdit && (
                    <td className="py-3 text-right">
                      <RoleButton
                        userId={user.id}
                        currentRole={user.role}
                        canEdit={canEdit}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {allUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No users yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    admin: "bg-teal-50 text-teal-700",
    practitioner: "bg-blue-50 text-blue-600",
    client: "bg-slate-100 text-slate-600",
  }
  const labels: Record<string, string> = {
    admin: "Admin",
    practitioner: "Practitioner",
    client: "Client",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${styles[role] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[role] ?? role}
    </span>
  )
}
