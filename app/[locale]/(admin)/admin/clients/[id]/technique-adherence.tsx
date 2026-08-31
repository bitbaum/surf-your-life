"use client";

import { useLocale } from "next-intl";
import { ADHERENCE_GOOD_DAYS, ADHERENCE_OK_DAYS } from "@/lib/constants";
import type { LogsGridByAssignment } from "@/lib/domain/techniques";

export function AdherenceBadge({ days }: { days: number }) {
  const color =
    days >= ADHERENCE_GOOD_DAYS
      ? "text-teal-600 bg-teal-50"
      : days >= ADHERENCE_OK_DAYS
        ? "text-amber-600 bg-amber-50"
        : "text-red-500 bg-red-50";
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${color}`}>{days}/7d</span>
  );
}

export function AdherenceGrid({
  assignmentId,
  frequencyPerDay,
  logsGrid,
}: {
  assignmentId: string;
  frequencyPerDay: number;
  logsGrid: LogsGridByAssignment;
}) {
  const locale = useLocale();
  // Build last 7 days using local date (not UTC) so keys match client-local YYYY-MM-DD logs.
  const days: { iso: string; label: string }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const label = new Intl.DateTimeFormat(locale, { weekday: "short" }).format(d);
    days.push({ iso, label });
  }

  const grid = logsGrid[assignmentId] ?? {};

  return (
    <div className="mt-2 pt-2 border-t border-slate-100 flex gap-1.5">
      {days.map(({ iso, label }) => {
        const reps = grid[iso] ?? 0;
        const met = reps >= frequencyPerDay;
        const partial = reps > 0 && !met;
        const dotColor = met ? "bg-teal-500" : partial ? "bg-amber-400" : "bg-slate-200";
        const textColor = met
          ? "text-teal-600 font-semibold"
          : partial
            ? "text-amber-600"
            : "text-slate-400";
        return (
          <div key={iso} className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-[10px] text-slate-400">{label}</span>
            <div className={`w-5 h-5 rounded-full ${dotColor} flex items-center justify-center`}>
              {reps > 0 && (
                <span className="text-[9px] text-white font-bold leading-none">{reps}</span>
              )}
            </div>
            <span className={`text-[9px] leading-none ${textColor}`}>/{frequencyPerDay}</span>
          </div>
        );
      })}
    </div>
  );
}
