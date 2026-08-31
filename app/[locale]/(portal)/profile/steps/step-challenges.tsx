"use client";
import { useTranslations } from "next-intl";
import { MAIN_CONCERNS, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants";
import type { FormState } from "../profile-form.helpers";

export function StepChallenges({
  form,
  onToggle,
}: {
  form: FormState;
  onToggle: (value: string) => void;
}) {
  const t = useTranslations("portal.profile");

  const tc = useTranslations("concerns");

  return (
    <div>
      <p className="text-sm text-slate-500 mb-4">{t("concernsNote")}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {MAIN_CONCERNS.map((value) => {
          const selected = form.mainConcerns.includes(value);
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-left flex items-center gap-2 ${
                selected ? CHIP_SELECTED : CHIP_UNSELECTED
              }`}
            >
              <span
                className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                  selected ? "border-teal-500 bg-teal-500" : "border-slate-300"
                }`}
              >
                {selected && <span className="text-white text-xs">✓</span>}
              </span>
              {tc(value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
