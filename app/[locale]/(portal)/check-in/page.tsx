"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  MOODS,
  ENERGY_SCALE,
  SLEEP_HOURS,
  SLEEP_QUALITY_OPTIONS,
  SYMPTOM_SCALE,
  ACTIVITY_LEVELS,
  PEM_SEVERITY_SCALE,
} from "@/lib/constants"
import { Sparkles, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function CheckInPage() {
  const t = useTranslations("portal.checkIn")
  const router = useRouter()

  // ── NLP parse state ──────────────────────────────────────────────────────
  const [nlpText, setNlpText] = useState("")
  const [parsing, setParsing] = useState(false)
  const [parsedHint, setParsedHint] = useState("")

  // ── Form state ───────────────────────────────────────────────────────────
  const [mood, setMood] = useState("")
  const [energy, setEnergy] = useState<number>(ENERGY_SCALE.default)
  const [sleep, setSleep] = useState("")
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [activityLevel, setActivityLevel] = useState<string | null>(null)
  const [pemFlag, setPemFlag] = useState(false)
  const [pemSeverity, setPemSeverity] = useState<number>(PEM_SEVERITY_SCALE.default)
  const [orthostaticSymptoms, setOrthostaticSymptoms] = useState<boolean | null>(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [trackSymptoms, setTrackSymptoms] = useState(false)
  const [symptoms, setSymptoms] = useState({
    fatigue: SYMPTOM_SCALE.default,
    brainFog: SYMPTOM_SCALE.default,
    pain: SYMPTOM_SCALE.default,
    stress: SYMPTOM_SCALE.default,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const showPemSection = activityLevel === "moderate" || activityLevel === "active"

  // ── NLP parse ────────────────────────────────────────────────────────────
  async function handleParse() {
    if (!nlpText.trim()) return
    setParsing(true)
    setParsedHint("")

    const res = await fetch("/api/check-in/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: nlpText }),
    })

    const data = await res.json()
    setParsing(false)

    if (!data.success) return

    const f = data.data
    if (f.mood) setMood(f.mood)
    if (f.energyLevel != null) setEnergy(f.energyLevel)
    if (f.sleepHours != null) setSleep(String(f.sleepHours))
    if (f.activityLevel) setActivityLevel(f.activityLevel)
    if (f.pemFlag != null) setPemFlag(f.pemFlag)
    if (f.orthostaticSymptoms != null) setOrthostaticSymptoms(f.orthostaticSymptoms)
    if (f.journalEntry) setJournalEntry(f.journalEntry)

    const filled = Object.keys(f).filter((k) => k !== "journalEntry" && f[k] != null).length
    setParsedHint(filled > 0 ? t("parseFilledHint", { n: filled }) : t("parseNoMatch"))
  }

  // ── Submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mood) { setError(t("errorMoodRequired")); return }
    setLoading(true)
    setError("")

    const res = await fetch("/api/check-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mood,
        energyLevel: energy,
        sleepHours: sleep ? parseInt(sleep) : null,
        sleepQuality,
        activityLevel: activityLevel ?? null,
        pemFlag: showPemSection ? pemFlag : false,
        pemSeverity: showPemSection && pemFlag ? pemSeverity : null,
        orthostaticSymptoms,
        journalEntry: journalEntry.trim() || null,
        // Keep old fields for backward compat with existing admin views
        notes: journalEntry.trim() || null,
        symptomFatigue: trackSymptoms ? symptoms.fatigue : null,
        symptomBrainFog: trackSymptoms ? symptoms.brainFog : null,
        symptomPain: trackSymptoms ? symptoms.pain : null,
        stressLevel: trackSymptoms ? symptoms.stress : null,
      }),
    })

    if (!res.ok) {
      if (res.status === 409) {
        toast.info(t("alreadyDoneBody"))
        router.push("/dashboard")
      } else {
        setError(t("error"))
        toast.error(t("error"))
      }
      setLoading(false)
      return
    }

    toast.success(t("submitSuccess"))
    router.push("/dashboard")
    router.refresh()
  }

  const moodLabels: Record<string, string> = {
    very_low: t("moodVeryLow"),
    low: t("moodLow"),
    neutral: t("moodNeutral"),
    good: t("moodGood"),
    excellent: t("moodExcellent"),
  }

  const symptomFields = [
    { key: "fatigue" as const, label: t("symptomFatigue") },
    { key: "brainFog" as const, label: t("symptomBrainFog") },
    { key: "pain" as const, label: t("symptomPain") },
    { key: "stress" as const, label: t("stressLevel") },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">

        {/* ── NLP quick entry ─────────────────────────────────────────────── */}
        <Card className="border-violet-100 bg-violet-50/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <CardTitle className="text-base text-violet-900">{t("nlpTitle")}</CardTitle>
            </div>
            <CardDescription className="text-violet-600">{t("nlpDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <textarea
              value={nlpText}
              onChange={(e) => setNlpText(e.target.value)}
              placeholder={t("nlpPlaceholder")}
              rows={2}
              maxLength={1000}
              className="w-full rounded-lg border border-violet-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 resize-none"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleParse}
                disabled={!nlpText.trim() || parsing}
                className="flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:text-violet-900 disabled:opacity-40 transition-colors"
              >
                {parsing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                {parsing ? t("nlpParsing") : t("nlpFill")}
              </button>
              {parsedHint && (
                <span className="text-xs text-violet-500">{parsedHint}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Mood ────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("mood")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
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
                  <span className="text-xs text-slate-600">{moodLabels[m.value]}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Energy ──────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("energy")}</CardTitle>
            <CardDescription>{t("energyDescription")}</CardDescription>
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

        {/* ── Activity + PEM ──────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("activityCard")}</CardTitle>
            <CardDescription>{t("activityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {ACTIVITY_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => {
                    setActivityLevel(level.value)
                    if (level.value === "rest" || level.value === "light") setPemFlag(false)
                  }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${
                    activityLevel === level.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-2xl">{level.emoji}</span>
                  <span className="text-xs text-slate-600">{t(level.labelKey as Parameters<typeof t>[0])}</span>
                </button>
              ))}
            </div>

            {showPemSection && (
              <div className="mt-5 pt-4 border-t border-slate-100">
                <p className="text-sm font-medium text-slate-700 mb-1">{t("pemCard")}</p>
                <p className="text-xs text-slate-400 mb-3">{t("pemDescription")}</p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pemFlag}
                    onChange={(e) => setPemFlag(e.target.checked)}
                    className="w-4 h-4 accent-teal-600"
                  />
                  <span className="text-sm text-slate-700">{t("pemLabel")}</span>
                </label>
                {pemFlag && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-slate-700">{t("pemSeverityLabel")}</label>
                      <span className="text-sm font-bold text-red-600">{pemSeverity}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-400 w-4">{PEM_SEVERITY_SCALE.min}</span>
                      <input
                        type="range"
                        min={PEM_SEVERITY_SCALE.min}
                        max={PEM_SEVERITY_SCALE.max}
                        value={pemSeverity}
                        onChange={(e) => setPemSeverity(parseInt(e.target.value))}
                        className="flex-1 accent-red-500"
                      />
                      <span className="text-xs text-slate-400 w-4">{PEM_SEVERITY_SCALE.max}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{t("pemHint")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Sleep ───────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("sleepCard")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex items-end gap-6 flex-wrap">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  {t("sleepHours")} <span className="text-slate-400 font-normal">{t("sleepOptional")}</span>
                </label>
                <input
                  type="number"
                  min={SLEEP_HOURS.min}
                  max={SLEEP_HOURS.max}
                  value={sleep}
                  onChange={(e) => setSleep(e.target.value)}
                  placeholder={t("sleepHoursPlaceholder")}
                  className="h-10 w-24 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 block mb-2">
                {t("sleepQuality")} <span className="text-slate-400 font-normal">{t("sleepOptional")}</span>
              </label>
              <div className="flex gap-2">
                {SLEEP_QUALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSleepQuality(sleepQuality === opt.value ? null : opt.value)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 flex-1 transition-all ${
                      sleepQuality === opt.value
                        ? "border-teal-500 bg-teal-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-xl">{opt.emoji}</span>
                    <span className="text-[10px] text-slate-500 text-center leading-tight">
                      {t(opt.labelKey as Parameters<typeof t>[0])}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Orthostatic symptoms ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("orthostaticCard")}</CardTitle>
            <CardDescription>{t("orthostaticDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {([true, false] as const).map((val) => (
                <button
                  key={String(val)}
                  type="button"
                  onClick={() => setOrthostaticSymptoms(orthostaticSymptoms === val ? null : val)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    orthostaticSymptoms === val
                      ? val
                        ? "border-orange-400 bg-orange-50 text-orange-700"
                        : "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {val ? t("orthostaticYes") : t("orthostaticNo")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Journal ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>{t("journalCard")}</CardTitle>
            <CardDescription>{t("journalDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={journalEntry}
              onChange={(e) => setJournalEntry(e.target.value)}
              placeholder={t("journalPlaceholder")}
              maxLength={3000}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
            />
          </CardContent>
        </Card>

        {/* ── Symptoms (collapsed) ────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("symptomsCard")}</CardTitle>
                <CardDescription className="mt-0.5">{t("symptomsDescription")}</CardDescription>
              </div>
              <button
                type="button"
                onClick={() => setTrackSymptoms(!trackSymptoms)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  trackSymptoms
                    ? "border-teal-500 bg-teal-50 text-teal-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {trackSymptoms ? t("symptomsHide") : t("symptomsShow")}
              </button>
            </div>
          </CardHeader>
          {trackSymptoms && (
            <CardContent className="flex flex-col gap-5">
              <p className="text-xs text-slate-400">{t("symptomsHint")}</p>
              {symptomFields.map(({ key, label }) => (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-slate-700">{label}</label>
                    <span className="text-sm font-bold text-slate-800 w-8 text-right">{symptoms[key]}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-slate-400 w-4">{SYMPTOM_SCALE.min}</span>
                    <input
                      type="range"
                      min={SYMPTOM_SCALE.min}
                      max={SYMPTOM_SCALE.max}
                      value={symptoms[key]}
                      onChange={(e) => setSymptoms((s) => ({ ...s, [key]: parseInt(e.target.value) }))}
                      className="flex-1 accent-teal-600"
                    />
                    <span className="text-xs text-slate-400 w-4">{SYMPTOM_SCALE.max}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("loading") : t("submit")}
        </Button>
      </form>
    </div>
  )
}
