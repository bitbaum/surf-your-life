import { getTranslations } from "next-intl/server";
import { ChartCard } from "@/components/ui/chart-card";
import { InsightBanner } from "@/components/ui/insight-banner";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";
import { WellnessTrendChart } from "@/components/ui/wellness-trend-chart";
import { SleepChart } from "@/components/ui/sleep-chart";
import { SymptomsChart } from "@/components/ui/symptoms-chart";

type TrendPoint = {
  createdAt: Date;
  mood: string;
  energyLevel: number;
  sleepHours: number | null;
  symptomFatigue: number | null;
  symptomBrainFog: number | null;
  symptomPain: number | null;
  stressLevel: number | null;
};

interface Props {
  trendCheckIns: TrendPoint[];
  hasSymptomData: boolean;
  insight: string | null;
  hasRecentCheckIns: boolean;
}

export async function DashboardCharts({
  trendCheckIns,
  hasSymptomData,
  insight,
  hasRecentCheckIns,
}: Props) {
  const t = await getTranslations("portal.dashboard");
  const tCheckIns = await getTranslations("portal.checkIns");

  return (
    <>
      {trendCheckIns.length >= 2 && (
        <ChartCard
          className="mb-6"
          title={t("wellnessTrend")}
          subtitle={t("wellnessTrendSubtitle")}
          action={
            <Link href="/check-ins" className="text-sm text-teal-600 hover:underline shrink-0">
              {t("viewAll")}
            </Link>
          }
        >
          <WellnessTrendChart
            data={trendCheckIns}
            labels={{ mood: t("chartMood"), energy: t("chartEnergy") }}
          />
        </ChartCard>
      )}

      {trendCheckIns.filter((c) => c.sleepHours != null).length >= 2 && (
        <ChartCard className="mb-6" title={t("sleepTrend")}>
          <SleepChart
            data={trendCheckIns}
            formatHours={(n) => tCheckIns("sleepHoursTooltip", { n })}
          />
          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
            <span>{formatDate(trendCheckIns[0].createdAt)}</span>
            <span>{formatDate(trendCheckIns[trendCheckIns.length - 1].createdAt)}</span>
          </div>
        </ChartCard>
      )}

      {hasSymptomData && trendCheckIns.length >= 2 && (
        <ChartCard className="mb-6" title={t("symptomsTitle")} subtitle={t("symptomsSubtitle")}>
          <SymptomsChart
            data={trendCheckIns}
            labels={{
              fatigue: t("chartFatigue"),
              brainFog: t("chartBrainFog"),
              pain: t("chartPain"),
              stress: t("chartStress"),
            }}
          />
        </ChartCard>
      )}

      {insight && (
        <div className="mb-6">
          <InsightBanner title={t("insightTitle")} body={insight} />
        </div>
      )}

      {hasRecentCheckIns && (
        <div className="flex justify-center">
          <Link
            href="/check-ins"
            className="text-sm text-slate-400 hover:text-teal-600 transition-colors"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </>
  );
}
