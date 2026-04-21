"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { MOODS, ENERGY_SCALE, SLEEP_HOURS } from "@/lib/constants"
import type { CheckIn } from "@/lib/db/schema"

interface EditCheckInModalProps {
  checkIn: CheckIn
  checkInId: string
  onSave: () => void
  onCancel: () => void
}

export function EditCheckInModal({ checkIn, checkInId, onSave, onCancel }: EditCheckInModalProps) {
  const t = useTranslations("portal.checkIns")
  const tCheckIn = useTranslations("portal.checkIn")
  const moodLabels: Record<string, string> = {
    very_low: tCheckIn("moodVeryLow"),
    low: tCheckIn("moodLow"),
    neutral: tCheckIn("moodNeutral"),
    good: tCheckIn("moodGood"),
    excellent: tCheckIn("moodExcellent"),
  }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [mood, setMood] = useState(checkIn.mood)
  const [energy, setEnergy] = useState(checkIn.energyLevel)
  const [sleep, setSleep] = useState(checkIn.sleepHours != null ? String(checkIn.sleepHours) : "")
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
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{t("editMood")}</p>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(m.value)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                mood === m.value
                  ? "border-teal-500 bg-teal-50"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <span className="text-xl">{m.emoji}</span>
              <span className="text-xs text-slate-600">{moodLabels[m.value]}</span>
            </button>
          ))}
        </div>
      </div>

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

      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editSleepLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <input
          type="number"
          min={SLEEP_HOURS.min}
          max={SLEEP_HOURS.max}
          value={sleep}
          onChange={(e) => setSleep(e.target.value)}
          placeholder="e.g. 7"
          className="h-9 w-28 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editWinsLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={wins}
          onChange={(e) => setWins(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editChallengesLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
          {t("editNotesLabel")} <span className="text-slate-400 font-normal normal-case">{t("editOptional")}</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

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
