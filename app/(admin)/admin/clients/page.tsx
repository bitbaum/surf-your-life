import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import Link from "next/link"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { PAGINATION_DEFAULT } from "@/lib/constants"

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const [clients, totalResult] = await Promise.all([
    db.query.users.findMany({
      where: eq(users.role, "client"),
      orderBy: [desc(users.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: { profile: true },
    }),
    db.select({ count: count() }).from(users).where(eq(users.role, "client")),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title="Clients" description={`${total} registered client${total !== 1 ? "s" : ""}`} />

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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link
                    href={`/admin/clients?page=${page - 1}`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    ← Previous
                  </Link>
                )}
                {page < totalPages && (
                  <Link
                    href={`/admin/clients?page=${page + 1}`}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    Next →
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
