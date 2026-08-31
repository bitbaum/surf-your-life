import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { techniqueAssignments, techniqueLogs } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { localDateString, addDaysISO, formatDate } from "@/lib/utils";
import { computeDailyAdherenceTrend } from "@/lib/domain/techniques";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { BookOpen, CheckCircle2 } from "lucide-react";

export async function DashboardTechniquesCard({ userId }: { userId: string }) {
  const t = await getTranslations("portal.dashboard");

  const today = localDateString(new Date());
  const sevenDaysAgo = addDaysISO(today, -6);

  const [assignments, logs] = await Promise.all([
    db.query.techniqueAssignments.findMany({
      where: and(
        eq(techniqueAssignments.clientId, userId),
        eq(techniqueAssignments.isActive, true),
      ),
      columns: { id: true, frequencyPerDay: true, startDate: true, endDate: true },
    }),
    db.query.techniqueLogs.findMany({
      where: and(eq(techniqueLogs.userId, userId), gte(techniqueLogs.date, sevenDaysAgo)),
      columns: { assignmentId: true, date: true, completedReps: true },
    }),
  ]);

  if (assignments.length === 0) return null;

  const repsTodayById: Record<string, number> = {};
  for (const l of logs.filter((l) => l.date === today)) {
    repsTodayById[l.assignmentId] = Math.max(repsTodayById[l.assignmentId] ?? 0, l.completedReps);
  }
  const doneToday = assignments.filter(
    (a) => (repsTodayById[a.id] ?? 0) >= a.frequencyPerDay,
  ).length;
  const allDone = doneToday === assignments.length;

  const trend = computeDailyAdherenceTrend(assignments, logs, today, 7);

  return (
    <Card className={`mb-6 ${allDone ? "border-teal-200 bg-teal-50/30" : "border-slate-200"}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4 text-teal-600" />
            {t("techniquesTitle")}
          </CardTitle>
          <div className="flex items-center gap-3 flex-shrink-0">
            {allDone ? (
              <span className="flex items-center gap-1 text-sm font-medium text-teal-600">
                <CheckCircle2 className="w-4 h-4" />
                {t("techniquesAllDone")}
              </span>
            ) : (
              <span className="text-sm text-slate-500">
                {t("techniquesDone", { done: doneToday, total: assignments.length })}
              </span>
            )}
            <Link
              href="/techniques"
              className="text-xs text-teal-600 hover:text-teal-700 hover:underline transition-colors"
            >
              {t("viewTechniques")}
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 mt-1">
          {trend.map(({ date, pct }) => {
            const isToday = date === today;
            const dotColor =
              pct === 100 ? "bg-teal-500" : pct > 0 ? "bg-amber-400" : "bg-slate-200";
            const label =
              pct === 100
                ? t("techniquesDotDone")
                : pct > 0
                  ? t("techniquesDotPartial")
                  : t("techniquesDotNone");
            return (
              <div
                key={date}
                className={`flex-1 h-2 rounded-full ${dotColor} ${isToday ? "ring-2 ring-offset-1 ring-teal-400" : ""}`}
                title={`${formatDate(date)} · ${label}`}
              />
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-2">{t("cadenceHint")}</p>
      </CardContent>
    </Card>
  );
}
