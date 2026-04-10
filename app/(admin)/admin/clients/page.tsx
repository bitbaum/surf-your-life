import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatDate, formatEnumValue } from "@/lib/utils"

export default async function ClientsPage() {
  const clients = await db.query.users.findMany({
    where: eq(users.role, "client"),
    orderBy: [desc(users.createdAt)],
    with: { profile: true },
  })

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Clients" description={`${clients.length} registered clients`} />

      <Card>
        <CardHeader><CardTitle>All clients</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">Name</th>
                <th className="text-left py-2 font-medium text-slate-500">Email</th>
                <th className="text-left py-2 font-medium text-slate-500">Concern</th>
                <th className="text-left py-2 font-medium text-slate-500">Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">{client.name ?? "—"}</td>
                  <td className="py-3 text-slate-600">{client.email}</td>
                  <td className="py-3 text-slate-500">
                    {client.profile?.mainConcern ? formatEnumValue(client.profile.mainConcern) : "—"}
                  </td>
                  <td className="py-3 text-slate-400">{formatDate(client.createdAt)}</td>
                  <td className="py-3 text-right">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="text-teal-600 hover:underline text-xs font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
              {clients.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No clients yet
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
