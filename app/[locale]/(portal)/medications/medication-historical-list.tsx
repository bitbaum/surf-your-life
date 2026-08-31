"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import type { MedicationEntry } from "@/lib/db/schema";

interface Props {
  medications: MedicationEntry[];
  deleting: string | null;
  onDelete: (id: string) => void;
}

export function MedicationHistoricalList({ medications, deleting, onDelete }: Props) {
  const t = useTranslations("portal.medications");
  const [expanded, setExpanded] = useState(false);

  if (medications.length === 0) return null;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 transition-colors"
      >
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        {t("past")} ({medications.length})
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 mt-3">
          {medications.map((med) => (
            <div
              key={med.id}
              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50 opacity-60"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700">{med.medicationName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                  {med.dose && <span className="text-xs text-slate-500">{med.dose}</span>}
                  {med.startDate && (
                    <span className="text-xs text-slate-400">
                      {med.startDate} → {med.endDate}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onDelete(med.id)}
                disabled={deleting === med.id}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
