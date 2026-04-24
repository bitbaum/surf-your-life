"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ENERGY_SCALE, SYMPTOM_SCALE, FIELD_MAX_JOURNAL, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"
import { toast } from "sonner"
import { NlpEntry, type ParsedFill } from "./nlp-entry"
import { MoodCard } from "./mood-card"
import { EnergyCard } from "./energy-card"
import { ActivityPemCard } from "./activity-pem-card"
import { SleepCard } from "./sleep-card"
import { SymptomsCard, type Symptoms } from "./symptoms-card"
import { PageHeader } from "@/components/ui/page-header"

export default function CheckInPage() {
  const t = useTranslations("portal.checkIn")
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [form, setForm] = useState({
    mood: "",
    energy: ENERGY_SCALE.default as number,
    sleep: "",
    sleepQuality: null as number | null,
    activityLevel: null as string | null,
    pemFlag: false,
    pemSeverity: 5,
    orthostaticSymptoms: null as boolean | null,
    journalEntry: "",
    trackSymptoms: false,
    symptoms: {
      fatigue: SYMPTOM_SCALE.default,
      brainFog: SYMPTOM_SCALE.default,
      pain: SYMPTOM_SCALE.default,
      stress: SYMPTOM_SCALE.default,
    } as Symptoms,
  })
  const set = <K extends keyof typeof form>(key: K) =>
    (val: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: val }))

  function handleFill(data: ParsedFill) {
    setForm((prev) => ({
      ...prev,
      ...(data.mood && { mood: data.mood }),
      ...(data.energyLevel != null && { energy: data.energyLevel }),
      ...(data.sleepHours != null && { sleep: String(data.sleepHours) }),
      ...(data.activityLevel && { activityLevel: data.activityLevel }),
      ...(data.pemFlag != null && { pemFlag: data.pemFlag }),
      ...(data.orthostaticSymptoms != null && { orthostaticSymptoms: data.orthostaticSymptoms }),
      ...(data.journalEntry && { journalEntry: data.journalEntry }),
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.mood) { setError(t("errorMoodRequired")); return }
    setLoading(true)
    setError("")

    const showPem = form.activityLevel === "moderate" || form.activityLevel === "active"

    try {
      const res = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mood: form.mood,
          energyLevel: form.energy,
          sleepHours: form.sleep ? parseInt(form.sleep) : null,
          sleepQuality: form.sleepQuality,
          activityLevel: form.activityLevel ?? null,
          pemFlag: showPem ? form.pemFlag : false,
          pemSeverity: showPem && form.pemFlag ? form.pemSeverity : null,
          orthostaticSymptoms: form.orthostaticSymptoms,
          journalEntry: form.journalEntry.trim() || null,
          symptomFatigue: form.trackSymptoms ? form.symptoms.fatigue : null,
          symptomBrainFog: form.trackSymptoms ? form.symptoms.brainFog : null,
          symptomPain: form.trackSymptoms ? form.symptoms.pain : null,
          stressLevel: form.trackSymptoms ? form.symptoms.stress : null,
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
      <PageHeader title={t("title")} description={t("subtitle")} />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <NlpEntry onFill={handleFill} />

        <MoodCard value={form.mood} onChange={set("mood") as (v: string) => void} />
        <EnergyCard value={form.energy} onChange={set("energy") as (v: number) => void} />

        <ActivityPemCard
          activityLevel={form.activityLevel}
          setActivityLevel={set("activityLevel")}
          pemFlag={form.pemFlag}
          setPemFlag={set("pemFlag")}
          pemSeverity={form.pemSeverity}
          setPemSeverity={set("pemSeverity")}
        />

        <SleepCard
          sleep={form.sleep}
          setSleep={set("sleep")}
          sleepQuality={form.sleepQuality}
          setSleepQuality={set("sleepQuality")}
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
                  onClick={() => set("orthostaticSymptoms")(form.orthostaticSymptoms === val ? null : val)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.orthostaticSymptoms === val
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
            <Textarea
              value={form.journalEntry}
              onChange={(e) => set("journalEntry")(e.target.value)}
              placeholder={t("journalPlaceholder")}
              maxLength={FIELD_MAX_JOURNAL}
              rows={4}
            />
          </CardContent>
        </Card>

        <SymptomsCard
          trackSymptoms={form.trackSymptoms}
          setTrackSymptoms={set("trackSymptoms")}
          symptoms={form.symptoms}
          setSymptoms={set("symptoms")}
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={loading} size="lg">
          {loading ? t("loading") : t("submit")}
        </Button>
      </form>
    </div>
  )
}
