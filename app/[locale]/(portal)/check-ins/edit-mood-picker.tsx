"use client";

import { useTranslations } from "next-intl";
import { MOODS, CHIP_SELECTED, CHIP_UNSELECTED, COMPACT_LABEL_CLS } from "@/lib/constants";

interface Props {
  mood: string;
  onChange: (mood: string) => void;
}

export function EditMoodPicker({ mood, onChange }: Props) {
  const t = useTranslations("portal.checkIns");
  const tCheckIn = useTranslations("portal.checkIn");

  return (
    <div>
      <p className={`${COMPACT_LABEL_CLS} mb-2`}>{t("editMood")}</p>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => onChange(m.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
              mood === m.value ? CHIP_SELECTED : CHIP_UNSELECTED
            }`}
          >
            <span className="text-xl">{m.emoji}</span>
            <span className="text-xs text-slate-600">{tCheckIn(m.labelKey)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
