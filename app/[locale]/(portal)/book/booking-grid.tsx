"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, X, Clock, Cpu, Building2, Stethoscope } from "lucide-react"
import type { Service } from "@/lib/db/schema"

const CATEGORY_ICONS = {
  machine: Cpu,
  space: Building2,
  consultation: Stethoscope,
}

const CATEGORY_COLORS = {
  machine: "bg-violet-50 text-violet-700",
  space: "bg-teal-50 text-teal-700",
  consultation: "bg-amber-50 text-amber-700",
}

type BookingForm = {
  preferredDate: string
  preferredTime: "morning" | "afternoon" | "flexible"
  notes: string
}

export function BookingGrid({ services }: { services: Service[] }) {
  const t = useTranslations("portal.book")
  const [selected, setSelected] = useState<Service | null>(null)
  const [form, setForm] = useState<BookingForm>({ preferredDate: "", preferredTime: "flexible", notes: "" })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function openModal(service: Service) {
    const today = new Date().toISOString().split("T")[0]
    setForm({ preferredDate: today, preferredTime: "flexible", notes: "" })
    setSubmitted(false)
    setSelected(service)
  }

  function closeModal() {
    setSelected(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return
    setLoading(true)
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: selected.id, ...form }),
    })
    setLoading(false)
    if (res.ok) setSubmitted(true)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((s) => {
          const Icon = CATEGORY_ICONS[s.category] ?? Cpu
          const badgeClass = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.machine
          const categoryKey = `category${s.category.charAt(0).toUpperCase() + s.category.slice(1)}` as Parameters<ReturnType<typeof useTranslations>>[0]
          return (
            <Card
              key={s.id}
              className="group hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => openModal(s)}
            >
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-teal-600" />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeClass}`}>
                    {t(categoryKey)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1">{s.name}</h3>
                  {s.description && (
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{s.description}</p>
                  )}
                </div>
                <div className="flex items-center justify-between mt-auto pt-2">
                  {s.durationMinutes && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      {s.durationMinutes} min
                    </span>
                  )}
                  <span className="text-xs font-medium text-teal-600 group-hover:text-teal-700 ml-auto">
                    {t("selectService")} →
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 flex flex-col gap-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selected.name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{t("subtitle")}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {submitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <CheckCircle className="w-10 h-10 text-teal-500" />
                <p className="font-semibold text-slate-900">{t("successTitle")}</p>
                <p className="text-sm text-slate-500">{t("successBody")}</p>
                <Button variant="outline" onClick={closeModal} className="mt-2">{t("cancel")}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("preferredDate")}</label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={form.preferredDate}
                    onChange={(e) => setForm((f) => ({ ...f, preferredDate: e.target.value }))}
                    className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1.5">{t("preferredTime")}</label>
                  <div className="flex gap-2">
                    {(["morning", "afternoon", "flexible"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm((f) => ({ ...f, preferredTime: opt }))}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium border-2 transition-all ${
                          form.preferredTime === opt
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
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
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1">{t("cancel")}</Button>
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? t("submitting") : t("submitBooking")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
