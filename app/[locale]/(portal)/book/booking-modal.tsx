"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { CheckCircle, X } from "lucide-react"
import type { Service } from "@/lib/db/schema"
import { toDateString } from "@/lib/utils"
import { BOOKING_TIME_PREFERENCE_VALUES, type BookingTimePreference, CHIP_SELECTED, CHIP_UNSELECTED } from "@/lib/constants"

export type BookingForm = {
  preferredDate: string
  preferredTime: BookingTimePreference
  notes: string
}

type Props = {
  selected: Service
  form: BookingForm
  setForm: (updater: (f: BookingForm) => BookingForm) => void
  loading: boolean
  submitted: boolean
  error: string | null
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}

export function BookingModal({ selected, form, setForm, loading, submitted, error, onClose, onSubmit }: Props) {
  const t = useTranslations("portal.book")

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
            <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle className="w-10 h-10 text-teal-500" />
            <p className="font-semibold text-slate-900">{t("successTitle")}</p>
            <p className="text-sm text-slate-500">{t("successBody")}</p>
            <Button variant="outline" onClick={onClose} className="mt-2">{t("cancel")}</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("preferredDate")}</label>
              <input
                type="date"
                required
                min={toDateString(new Date())}
                value={form.preferredDate}
                onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("preferredTime")}</label>
              <div className="flex gap-2">
                {BOOKING_TIME_PREFERENCE_VALUES.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, preferredTime: opt }))}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                      form.preferredTime === opt
                        ? CHIP_SELECTED
                        : CHIP_UNSELECTED
                    }`}
                  >
                    {t(opt as Parameters<typeof t>[0])}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                {t("notes")} <span className="text-slate-400 font-normal">{t("notesOptional")}</span>
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                placeholder={t("notesPlaceholder")}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">{t("cancel")}</Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? t("submitting") : t("submitBooking")}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </form>
        )}
      </div>
    </div>
  )
}
