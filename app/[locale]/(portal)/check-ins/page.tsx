import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { PAGINATION_DEFAULT, MOOD_EMOJI } from "@/lib/constants"
import { Link } from "@/i18n/navigation"
import { CheckInActions } from "./check-in-actions"

export default async function CheckInsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.checkIns")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const [items, totalResult] = await Promise.all([
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, session.user.id),
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, session.user.id)),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        description={`${total} check-in${total !== 1 ? "s" : ""} total`}
        action={
          <Link href="/check-in">
            <Button size="sm">New check-in</Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="mb-4">{t("noCheckIns")}</p>
          <Link href="/check-in">
            <Button>Do your first check-in</Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {items.map((ci) => (
              <Card key={ci.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                      <div>
                        <p className="font-medium text-slate-900">{formatEnumValue(ci.mood)}</p>
                        <p className="text-xs text-slate-400">{formatDate(ci.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm text-slate-500 text-right">
                      <span>{t("energy")} <strong className="text-slate-800">{ci.energyLevel}/10</strong></span>
                      {ci.sleepHours != null && (
                        <span>{t("sleep")} <strong className="text-slate-800">{ci.sleepHours}h</strong></span>
                      )}
                    </div>
                  </div>
                  {(ci.wins || ci.challenges || ci.notes) && (
                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                      {ci.wins && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Wins</span>
                          <p className="mt-0.5">{ci.wins}</p>
                        </div>
                      )}
                      {ci.challenges && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Challenges</span>
                          <p className="mt-0.5">{ci.challenges}</p>
                        </div>
                      )}
                      {ci.notes && (
                        <div>
                          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Notes</span>
                          <p className="mt-0.5 italic">{ci.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                  <CheckInActions checkInId={ci.id} checkIn={ci} />
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-xs text-slate-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/check-ins?page=${page - 1}`}>
                    <Button variant="outline" size="sm">← Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/check-ins?page=${page + 1}`}>
                    <Button variant="outline" size="sm">Next →</Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
