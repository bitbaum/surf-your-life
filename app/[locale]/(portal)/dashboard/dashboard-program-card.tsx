import { getTranslations } from "next-intl/server";
import type { ProgramProgress } from "@/lib/domain/check-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Link } from "@/i18n/navigation";

type Props = { programProgress: ProgramProgress | null };

export async function DashboardProgramCard({ programProgress }: Props) {
  if (!programProgress) return null;

  const t = await getTranslations("portal.dashboard");

  const programPct = programProgress.totalWeeks
    ? Math.round((programProgress.currentWeek / programProgress.totalWeeks) * 100)
    : 0;

  return (
    <Card className="mb-6 border-teal-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-teal-800">{programProgress.programTitle}</CardTitle>
          <span className="text-xs font-medium text-teal-600 bg-teal-50 border border-teal-200 px-2 py-1 rounded-full">
            {programProgress.totalWeeks
              ? t("programWeek", {
                  current: programProgress.currentWeek,
                  total: programProgress.totalWeeks,
                })
              : t("programWeekOpen", { current: programProgress.currentWeek })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {programProgress.totalWeeks > 0 && (
          <div className="mb-4">
            <ProgressBar value={Math.min(programPct, 100)} track="teal" />
            <p className="text-xs text-slate-400 mt-1">
              {t("programProgress", { pct: programPct })}
            </p>
          </div>
        )}
        {programProgress.currentPhase ? (
          <div className="bg-teal-50 rounded-lg p-3">
            <p className="text-sm font-medium text-teal-900">
              {programProgress.currentPhase.title}
            </p>
            <p className="text-sm text-teal-700 mt-1 leading-relaxed">
              {programProgress.currentPhase.guidance}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">{t("programNoPhase")}</p>
        )}
        <Link
          href="/program"
          className="inline-block mt-3 text-xs font-medium text-teal-600 hover:text-teal-800 transition-colors"
        >
          {t("viewProgram")}
        </Link>
      </CardContent>
    </Card>
  );
}
