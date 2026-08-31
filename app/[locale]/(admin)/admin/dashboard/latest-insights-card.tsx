import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatDate, buildLastNDayStrings } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { DayCadenceSparkline } from "@/components/ui/day-cadence-sparkline";
import type { CadenceMap } from "@/lib/db/check-in-cadence";

type ClientInsight = {
  clientId: string;
  clientName: string | null;
  aiInsight: string;
  createdAt: Date;
};

interface Props {
  insights: ClientInsight[];
  cadence: CadenceMap;
}

export async function LatestInsightsCard({ insights, cadence }: Props) {
  const t = await getTranslations("admin.dashboard");
  const tClients = await getTranslations("admin.clients");
  const sparkDays = buildLastNDayStrings(7);
  const sparkLabels = {
    missed: tClients("dotMissed"),
    checkedIn: tClients("dotCheckedIn"),
    pem: tClients("dotPem"),
  };
  const sparkHint = tClients("cadenceHint");

  if (insights.length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-violet-700">
            <Sparkles className="w-4 h-4" />
            {t("weeklyInsights")} ({insights.length})
          </CardTitle>
          <Link
            href="/admin/clients?sort=checkin_desc"
            className="text-sm text-violet-600 hover:underline"
          >
            {t("viewAll")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-slate-100">
          {insights.map((row) => {
            const spark = cadence[row.clientId];
            return (
              <Link
                key={row.clientId}
                href={`/admin/clients/${row.clientId}`}
                className="flex items-start justify-between gap-4 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-medium text-slate-800">{row.clientName ?? "—"}</p>
                    <DayCadenceSparkline
                      days={sparkDays}
                      checkedIn={new Set(spark?.checkedIn ?? [])}
                      pemDays={new Set(spark?.pemDays ?? [])}
                      hint={sparkHint}
                      dayLabels={sparkLabels}
                    />
                  </div>
                  <p className="text-xs text-violet-800 leading-relaxed line-clamp-2">
                    {row.aiInsight}
                  </p>
                </div>
                <p className="text-xs text-slate-400 flex-shrink-0 pt-0.5">
                  {formatDate(row.createdAt)}
                </p>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
