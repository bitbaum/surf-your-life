"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ENERGY_SCALE, SYMPTOM_SCALE, FIELD_MAX_JOURNAL, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"
import { toast } from "sonner"
import { NlpEntry, type ParsedFill } from "./nlp-entry"
import { MoodCard } from "./mood-card"
import { EnergyCard } from "./energy-card"
import { ActivityPemCard } from "./activity-pem-card"
import { SleepCard } from "./sleep-card"
import { SymptomsCard, type Symptoms } from "./symptoms-card"

export default function CheckInPage() {
  const t = useTranslations("portal.checkIn")
  const router = useRouter()

  const [mood, setMood] = useState("")
  const [energy, setEnergy] = useState<number>(ENERGY_SCALE.default)
  const [sleep, setSleep] = useState("")
  const [sleepQuality, setSleepQuality] = useState<number | null>(null)
  const [activityLevel, setActivityLevel] = useState<string | null>(null)
  const [pemFlag, setPemFlag] = useState(false)
  const [pemSeverity, setPemSeverity] = useState(5)
  const [orthostaticSymptoms, setOrthostaticSymptoms] = useState<boolean | null>(null)
  const [journalEntry, setJournalEntry] = useState("")
  const [trackSymptoms, setTrackSymptoms] = useState(false)
  const [symptoms, setSymptoms] = useState<Symptoms>({
    fatigue: SYMPTOM_SCALE.default,
    brainFog: SYMPTOM_SCALE.default,
    pain: SYMPTOM_SCALE.default,
    stress: SYMPTOM_SCALE.default,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  function handleFill(data: ParsedFill) {
    if (data.mood) setMood(data.mood)
    if (data.energyLevel != null) setEnergy(data.energyLevel)
    if (data.sleepHours != null) setSleep(String(data.sleepHours))
    if (data.activityLevel) setActivityLevel(data.activityLevel)
    if (data.pemFlag != null) setPemFlag(data.pemFlag)
    if (data.orthostaticSymptoms != null) setOrthostaticSymptoms(data.orthostaticSymptoms)
    if (data.journalEntry) setJournalEntry(data.journalEntry)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!mood) { setError(t("errorMoodRequired")); return }
    setLoading(true)
    setError("")

    const showPem = activityLevel === "moderate" || activityLevel === "active"

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood,
          energyLevel: energy,
          sleepHours: sleep ? parseInt(sleep) : null,
          sleepQuality,
          activityLevel: activityLevel ?? null,
          pemFlag: showPem ? pemFlag : false,
          pemSeverity: showPem && pemFlag ? pemSeverity : null,
          orthostaticSymptoms,
          journalEntry: journalEntry.trim() || null,
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
        return
      }

      toast.success(t("submitSuccess"))
      router.push("/dashboard")
      router.refresh()
    } catch {
      setError(t("error"))
      toast.error(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <NlpEntry onFill={handleFill} />

        <MoodCard value={mood} onChange={setMood} />
        <EnergyCard value={energy} onChange={setEnergy} />

        <ActivityPemCard
          activityLevel={activityLevel}
          setActivityLevel={setActivityLevel}
          pemFlag={pemFlag}
          setPemFlag={setPemFlag}
          pemSeverity={pemSeverity}
          setPemSeverity={setPemSeverity}
        />

        <SleepCard
          sleep={sleep}
          setSleep={setSleep}
          sleepQuality={sleepQuality}
          setSleepQuality={setSleepQuality}
        />

        {/* Orthostatic */}
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
                        : CHIP_SELECTED
                      : CHIP_UNSELECTED
                  }`}
                >
                  {val ? t("orthostaticYes") : t("orthostaticNo")}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Journal */}
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
              maxLength={FIELD_MAX_JOURNAL}
              rows={4}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 resize-none"
            />
          </CardContent>
        </Card>

        <SymptomsCard
          trackSymptoms={trackSymptoms}
          setTrackSymptoms={setTrackSymptoms}
          symptoms={symptoms}
          setSymptoms={setSymptoms}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("loading") : t("submit")}
        </Button>
      </form>
    </div>
  )
}
