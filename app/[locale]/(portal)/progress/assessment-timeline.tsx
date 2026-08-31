import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { formatDate } from "@/lib/utils";
import type { FunctionalAssessment } from "@/lib/db/schema";

interface Props {
  assessments: FunctionalAssessment[];
  delta: number | null;
}

export async function AssessmentTimeline({ assessments, delta }: Props) {
  const t = await getTranslations("portal.progress");

  if (assessments.length === 0) {
    return (
      <EmptyStateCard
        cardClassName="mt-4"
        message={t("noAssessments")}
        action={
          <Link
            href="/assessments"
            className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
          >
            {t("doAssessment")} →
          </Link>
        }
      />
    );
  }

  const first = assessments[0];
  const latest = assessments[assessments.length - 1];

  return (
    <>
      <p className="text-sm text-slate-600 mt-2 mb-6">
        {assessments.length === 1
          ? t("narrativeSingle", { capacity: first.overallCapacity })
          : t("narrativeMultiple", {
              n: assessments.length,
              first: first.overallCapacity,
              latest: latest.overallCapacity,
            })}
      </p>

      <div className="flex flex-col gap-3">
        {assessments.map((a, i) => {
          const isFirst = i === 0;
          const isLatest = i === assessments.length - 1;

          return (
            <Card key={a.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium text-slate-700">
                      {formatDate(a.assessedAt)}
                    </CardTitle>
                    {isFirst && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {t("firstAssessment")}
                      </span>
                    )}
                    {isLatest && assessments.length > 1 && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full">
                        {t("latestAssessment")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isLatest && delta != null && (
                      <span
                        className={`text-xs font-medium ${delta >= 0 ? "text-teal-600" : "text-red-500"}`}
                      >
                        {delta >= 0
                          ? t("improvementSince", { n: `+${delta}` })
                          : t("declineSince", { n: delta })}
                      </span>
                    )}
                    <span className="text-xl font-bold text-teal-700">
                      {a.overallCapacity}
                      <span className="text-xs font-normal text-slate-400">/10</span>
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 w-28">{t("overallCapacity")}</span>
                  <ProgressBar value={(a.overallCapacity / 10) * 100} className="flex-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
