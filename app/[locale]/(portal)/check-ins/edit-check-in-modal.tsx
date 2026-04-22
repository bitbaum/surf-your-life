"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ENERGY_SCALE } from "@/lib/constants"
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
  const [mood, setMood] = useState(checkIn.mood)
  const [energy, setEnergy] = useState(checkIn.energyLevel)
  const [sleep, setSleep] = useState(checkIn.sleepHours != null ? String(checkIn.sleepHours) : "")
  const [sleepQuality, setSleepQuality] = useState<number | null>(checkIn.sleepQuality ?? null)
  const [activityLevel, setActivityLevel] = useState<string | null>(checkIn.activityLevel ?? null)
  const [pemFlag, setPemFlag] = useState(checkIn.pemFlag ?? false)
  const [pemSeverity, setPemSeverity] = useState(checkIn.pemSeverity ?? 5)
  const [orthostaticSymptoms, setOrthostaticSymptoms] = useState<boolean | null>(checkIn.orthostaticSymptoms ?? null)
  const [journalEntry, setJournalEntry] = useState(checkIn.journalEntry ?? "")
  const [fatigue, setFatigue] = useState<number | null>(checkIn.symptomFatigue ?? null)
  const [brainFog, setBrainFog] = useState<number | null>(checkIn.symptomBrainFog ?? null)
  const [pain, setPain] = useState<number | null>(checkIn.symptomPain ?? null)
  const [stress, setStress] = useState<number | null>(checkIn.stressLevel ?? null)
  const [wins, setWins] = useState(checkIn.wins ?? "")
  const [challenges, setChallenges] = useState(checkIn.challenges ?? "")
  const [notes, setNotes] = useState(checkIn.notes ?? "")

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError("")
    const res = await fetch(`/api/check-in/${checkInId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood,
        energyLevel: energy,
        sleepHours: sleep ? parseInt(sleep) : null,
        sleepQuality,
        activityLevel,
        pemFlag,
        pemSeverity: pemFlag ? pemSeverity : null,
        orthostaticSymptoms,
        journalEntry: journalEntry || null,
        symptomFatigue: fatigue,
        symptomBrainFog: brainFog,
        symptomPain: pain,
        stressLevel: stress,
        wins: wins || undefined,
        challenges: challenges || undefined,
        notes: notes || undefined,
      }),
    })
    if (!res.ok) {
      setError(t("editError"))
      setSaving(false)
      return
    }
    setSaving(false)
    onSave()
  }

  return (
    <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
      <EditMoodPicker mood={mood} onChange={(v) => setMood(v as typeof mood)} />

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
          {t("editEnergy", { n: energy })}
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{ENERGY_SCALE.min}</span>
          <input
            type="range"
            min={ENERGY_SCALE.min}
            max={ENERGY_SCALE.max}
            value={energy}
            onChange={(e) => setEnergy(parseInt(e.target.value))}
            className="flex-1 accent-teal-600"
          />
          <span className="text-sm text-slate-400">{ENERGY_SCALE.max}</span>
        </div>
      </div>

      <EditSleepSection sleep={sleep} setSleep={setSleep} sleepQuality={sleepQuality} setSleepQuality={setSleepQuality} />
      <EditActivityPemSection activityLevel={activityLevel} setActivityLevel={setActivityLevel} pemFlag={pemFlag} setPemFlag={setPemFlag} pemSeverity={pemSeverity} setPemSeverity={setPemSeverity} />

      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{t("editOrthostaticLabel")}</p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={orthostaticSymptoms === true}
            onChange={(e) => setOrthostaticSymptoms(e.target.checked ? true : null)}
            className="rounded border-slate-300 accent-teal-600"
          />
          <span className="text-sm text-slate-700">{t("editOrthostaticFlagLabel")}</span>
        </label>
      </div>

      <EditSymptomsSection fatigue={fatigue} setFatigue={setFatigue} brainFog={brainFog} setBrainFog={setBrainFog} pain={pain} setPain={setPain} stress={stress} setStress={setStress} />
      <EditTextFields hasJournal={checkIn.journalEntry != null} journalEntry={journalEntry} setJournalEntry={setJournalEntry} wins={wins} setWins={setWins} challenges={challenges} setChallenges={setChallenges} notes={notes} setNotes={setNotes} />

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
