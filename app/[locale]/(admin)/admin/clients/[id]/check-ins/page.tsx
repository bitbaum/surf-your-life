import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { users, checkIns } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { formatDate, formatEnumValue } from "@/lib/utils"
import { MOOD_EMOJI, PAGINATION_DEFAULT } from "@/lib/constants"
import { CheckInNote } from "../check-in-note"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function ClientCheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale, id } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.clients")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const [client, clientCheckIns, countResult] = await Promise.all([
    db.query.users.findFirst({ where: eq(users.id, id) }),
    db.query.checkIns.findMany({
      where: eq(checkIns.userId, id),
      orderBy: [desc(checkIns.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
    }),
    db.select({ count: count() }).from(checkIns).where(eq(checkIns.userId, id)),
  ])

  if (!client || client.role !== CLIENT_ROLE) notFound()

  const total = countResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  function pageLink(p: number) {
    return `/admin/clients/${id}/check-ins?page=${p}`
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href={`/admin/clients/${id}`} className="text-sm text-slate-400 hover:text-slate-600">
          {t("checkIns.backLink", { name: client.name ?? t("detail.unnamed") })}
        </Link>
      </div>

      <PageHeader
        title={t("checkIns.title")}
        description={t("checkIns.description", { name: client.name ?? client.email ?? t("detail.unnamed"), count: total })}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.checkInsCard")} ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {clientCheckIns.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {clientCheckIns.map((ci) => (
                <div key={ci.id} className="py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <span>{MOOD_EMOJI[ci.mood] ?? "😐"}</span>
                      {formatEnumValue(ci.mood)}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(ci.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-1">
                    <span>{t("detail.energy")}: <strong className="text-slate-700">{ci.energyLevel}/10</strong></span>
                    {ci.sleepHours != null && <span>{t("detail.sleep")}: <strong className="text-slate-700">{ci.sleepHours}h</strong></span>}
                    {ci.activityLevel && <span>{t("detail.activityLevel")}: <strong className="text-slate-700">{formatEnumValue(ci.activityLevel)}</strong></span>}
                    {ci.sleepQuality != null && <span>{t("detail.sleepQuality")}: <strong className="text-slate-700">{ci.sleepQuality}/5</strong></span>}
                    {ci.pemFlag && (
                      <span className="text-red-600 font-medium">
                        {t("detail.pem")}{ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}
                      </span>
                    )}
                    {ci.orthostaticSymptoms && (
                      <span className="text-orange-600 font-medium">{t("detail.orthostatic")}</span>
                    )}
                  </div>
                  {(ci.symptomFatigue != null || ci.symptomBrainFog != null || ci.symptomPain != null || ci.stressLevel != null) && (
                    <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-1">
                      {ci.symptomFatigue != null && <span>{t("detail.fatigue")}: <strong>{ci.symptomFatigue}</strong></span>}
                      {ci.symptomBrainFog != null && <span>{t("detail.brainFog")}: <strong>{ci.symptomBrainFog}</strong></span>}
                      {ci.symptomPain != null && <span>{t("detail.pain")}: <strong>{ci.symptomPain}</strong></span>}
                      {ci.stressLevel != null && <span>{t("detail.stress")}: <strong>{ci.stressLevel}</strong></span>}
                    </div>
                  )}
                  {ci.journalEntry && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{ci.journalEntry}</p>}
                  {!ci.journalEntry && ci.wins && <p className="text-xs text-teal-700 mt-1">✓ {ci.wins}</p>}
                  {!ci.journalEntry && ci.challenges && <p className="text-xs text-slate-500 mt-1 italic">{ci.challenges}</p>}
                  {!ci.journalEntry && ci.notes && <p className="text-xs text-slate-400 mt-1">{ci.notes}</p>}
                  {ci.aiInsight && (
                    <div className="mt-2 p-2 bg-violet-50 border border-violet-100 rounded-lg">
                      <p className="text-xs text-violet-500 font-medium mb-0.5">{t("detail.aiInsight")}</p>
                      <p className="text-xs text-violet-800 leading-relaxed">{ci.aiInsight}</p>
                    </div>
                  )}
                  <CheckInNote
                    checkInId={ci.id}
                    existingNote={ci.practitionerNote ?? null}
                    existingNoteAt={ci.practitionerNoteAt ?? null}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">{t("detail.noCheckIns")}</p>
          )}

          <Pagination page={page} totalPages={totalPages} pageLink={pageLink} />
        </CardContent>
      </Card>
    </div>
  )
}
