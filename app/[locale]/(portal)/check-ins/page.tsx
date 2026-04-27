import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { checkIns } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { PAGINATION_DEFAULT, MOOD_EMOJI, MOODS, SLEEP_QUALITY_OPTIONS, ACTIVITY_LEVELS } from "@/lib/constants"
import { EmptyState } from "@/components/ui/empty-state"

const FIELD_LABEL_CLS = "text-xs font-medium text-slate-400 uppercase tracking-wide"

import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { CheckInActions } from "./check-in-actions"

export default async function CheckInsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.checkIns")
  const tCheckIn = await getTranslations("portal.checkIn")

  const { page: pageParam } = await searchParams
  const { page, offset } = parsePagination(pageParam)

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
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)
  const activityLevelMap = Object.fromEntries(ACTIVITY_LEVELS.map((a) => [a.value, a]))
  const moodMap = Object.fromEntries(MOODS.map((m) => [m.value, m]))

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("totalCount", { n: total })}
        action={
          <Link href="/check-in">
            <Button size="sm">{t("newCheckIn")}</Button>
          </Link>
        }
      />

      {items.length === 0 ? (
        <div className="py-16">
          <EmptyState
            message={t("noCheckIns")}
            action={<Link href="/check-in"><Button>{t("doFirstCheckIn")}</Button></Link>}
          />
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
                        <p className="font-medium text-slate-900">{tCheckIn(moodMap[ci.mood]?.labelKey ?? "moodNeutral")}</p>
                        <p className="text-xs text-slate-400">{formatDate(ci.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 text-sm text-slate-500 text-right">
                      <span>{t("energy")} <strong className="text-slate-800">{ci.energyLevel}/10</strong></span>
                      {ci.sleepHours != null && (
                        <span>{t("sleep")} <strong className="text-slate-800">{ci.sleepHours}h</strong></span>
                      )}
                      {ci.sleepQuality != null && (
                        <span>{SLEEP_QUALITY_OPTIONS[ci.sleepQuality - 1]?.emoji ?? "😴"} <strong className="text-slate-800">{ci.sleepQuality}/5</strong></span>
                      )}
                      {ci.activityLevel && activityLevelMap[ci.activityLevel] && (
                        <span>{activityLevelMap[ci.activityLevel].emoji} <strong className="text-slate-800">{tCheckIn(activityLevelMap[ci.activityLevel].labelKey)}</strong></span>
                      )}
                      {ci.orthostaticSymptoms && (
                        <span className="text-orange-500 font-medium text-xs self-center">⬆ {t("orthostaticShort")}</span>
                      )}
                      {ci.pemFlag && (
                        <span className="text-red-500 font-medium text-xs self-center">PEM{ci.pemSeverity ? ` ${ci.pemSeverity}/10` : ""}</span>
                      )}
                    </div>
                    {(ci.symptomFatigue != null || ci.symptomBrainFog != null || ci.symptomPain != null || ci.stressLevel != null) && (
                      <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-1">
                        {ci.symptomFatigue != null && <span>{tCheckIn("symptomFatigue")}: <strong className="text-slate-600">{ci.symptomFatigue}/10</strong></span>}
                        {ci.symptomBrainFog != null && <span>{tCheckIn("symptomBrainFog")}: <strong className="text-slate-600">{ci.symptomBrainFog}/10</strong></span>}
                        {ci.symptomPain != null && <span>{tCheckIn("symptomPain")}: <strong className="text-slate-600">{ci.symptomPain}/10</strong></span>}
                        {ci.stressLevel != null && <span>{tCheckIn("stressLevel")}: <strong className="text-slate-600">{ci.stressLevel}/10</strong></span>}
                      </div>
                    )}
                  </div>
                  {(ci.journalEntry || ci.wins || ci.challenges || ci.notes) && (
                    <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                      {ci.journalEntry ? (
                        <div>
                          <span className={FIELD_LABEL_CLS}>{t("journal")}</span>
                          <p className="mt-0.5 leading-relaxed">{ci.journalEntry}</p>
                        </div>
                      ) : (
                        <>
                          {ci.wins && (
                            <div>
                              <span className={FIELD_LABEL_CLS}>{t("wins")}</span>
                              <p className="mt-0.5">{ci.wins}</p>
                            </div>
                          )}
                          {ci.challenges && (
                            <div>
                              <span className={FIELD_LABEL_CLS}>{t("challenges")}</span>
                              <p className="mt-0.5">{ci.challenges}</p>
                            </div>
                          )}
                          {ci.notes && (
                            <div>
                              <span className={FIELD_LABEL_CLS}>{t("notes")}</span>
                              <p className="mt-0.5 italic">{ci.notes}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {ci.aiInsight && (
                    <div className="mt-4 bg-violet-50 border-l-2 border-violet-300 rounded-r-lg px-3 py-2">
                      <p className="text-xs font-medium text-violet-600 mb-0.5">{t("weeklyInsight")}</p>
                      <p className="text-sm text-violet-900 leading-relaxed">{ci.aiInsight}</p>
                    </div>
                  )}
                  {ci.practitionerNote && (
                    <div className="mt-4 bg-teal-50 border-l-2 border-teal-400 rounded-r-lg px-3 py-2">
                      <p className="text-xs font-medium text-teal-700 mb-0.5">
                        {t("practitionerNote")}
                        {ci.practitionerNoteAt && (
                          <span className="font-normal text-teal-600"> · {formatDate(ci.practitionerNoteAt)}</span>
                        )}
                      </p>
                      <p className="text-sm text-teal-900 leading-relaxed">{ci.practitionerNote}</p>
                    </div>
                  )}
                  <CheckInActions checkInId={ci.id} checkIn={ci} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} pageLink={(p) => `/check-ins?page=${p}`} />
        </>
      )}
    </div>
  )
}
