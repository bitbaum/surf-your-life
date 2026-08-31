"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Pencil, Clock, Calendar } from "lucide-react";
import type { Program } from "@/lib/db/schema";
import type { ProgramPhase } from "@/lib/domain/program";

interface Props {
  program: Program;
  phases: ProgramPhase[];
  onEdit: () => void;
}

export function ProgramViewCard({ program, phases, onEdit }: Props) {
  const t = useTranslations("admin.programs");
  const tConcerns = useTranslations("concerns");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{program.title}</CardTitle>
            {program.description && (
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">{program.description}</p>
            )}
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors flex-shrink-0"
          >
            <Pencil className="w-3.5 h-3.5" />
            {t("edit")}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          {program.durationWeeks && (
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {program.durationWeeks} {t("weeks")}
            </span>
          )}
          {program.targetConcern && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500" />
              {tConcerns(program.targetConcern as Parameters<typeof tConcerns>[0])}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {t("createdOn", { date: formatDate(program.createdAt) })}
          </span>
        </div>

        {phases.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {t("fieldProgramPhases")} ({phases.length})
            </p>
            <div className="flex flex-col gap-2">
              {phases.map((phase, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-14 text-xs font-medium text-slate-400 pt-0.5">
                    {t("phaseWeek")} {phase.week}
                  </span>
                  <div>
                    <p className="font-medium text-slate-800">{phase.title}</p>
                    {phase.guidance && (
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                        {phase.guidance}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
