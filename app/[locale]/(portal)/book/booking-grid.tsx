"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Cpu, Building2, Stethoscope } from "lucide-react";
import type { Service } from "@/lib/db/schema";
import { localDateString } from "@/lib/utils";
import { BookingModal, type BookingForm } from "./booking-modal";

const CATEGORY_ICONS = {
  machine: Cpu,
  space: Building2,
  consultation: Stethoscope,
};

const CATEGORY_COLORS = {
  machine: "bg-violet-50 text-violet-700",
  space: "bg-teal-50 text-teal-700",
  consultation: "bg-amber-50 text-amber-700",
};

export function BookingGrid({ services }: { services: Service[] }) {
  const t = useTranslations("portal.book");
  const [selected, setSelected] = useState<Service | null>(null);
  const [form, setForm] = useState<BookingForm>({
    preferredDate: "",
    preferredTime: "flexible",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal(service: Service) {
    setForm({ preferredDate: localDateString(new Date()), preferredTime: "flexible", notes: "" });
    setSubmitted(false);
    setError(null);
    setSelected(service);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: selected.id, ...form }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(t("bookingError"));
      }
    } catch {
      setError(t("bookingError"));
    } finally {
      setLoading(false);
    }
  }

  if (services.length === 0) {
    return <p className="text-sm text-slate-400 py-6 text-center">{t("noServices")}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((s) => {
          const Icon = CATEGORY_ICONS[s.category] ?? Cpu;
          const badgeClass = CATEGORY_COLORS[s.category] ?? CATEGORY_COLORS.machine;
          const categoryKey =
            `category${s.category.charAt(0).toUpperCase() + s.category.slice(1)}` as Parameters<
              ReturnType<typeof useTranslations>
            >[0];
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
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                      {s.description}
                    </p>
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
          );
        })}
      </div>

      {selected && (
        <BookingModal
          selected={selected}
          form={form}
          setForm={setForm}
          loading={loading}
          submitted={submitted}
          error={error}
          onClose={() => setSelected(null)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
