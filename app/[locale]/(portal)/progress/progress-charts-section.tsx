import { getTranslations } from "next-intl/server";
import { WellnessTrendChart } from "@/components/ui/wellness-trend-chart";
import { SymptomsChart } from "@/components/ui/symptoms-chart";
import { SleepChart } from "@/components/ui/sleep-chart";
import { FunctionalAssessmentsChart } from "@/components/ui/functional-assessments-chart";
import { ChartCard } from "@/components/ui/chart-card";

type CheckInPoint = {
  createdAt: Date;
  mood: string;
  energyLevel: number;
  sleepHours: number | null;
  symptomFatigue: number | null;
  symptomBrainFog: number | null;
  symptomPain: number | null;
  stressLevel: number | null;
};

type AssessmentPoint = {
  assessedAt: Date;
  overallCapacity: number;
  cognitiveCapacity: number | null;
  physicalCapacity: number | null;
  emotionalCapacity: number | null;
  socialCapacity: number | null;
};

interface Props {
  checkIns: CheckInPoint[];
  assessments: AssessmentPoint[];
}

export async function ProgressChartsSection({ checkIns, assessments }: Props) {
  const t = await getTranslations("portal.progress");

  const hasSymptomData = checkIns.some(
    (c) =>
      c.symptomFatigue != null ||
      c.symptomBrainFog != null ||
      c.symptomPain != null ||
      c.stressLevel != null,
  );
  const sleepCount = checkIns.filter((c) => c.sleepHours != null).length;

  return (
    <>
      {assessments.length >= 2 && (
        <ChartCard className="mt-4" title={t("chartTitle")} subtitle={t("chartSubtitle")}>
          <FunctionalAssessmentsChart
            data={assessments}
            labels={{
              overall: t("chartOverall"),
              cognitive: t("chartCognitive"),
              physical: t("chartPhysical"),
              emotional: t("chartEmotional"),
              social: t("chartSocial"),
            }}
          />
        </ChartCard>
      )}

      {checkIns.length >= 2 && (
        <ChartCard title={t("wellnessTrendTitle")} subtitle={t("wellnessTrendSubtitle")}>
          <WellnessTrendChart
            data={checkIns}
            labels={{ mood: t("wellnessMood"), energy: t("wellnessEnergy") }}
          />
        </ChartCard>
      )}

      {hasSymptomData && checkIns.length >= 2 && (
        <ChartCard title={t("symptomsChartTitle")} subtitle={t("symptomsChartSubtitle")}>
          <SymptomsChart
            data={checkIns}
            labels={{
              fatigue: t("symptomFatigue"),
              brainFog: t("symptomBrainFog"),
              pain: t("symptomPain"),
              stress: t("symptomStress"),
            }}
          />
        </ChartCard>
      )}

      {sleepCount >= 2 && (
        <ChartCard title={t("sleepChartTitle")} subtitle={t("sleepChartSubtitle")}>
          <SleepChart data={checkIns} formatHours={(n) => t("sleepHoursTooltip", { n })} />
        </ChartCard>
      )}
    </>
  );
}
