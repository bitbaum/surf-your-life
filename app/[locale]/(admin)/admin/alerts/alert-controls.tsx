"use client";

import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";
import type { AlertType } from "@/lib/db/schema";
import type { AlertRow } from "./alert-list";

const ALL_FILTER = "all" as const;
type TypeFilter = AlertType | typeof ALL_FILTER;

interface Props {
  search: string;
  onSearch: (v: string) => void;
  searched: AlertRow[];
  activeTypes: AlertType[];
  typeFilter: TypeFilter;
  onTypeFilter: (v: TypeFilter) => void;
  visibleCount: number;
  resolvingAll: boolean;
  onResolveAll: () => void;
  mineOnly: boolean;
  onMineOnly: (v: boolean) => void;
  hasMineFilter: boolean;
}

export function AlertControls({
  search,
  onSearch,
  searched,
  activeTypes,
  typeFilter,
  onTypeFilter,
  visibleCount,
  resolvingAll,
  onResolveAll,
  mineOnly,
  onMineOnly,
  hasMineFilter,
}: Props) {
  const t = useTranslations("admin.alerts");

  return (
    <>
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
        {hasMineFilter && (
          <button
            onClick={() => onMineOnly(!mineOnly)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${mineOnly ? "bg-teal-600 text-white border-teal-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
          >
            {t("mineOnly")}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {activeTypes.length > 1 ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onTypeFilter(ALL_FILTER)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === ALL_FILTER ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
            >
              {t("filterAll")} ({searched.length})
            </button>
            {activeTypes.map((type) => {
              const count = searched.filter((a) => a.type === type).length;
              return (
                <button
                  key={type}
                  onClick={() => onTypeFilter(type)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${typeFilter === type ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
                >
                  {t(`type.${type}`)} ({count})
                </button>
              );
            })}
          </div>
        ) : (
          <div />
        )}
        {visibleCount > 1 && (
          <button
            onClick={onResolveAll}
            disabled={resolvingAll}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-teal-600 border border-slate-200 hover:border-teal-300 rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {resolvingAll ? t("resolvingAll") : t("resolveAll", { n: visibleCount })}
          </button>
        )}
      </div>
    </>
  );
}
