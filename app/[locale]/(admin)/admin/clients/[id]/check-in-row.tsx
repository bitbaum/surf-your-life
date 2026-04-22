import { formatDate, formatEnumValue } from "@/lib/utils"
import { MOOD_EMOJI } from "@/lib/constants"
import { CheckInNote } from "./check-in-note"
import type { CheckIn } from "@/lib/db/schema"
import { getTranslations } from "next-intl/server"

type Props = {
  ci: CheckIn
}

export async function CheckInRow({ ci }: Props) {
  const t = await getTranslations("admin.clients")

  return (
    <div className="py-3">
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
  )
}
