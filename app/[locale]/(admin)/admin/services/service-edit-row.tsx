"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { SERVICE_CATEGORIES } from "@/lib/domain/services"
import { SERVICE_DURATION_MINUTES } from "@/lib/constants"
import type { InferSelectModel } from "drizzle-orm"
import type { services } from "@/lib/db/schema"

type Service = InferSelectModel<typeof services>

export type ServiceFormState = {
  name: string
  description: string
  category: Service["category"]
  durationMinutes: string
}

interface ServiceEditRowProps {
  form: ServiceFormState
  saving: boolean
  onChange: (f: ServiceFormState) => void
  onSave: () => void
  onCancel: () => void
}

export function ServiceEditRow({ form, saving, onChange, onSave, onCancel }: ServiceEditRowProps) {
  const t = useTranslations("admin.services")

  return (
    <tr className="border-b border-slate-50 bg-slate-50">
      <td className="py-3 pr-3" colSpan={5}>
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldName")}</label>
              <input
                value={form.name}
                onChange={(e) => onChange({ ...form, name: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDuration")}</label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) => onChange({ ...form, durationMinutes: e.target.value })}
                min={SERVICE_DURATION_MINUTES.min}
                max={SERVICE_DURATION_MINUTES.max}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldCategory")}</label>
              <Select
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value as Service["category"] })}
              >
                {SERVICE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{t(`categoryLabels.${c}`)}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 block mb-1">{t("fieldDescription")}</label>
              <input
                value={form.description}
                onChange={(e) => onChange({ ...form, description: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              {t("cancel")}
            </button>
            <Button size="sm" onClick={onSave} disabled={saving || !form.name.trim()}>
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </div>
      </td>
    </tr>
  )
}
