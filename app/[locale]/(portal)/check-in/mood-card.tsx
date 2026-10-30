"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOODS, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants";

interface Props {
  value: string;
  onChange: (mood: string) => void;
}

export function MoodCard({ value, onChange }: Props) {
  const t = useTranslations("portal.checkIn");
  const chosen = MOODS.find((m) => m.value === value);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("mood")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={value === m.value}
              aria-label={t(m.labelKey)}
              onClick={() => onChange(m.value)}
              className={`flex min-w-0 flex-col items-center gap-1 px-1 py-3 rounded-xl border-2 transition-all ${
                value === m.value ? CHIP_SELECTED : CHIP_UNSELECTED
              }`}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="hidden w-full text-xs text-slate-600 text-center leading-tight sm:block">
                {t(m.labelKey)}
              </span>
            </button>
          ))}
        </div>
        {/* As in the sleep card: on a phone the chosen mood is named under the row. */}
        <p className="mb-0 mt-2 min-h-5 text-center text-sm text-slate-600 sm:hidden" aria-hidden>
          {chosen ? t(chosen.labelKey) : ""}
        </p>
      </CardContent>
    </Card>
  );
}
