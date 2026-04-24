import { CheckCircle, Circle, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTranslations } from "next-intl/server"
import type { ProgramPhase } from "@/lib/domain/program"

interface Props {
  phases: ProgramPhase[]
  currentWeek: number | null
  totalWeeks: number | null
}

export async function PhaseTimeline({ phases, currentWeek, totalWeeks }: Props) {
  const t = await getTranslations("portal.program")

  // Sort phases by week ascending
  const sorted = [...phases].sort((a, b) => a.week - b.week)

  // Find the active phase: the last phase whose week <= currentWeek
  const activeIndex = currentWeek !== null
    ? sorted.reduce((best, p, i) => (p.week <= currentWeek ? i : best), -1)
    : -1

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-teal-600" />
          {t("phasesTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Vertical connector line */}
          {sorted.length > 1 && (
            <div className="absolute left-[15px] top-5 bottom-5 w-px bg-slate-200" aria-hidden="true" />
          )}

          <div className="flex flex-col gap-5">
            {sorted.map((phase, i) => {
              const isPast = i < activeIndex
              const isActive = i === activeIndex
              const isFuture = i > activeIndex

              return (
                <div key={i} className="flex gap-4 relative">
                  {/* Icon */}
                  <div className="flex-shrink-0 z-10">
                    {isPast ? (
                      <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                      </div>
                    ) : isActive ? (
                      <div className="w-8 h-8 rounded-full bg-teal-600 flex items-center justify-center ring-4 ring-teal-100">
                        <span className="text-xs font-bold text-white">{phase.week}</span>
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <Circle className="w-4 h-4 text-slate-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-1 ${isFuture ? "opacity-50" : ""}`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-slate-400 font-medium">
                        {t("phaseWeekLabel", { week: phase.week })}
                      </span>
                      {isActive && (
                        <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                          {t("phaseCurrentBadge")}
                        </span>
                      )}
                    </div>
                    <p className={`text-sm font-semibold ${isActive ? "text-teal-900" : isPast ? "text-slate-700" : "text-slate-500"}`}>
                      {phase.title}
                    </p>
                    {phase.guidance && (
                      <p className="text-sm text-slate-500 mt-1 leading-relaxed">{phase.guidance}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {totalWeeks && sorted.length > 0 && sorted[sorted.length - 1].week < totalWeeks && (
            <div className="flex gap-4 mt-5 relative">
              <div className="flex-shrink-0 z-10">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-slate-300" />
                </div>
              </div>
              <div className="flex-1 pb-1 opacity-40">
                <p className="text-sm font-semibold text-slate-500">{t("phaseCompletion")}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t("phaseWeekLabel", { week: totalWeeks })}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
