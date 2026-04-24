import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { desc, count } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate, computeTotalPages, parsePage, computeOffset } from "@/lib/utils"
import { PAGINATION_DEFAULT, ROLE_BADGE_VARIANT } from "@/lib/constants"
import { ADMIN_ROLE } from "@/lib/domain/auth"
import { RoleButton } from "./role-button"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Badge } from "@/components/ui/badge"
import { Pagination } from "@/components/ui/pagination"

export default async function UsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.users")

  const session = await auth()
  const canEdit = session?.user?.role === ADMIN_ROLE

  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const offset = computeOffset(page, PAGINATION_DEFAULT)

  const [allUsers, totalResult] = await Promise.all([
    db
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
      .offset(offset),
    db.select({ count: count() }).from(users),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  function pageLink(p: number) {
    return `/admin/users?page=${p}`
  }

  return (
    <div className="max-w-5xl mx-auto">
      <PageHeader title={t("title")} description={`${total} ${t("title").toLowerCase()}`} />

      <Card>
        <CardHeader>
          <CardTitle>{t("allUsers")}</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-2 font-medium text-slate-500">{t("name")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("email")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("role")}</th>
                <th className="text-left py-2 font-medium text-slate-500">{t("joined")}</th>
                {canEdit && <th className="text-right py-2 font-medium text-slate-500">{t("changeRole")}</th>}
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="py-3 font-medium text-slate-800">{user.name ?? "—"}</td>
                  <td className="py-3 text-slate-600">{user.email}</td>
                  <td className="py-3">
                    <Badge
                      label={t(`roles.${user.role}`)}
                      variant={ROLE_BADGE_VARIANT[user.role] ?? "slate"}
                    />
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
                    {t("noUsers")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  )
}
