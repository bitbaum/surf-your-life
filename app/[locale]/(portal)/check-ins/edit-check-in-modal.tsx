"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ENERGY_SCALE, COMPACT_LABEL_CLS } from "@/lib/constants"
import type { CheckIn } from "@/lib/db/schema"
import { EditMoodPicker } from "./edit-mood-picker"
import { EditSleepSection } from "./edit-sleep-section"
import { EditActivityPemSection } from "./edit-activity-pem-section"
import { EditSymptomsSection } from "./edit-symptoms-section"
import { EditTextFields } from "./edit-text-fields"

interface EditCheckInModalProps {
  checkIn: CheckIn
  checkInId: string
  onSave: () => void
  onCancel: () => void
}

export function EditCheckInModal({ checkIn, checkInId, onSave, onCancel }: EditCheckInModalProps) {
  const t = useTranslations("portal.checkIns")

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    mood: checkIn.mood,
    energy: checkIn.energyLevel ?? ENERGY_SCALE.default,
    sleep: checkIn.sleepHours != null ? String(checkIn.sleepHours) : "",
    sleepQuality: checkIn.sleepQuality ?? null as number | null,
    activityLevel: checkIn.activityLevel ?? null as string | null,
    pemFlag: checkIn.pemFlag ?? false,
    pemSeverity: checkIn.pemSeverity ?? 5,
    orthostaticSymptoms: checkIn.orthostaticSymptoms ?? null as boolean | null,
    journalEntry: checkIn.journalEntry ?? "",
    fatigue: checkIn.symptomFatigue ?? null as number | null,
    brainFog: checkIn.symptomBrainFog ?? null as number | null,
    pain: checkIn.symptomPain ?? null as number | null,
    stress: checkIn.stressLevel ?? null as number | null,
    wins: checkIn.wins ?? "",
    challenges: checkIn.challenges ?? "",
    notes: checkIn.notes ?? "",
  })
  const set = <K extends keyof typeof form>(key: K) =>
    (val: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: val }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch(`/api/check-in/${checkInId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: form.mood,
          energyLevel: form.energy,
          sleepHours: form.sleep ? parseInt(form.sleep) : null,
          sleepQuality: form.sleepQuality,
          activityLevel: form.activityLevel,
          pemFlag: form.pemFlag,
          pemSeverity: form.pemFlag ? form.pemSeverity : null,
          orthostaticSymptoms: form.orthostaticSymptoms,
          journalEntry: form.journalEntry || null,
          symptomFatigue: form.fatigue,
          symptomBrainFog: form.brainFog,
          symptomPain: form.pain,
          stressLevel: form.stress,
          wins: form.wins || undefined,
          challenges: form.challenges || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (!res.ok) {
        setError(t("editError"))
        return
      }
      onSave()
    } catch {
      setError(t("editError"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
      <EditMoodPicker mood={form.mood} onChange={set("mood") as (v: string) => void} />

      <div>
        <p className={`${COMPACT_LABEL_CLS} mb-2`}>
          {t("editEnergy", { n: form.energy })}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{ENERGY_SCALE.min}</span>
          <input
            type="range"
            min={ENERGY_SCALE.min}
            max={ENERGY_SCALE.max}
            value={form.energy}
            onChange={(e) => set("energy")(parseInt(e.target.value))}
            className="flex-1 accent-teal-600"
          />
          <span className="text-sm text-slate-400">{ENERGY_SCALE.max}</span>
        </div>
      </div>

      <EditSleepSection sleep={form.sleep} setSleep={set("sleep")} sleepQuality={form.sleepQuality} setSleepQuality={set("sleepQuality")} />
      <EditActivityPemSection activityLevel={form.activityLevel} setActivityLevel={set("activityLevel")} pemFlag={form.pemFlag} setPemFlag={set("pemFlag")} pemSeverity={form.pemSeverity} setPemSeverity={set("pemSeverity")} />

      <div>
        <p className={`${COMPACT_LABEL_CLS} mb-2`}>{t("editOrthostaticLabel")}</p>
        <div className="flex gap-2">
          {([true, false] as const).map((val) => (
            <button
              key={String(val)}
              type="button"
              onClick={() => set("orthostaticSymptoms")(form.orthostaticSymptoms === val ? null : val)}
              className={`px-4 py-1.5 rounded-full border text-xs font-medium transition-all ${
                form.orthostaticSymptoms === val
                  ? val
                    ? "border-orange-400 bg-orange-50 text-orange-700"
                    : "border-teal-500 bg-teal-50 text-teal-700"
                  : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
              }`}
            >
              {val ? t("editOrthostaticYes") : t("editOrthostaticNo")}
            </button>
          ))}
        </div>
      </div>

      <EditSymptomsSection fatigue={form.fatigue} setFatigue={set("fatigue")} brainFog={form.brainFog} setBrainFog={set("brainFog")} pain={form.pain} setPain={set("pain")} stress={form.stress} setStress={set("stress")} />
      <EditTextFields hasJournal={checkIn.journalEntry != null} journalEntry={form.journalEntry} setJournalEntry={set("journalEntry")} wins={form.wins} setWins={set("wins")} challenges={form.challenges} setChallenges={set("challenges")} notes={form.notes} setNotes={set("notes")} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={saving}>
          {saving ? t("editSaving") : t("editSave")}
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          {t("editCancel")}
        </button>
      </div>
    </form>
  )
}
