import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { roundOne } from "@/lib/utils";
import { PulseSparkline } from "./pulse-sparkline";
import { CLINIC_PULSE_WINDOW_DAYS, CLINIC_PULSE_MIN_DATA_POINTS } from "@/lib/constants";

export type PulseDay = {
  day: string;
  avgEnergy: number;
  avgMood: number;
  activeClients: number;
};

function windowAvg(days: PulseDay[], key: "avgEnergy" | "avgMood"): number | null {
  if (days.length === 0) return null;
  return roundOne(days.reduce((s, d) => s + d[key], 0) / days.length);
}

function windowDelta(
  recent: PulseDay[],
  prior: PulseDay[],
  key: "avgEnergy" | "avgMood",
): number | null {
  const avg = windowAvg(recent, key);
  const prev = windowAvg(prior, key);
  return avg != null && prev != null ? roundOne(avg - prev) : null;
}

function deltaLabel(d: number | null): string | null {
  if (d == null) return null;
  return d > 0 ? `+${d}` : String(d);
}
function deltaColor(d: number | null): string {
  if (d == null) return "text-slate-400";
  if (d > 0) return "text-teal-600";
  if (d < 0) return "text-red-500";
  return "text-slate-400";
}

const METRIC_VALUE_CLS = "text-2xl font-bold text-slate-800 leading-none mt-0.5";

interface Props {
  data: PulseDay[];
}

export async function ClinicPulseCard({ data }: Props) {
  const t = await getTranslations("admin.dashboard.clinicPulse");

  if (data.length < CLINIC_PULSE_MIN_DATA_POINTS) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-700">
            <Activity className="w-4 h-4 text-teal-600" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">{t("noData")}</p>
        </CardContent>
      </Card>
    );
  }

  const recent = data.slice(-CLINIC_PULSE_WINDOW_DAYS);
  const prior = data.slice(-CLINIC_PULSE_WINDOW_DAYS * 2, -CLINIC_PULSE_WINDOW_DAYS);

  const avg7Energy = windowAvg(recent, "avgEnergy");
  const avg7Mood = windowAvg(recent, "avgMood");
  const energyDelta = windowDelta(recent, prior, "avgEnergy");
  const moodDelta = windowDelta(recent, prior, "avgMood");
  const avgDailyClients = roundOne(data.reduce((s, d) => s + d.activeClients, 0) / data.length);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-700">
          <Activity className="w-4 h-4 text-teal-600" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-6 mb-3">
          <div>
            <p className="text-xs text-slate-400">{t("avgEnergy7d")}</p>
            <p className={METRIC_VALUE_CLS}>
              {avg7Energy ?? "—"}
              <span className="text-sm font-normal text-slate-400">/10</span>
            </p>
            {deltaLabel(energyDelta) && (
              <p className={`text-xs mt-0.5 ${deltaColor(energyDelta)}`}>
                {t("vsLast7d", { delta: deltaLabel(energyDelta)! })}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("avgMood7d")}</p>
            <p className={METRIC_VALUE_CLS}>
              {avg7Mood ?? "—"}
              <span className="text-sm font-normal text-slate-400">/5</span>
            </p>
            {deltaLabel(moodDelta) && (
              <p className={`text-xs mt-0.5 ${deltaColor(moodDelta)}`}>
                {t("vsLast7d", { delta: deltaLabel(moodDelta)! })}
              </p>
            )}
          </div>
          <div>
            <p className="text-xs text-slate-400">{t("dailyClients")}</p>
            <p className={METRIC_VALUE_CLS}>{avgDailyClients}</p>
          </div>
        </div>
        <PulseSparkline data={data} />
        <div className="flex items-center gap-4 mt-1.5">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-6 h-0.5 bg-teal-500 rounded" />
            {t("legendEnergy")}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className="inline-block w-6 border-t border-dashed border-violet-500" />
            {t("legendMood")}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
