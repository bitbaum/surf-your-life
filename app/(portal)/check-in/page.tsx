"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { MOODS, ENERGY_SCALE, SLEEP_HOURS } from "@/lib/constants"

export default function CheckInPage() {
  const router = useRouter()
  const [mood, setMood] = useState("")
  const [energy, setEnergy] = useState(5)
  const [sleep, setSleep] = useState("")
  const [notes, setNotes] = useState("")
  const [wins, setWins] = useState("")
  const [challenges, setChallenges] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mood) { setError("Please select your mood"); return }
    setLoading(true)
    setError("")

    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, energyLevel: energy, sleepHours: sleep ? parseInt(sleep) : null, notes, wins, challenges }),
    })

    if (!res.ok) {
      setError(res.status === 409 ? "You've already checked in today. See you tomorrow!" : "Failed to save check-in")
      if (res.status === 409) {
        setTimeout(() => router.push("/dashboard"), 2000)
      }
      setLoading(false)
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Daily Check-in</h1>
        <p className="text-slate-500 mt-1">A few minutes to reflect on your day</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>How are you feeling?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    mood === m.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-xs text-slate-600">{m.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Energy level</CardTitle>
            <CardDescription>1 = exhausted, 10 = fully charged</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400 w-4">{ENERGY_SCALE.min}</span>
              <input
                type="range"
                min={ENERGY_SCALE.min}
                max={ENERGY_SCALE.max}
                value={energy}
                onChange={(e) => setEnergy(parseInt(e.target.value))}
                className="flex-1 accent-teal-600"
              />
              <span className="text-sm text-slate-400 w-4">{ENERGY_SCALE.max}</span>
              <span className="text-xl font-bold text-teal-700 w-8 text-center">{energy}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick reflection</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Hours of sleep last night
              </label>
              <input
                type="number"
                min={SLEEP_HOURS.min}
                max={SLEEP_HOURS.max}
                value={sleep}
                onChange={(e) => setSleep(e.target.value)}
                placeholder="e.g. 7"
                className="h-10 w-32 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Today&apos;s wins</label>
              <textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="What went well?"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Challenges</label>
              <textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="What was difficult?"
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Any other notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else on your mind?"
                rows={3}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </CardContent>
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} size="lg">
          {loading ? "Saving…" : "Save check-in"}
        </Button>
      </form>
    </div>
  )
}
