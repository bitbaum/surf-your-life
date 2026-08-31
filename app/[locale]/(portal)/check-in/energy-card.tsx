"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ENERGY_SCALE } from "@/lib/constants";

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export function EnergyCard({ value, onChange }: Props) {
  const t = useTranslations("portal.checkIn");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("energy")}</CardTitle>
        <CardDescription>{t("energyDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 w-4">{ENERGY_SCALE.min}</span>
          <input
            type="range"
            min={ENERGY_SCALE.min}
            max={ENERGY_SCALE.max}
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="flex-1 accent-teal-600"
          />
          <span className="text-sm text-slate-400 w-4">{ENERGY_SCALE.max}</span>
          <span className="text-xl font-bold text-teal-700 w-8 text-center">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}
