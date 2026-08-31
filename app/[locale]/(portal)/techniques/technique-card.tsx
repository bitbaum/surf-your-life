"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, Circle, RotateCcw, Minus } from "lucide-react";
import type { computeTechniqueDebt, AssignmentWithTechnique } from "@/lib/domain/techniques";
type Debt = ReturnType<typeof computeTechniqueDebt>;

interface TechniqueCardProps {
  assignment: AssignmentWithTechnique;
  debt: Debt;
  categoryEmoji: Record<string, string>;
  submitting: string | null;
  onLog: (a: AssignmentWithTechnique) => void;
  onUndo: (a: AssignmentWithTechnique) => void;
}

export function TechniqueCard({
  assignment: a,
  debt,
  categoryEmoji,
  submitting,
  onLog,
  onUndo,
}: TechniqueCardProps) {
  const t = useTranslations("portal.techniques");
  const todayDone = debt.todayCompleted;
  const targetMet = todayDone >= debt.dailyTarget;
  const hasDebt = debt.catchUpReps > 0;

  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${
        targetMet ? "bg-teal-50 border-teal-200" : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{categoryEmoji[a.technique.category]}</span>
            <p className="text-sm font-semibold text-slate-900">{a.technique.name}</p>
            {a.technique.durationMinutes && (
              <span className="text-xs text-slate-400">{a.technique.durationMinutes} min</span>
            )}
          </div>
          {a.technique.description && (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {a.technique.description}
            </p>
          )}
          {a.notes && <p className="text-xs text-teal-700 mt-1 italic">{a.notes}</p>}
        </div>

        {/* Rep counter */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {todayDone > 0 && (
            <button
              onClick={() => onUndo(a)}
              disabled={!!submitting}
              className="w-7 h-7 rounded-full flex items-center justify-center border border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600 transition-colors disabled:opacity-50"
              title={t("undoRep")}
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
          )}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onLog(a)}
              disabled={!!submitting}
              className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
                targetMet
                  ? "bg-teal-600 text-white"
                  : "bg-white border-2 border-teal-300 text-teal-600 hover:bg-teal-50"
              } disabled:opacity-50`}
              title={t("logOne")}
            >
              {targetMet ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
            </button>
            <span className="text-xs text-slate-500">
              {todayDone}/{debt.dailyTarget}
            </span>
          </div>
        </div>
      </div>

      {/* Progress dots for daily target */}
      {debt.dailyTarget > 1 && (
        <div className="flex gap-1.5 mt-3">
          {Array.from({ length: debt.dailyTarget }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full ${i < todayDone ? "bg-teal-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
      )}

      {/* Catch-up nudge */}
      {hasDebt && !targetMet && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
          <RotateCcw className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
          <p className="text-xs text-amber-700">{t("catchUp", { reps: debt.catchUpReps })}</p>
        </div>
      )}

      {/* Instructions (collapsed by default) */}
      {a.technique.instructions && (
        <details className="mt-3">
          <summary className="text-xs text-teal-600 cursor-pointer hover:underline select-none">
            {t("howTo")}
          </summary>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
            {a.technique.instructions}
          </p>
        </details>
      )}

      {a.technique.resourceUrl && (
        <a
          href={a.technique.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-3 text-xs text-teal-600 hover:text-teal-700 hover:underline transition-colors"
        >
          {t("resource")}
        </a>
      )}
    </div>
  );
}
