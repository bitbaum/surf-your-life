"use client"

import { useState } from "react"
import { useRouter } from "@/i18n/navigation"
import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MOODS, ENERGY_SCALE, SLEEP_HOURS } from "@/lib/constants"
import type { CheckIn } from "@/lib/db/schema"

interface Props {
  checkInId: string
  checkIn: CheckIn
}

export function CheckInActions({ checkInId, checkIn }: Props) {
  const router = useRouter()
  const [mode, setMode] = useState<"idle" | "confirmDelete" | "edit">("idle")
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // Edit form state
  const [mood, setMood] = useState(checkIn.mood)
  const [energy, setEnergy] = useState(checkIn.energyLevel)
  const [sleep, setSleep] = useState(checkIn.sleepHours != null ? String(checkIn.sleepHours) : "")
  const [wins, setWins] = useState(checkIn.wins ?? "")
  const [challenges, setChallenges] = useState(checkIn.challenges ?? "")
  const [notes, setNotes] = useState(checkIn.notes ?? "")

  async function handleDelete() {
    setDeleting(true)
    setError("")
    const res = await fetch(`/api/check-in/${checkInId}`, { method: "DELETE" })
    if (!res.ok) {
      setError("Could not delete. Please try again.")
      setDeleting(false)
      return
    }
    router.refresh()
  }

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
      setError("Could not save. Please try again.")
      setSaving(false)
      return
    }
    setMode("idle")
    setSaving(false)
    router.refresh()
  }

  const moodLabels: Record<string, string> = {
    very_low: "Very low",
    low: "Low",
    neutral: "Neutral",
    good: "Good",
    excellent: "Excellent",
  }

  if (mode === "confirmDelete") {
    return (
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-600">Delete this check-in?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setMode("idle")}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Cancel
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    )
  }

  if (mode === "edit") {
    return (
      <form onSubmit={handleSave} className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
        {/* Mood */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Mood</p>
          <div className="grid grid-cols-5 gap-2">
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

        {/* Energy */}
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Energy: <span className="text-teal-700 font-bold">{energy}/10</span>
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

        {/* Sleep */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
            Sleep hours <span className="text-slate-400 font-normal normal-case">(optional)</span>
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

        {/* Wins */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
            Wins <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Challenges */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
            Challenges <span className="text-slate-400 font-normal normal-case">(optional)</span>
          </label>
          <textarea
            value={challenges}
            onChange={(e) => setChallenges(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1.5">
            Notes <span className="text-slate-400 font-normal normal-case">(optional)</span>
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
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            Cancel
          </button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button
        onClick={() => setMode("edit")}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600 transition-colors"
        title="Edit check-in"
      >
        <Pencil className="w-3.5 h-3.5" />
        Edit
      </button>
      <button
        onClick={() => setMode("confirmDelete")}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 transition-colors"
        title="Delete check-in"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  )
}
