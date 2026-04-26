import { getTranslations } from "next-intl/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { formatDate } from "@/lib/utils"
import type { medicationLog, functionalAssessments } from "@/lib/db/schema"

type Medication = typeof medicationLog.$inferSelect
type Assessment = typeof functionalAssessments.$inferSelect

interface Props {
  currentMedications: Medication[]
  assessments: Assessment[]
}

function CapacityBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="text-xs font-medium text-slate-700">{value}/10</span>
      </div>
      <ProgressBar value={value * 10} size="sm" />
    </div>
  )
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const delta = current - previous
  if (delta === 0) return <span className="text-xs text-slate-400">→ {previous}</span>
  if (delta > 0) return <span className="text-xs text-teal-600 font-medium">↑ +{delta}</span>
  return <span className="text-xs text-red-500 font-medium">↓ {delta}</span>
}

export async function ClientMedicationsRow({ currentMedications, assessments }: Props) {
  const t = await getTranslations("admin.clients")

  const latestAssessment = assessments[0]
  const previousAssessment = assessments[1]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("detail.medicationsCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          {currentMedications.length > 0 ? (
            <div className="flex flex-col divide-y divide-slate-100">
              {currentMedications.map((med) => (
                <div key={med.id} className="py-2.5">
                  <p className="text-sm font-medium text-slate-800">{med.medicationName}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5">
                    {med.dose && <span>{med.dose}</span>}
                    {med.frequency && <span>· {med.frequency}</span>}
                    {med.startDate && <span>· {t("detail.since")} {med.startDate}</span>}
                  </div>
                  {med.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{med.notes}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">{t("detail.noMedications")}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("detail.assessmentCard")}</CardTitle>
        </CardHeader>
        <CardContent>
          {latestAssessment ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-teal-600">{latestAssessment.overallCapacity}<span className="text-lg text-slate-400">/10</span></span>
                  {previousAssessment && (
                    <TrendBadge current={latestAssessment.overallCapacity} previous={previousAssessment.overallCapacity} />
                  )}
                </div>
                <span className="text-xs text-slate-400">{formatDate(latestAssessment.assessedAt)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {latestAssessment.cognitiveCapacity != null && (
                  <CapacityBar label={t("detail.cognitive")} value={latestAssessment.cognitiveCapacity} />
                )}
                {latestAssessment.physicalCapacity != null && (
                  <CapacityBar label={t("detail.physical")} value={latestAssessment.physicalCapacity} />
                )}
                {latestAssessment.emotionalCapacity != null && (
                  <CapacityBar label={t("detail.emotional")} value={latestAssessment.emotionalCapacity} />
                )}
                {latestAssessment.socialCapacity != null && (
                  <CapacityBar label={t("detail.social")} value={latestAssessment.socialCapacity} />
                )}
              </div>
              {latestAssessment.notes && (
                <p className="text-xs text-slate-500 italic leading-relaxed">{latestAssessment.notes}</p>
              )}
              {assessments.length > 1 && (
                <div className="mt-1 pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-400 mb-1.5">{t("detail.assessmentHistory")}</p>
                  <div className="flex flex-col gap-1">
                    {assessments.slice(1).map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">{formatDate(a.assessedAt)}</span>
                        <span className="font-medium text-slate-600">{a.overallCapacity}/10</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">{t("detail.noAssessment")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
