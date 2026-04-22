import { getTranslations } from "next-intl/server"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { ProgressBar } from "@/components/ui/progress-bar"
import { CheckCircle2 } from "lucide-react"

interface Props {
  milestone: string | null
  isOnboarded: boolean
  completionPct: number
  checkedInToday: boolean
}

export async function DashboardBanners({ milestone, isOnboarded, completionPct, checkedInToday }: Props) {
  const t = await getTranslations("portal.dashboard")

  return (
    <>
      {milestone && (
        <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-amber-900 text-sm">{t("milestoneTitle")}</p>
            <p className="text-xs text-amber-700 mt-0.5">{milestone}</p>
          </div>
        </div>
      )}

      {!isOnboarded && (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 p-4">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div>
              <p className="font-medium text-teal-900 text-sm">{t("completeProfile")}</p>
              <p className="text-xs text-teal-700 mt-0.5">
                {t("completeProfileBody", { pct: completionPct })}
              </p>
            </div>
            <Link href="/profile">
              <Button size="sm">{t("completeProfileCta")}</Button>
            </Link>
          </div>
          <ProgressBar value={completionPct} size="sm" track="teal" />
        </div>
      )}

      {checkedInToday ? (
        <div className="mb-6 rounded-xl bg-teal-50 border border-teal-200 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-teal-900">{t("checkedInTodayTitle")}</p>
            <p className="text-xs text-teal-700 mt-0.5">{t("checkedInTodayBody")}</p>
          </div>
        </div>
      ) : (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{t("readyTitle")}</p>
            <p className="text-xs text-slate-400 mt-0.5">{t("readySubtitle")}</p>
          </div>
          <Link href="/check-in">
            <Button size="sm">{t("checkIn")}</Button>
          </Link>
        </div>
      )}
    </>
  )
}
