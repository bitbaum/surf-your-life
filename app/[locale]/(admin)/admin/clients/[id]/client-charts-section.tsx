import { getTranslations } from "next-intl/server"
import { SymptomsChart } from "@/components/ui/symptoms-chart"
import { SleepChart } from "@/components/ui/sleep-chart"
import { WellnessTrendChart } from "@/components/ui/wellness-trend-chart"
import { FunctionalAssessmentsChart } from "@/components/ui/functional-assessments-chart"
import { ChartCard } from "@/components/ui/chart-card"

type ChartCheckIn = {
  createdAt: Date
  mood: string
  energyLevel: number
  symptomFatigue: number | null
  symptomBrainFog: number | null
  symptomPain: number | null
  stressLevel: number | null
  sleepHours: number | null
}

type AssessmentPoint = {
  assessedAt: Date
  overallCapacity: number
  cognitiveCapacity: number | null
  physicalCapacity: number | null
  emotionalCapacity: number | null
  socialCapacity: number | null
}

interface Props {
  chartCheckIns: ChartCheckIn[]
  assessments: AssessmentPoint[]
}

export async function ClientChartsSection({ chartCheckIns, assessments }: Props) {
  const t = await getTranslations("admin.clients")

  const symptomData = chartCheckIns.map((ci) => ({
    createdAt: ci.createdAt,
    symptomFatigue: ci.symptomFatigue,
    symptomBrainFog: ci.symptomBrainFog,
    symptomPain: ci.symptomPain,
    stressLevel: ci.stressLevel,
  }))
  const hasSymptomData = symptomData.some(
    (c) => c.symptomFatigue != null || c.symptomBrainFog != null || c.symptomPain != null || c.stressLevel != null
  )
  const sleepData = chartCheckIns.map((ci) => ({ createdAt: ci.createdAt, sleepHours: ci.sleepHours }))
  const sleepCount = sleepData.filter((c) => c.sleepHours != null).length
  const wellnessData = chartCheckIns.map((ci) => ({ createdAt: ci.createdAt, mood: ci.mood, energyLevel: ci.energyLevel }))

  // Assessments come DESC from DB; chart needs ASC (oldest → newest)
  const assessmentChartData = [...assessments].reverse()

  return (
    <>
      {assessmentChartData.length >= 2 && (
        <ChartCard title={t("detail.assessmentChart.title")} subtitle={t("detail.assessmentChart.subtitle")}>
          <FunctionalAssessmentsChart
            data={assessmentChartData}
            labels={{
              overall: t("detail.assessmentChart.overall"),
              cognitive: t("detail.assessmentChart.cognitive"),
              physical: t("detail.assessmentChart.physical"),
              emotional: t("detail.assessmentChart.emotional"),
              social: t("detail.assessmentChart.social"),
            }}
          />
        </ChartCard>
      )}
      {hasSymptomData && symptomData.length >= 2 && (
        <ChartCard title={t("detail.symptomsChart.title")} subtitle={t("detail.symptomsChart.subtitle")}>
          <SymptomsChart
            data={symptomData}
            labels={{
              fatigue: t("detail.symptomsChart.fatigue"),
              brainFog: t("detail.symptomsChart.brainFog"),
              pain: t("detail.symptomsChart.pain"),
              stress: t("detail.symptomsChart.stress"),
            }}
          />
        </ChartCard>
      )}
      {sleepCount >= 2 && (
        <ChartCard title={t("detail.sleepChart.title")} subtitle={t("detail.sleepChart.subtitle")}>
          <SleepChart data={sleepData} formatHours={(n) => t("detail.sleepChart.hoursTooltip", { n })} />
        </ChartCard>
      )}
      {wellnessData.length >= 2 && (
        <ChartCard title={t("detail.wellnessChart.title")} subtitle={t("detail.wellnessChart.subtitle")}>
          <WellnessTrendChart
            data={wellnessData}
            labels={{ mood: t("detail.wellnessChart.mood"), energy: t("detail.wellnessChart.energy") }}
          />
        </ChartCard>
      )}
    </>
  )
}
