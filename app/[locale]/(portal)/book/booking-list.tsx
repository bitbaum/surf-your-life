"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import type { Booking, Service } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BOOKING_STATUS_BADGE_VARIANT } from "@/lib/constants";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "@/i18n/navigation";

type BookingWithService = Booking & { service: Service };

function CancelButton({ bookingId }: { bookingId: string }) {
  const t = useTranslations("portal.book");
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setCancelling(true);
    setError(null);
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed");
      router.refresh();
    } catch {
      setError(t("cancelError"));
      setCancelling(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleCancel}
        disabled={cancelling}
        className="text-xs text-slate-400 hover:text-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {cancelling ? t("cancelling") : t("cancelBooking")}
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function BookingList({ bookings }: { bookings: BookingWithService[] }) {
  const t = useTranslations("portal.book");

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("yourBookings")}</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length === 0 ? (
          <div className="py-6">
            <EmptyState
              message={t("noBookings")}
              action={
                <Link
                  href="/messages/new"
                  className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
                >
                  {t("messagePractitioner")}
                </Link>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{b.service.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {b.preferredDate}
                    {b.preferredTime ? ` · ${b.preferredTime}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={BOOKING_STATUS_BADGE_VARIANT[b.status] ?? "slate"}
                    label={t(
                      `status${b.status.charAt(0).toUpperCase() + b.status.slice(1)}` as Parameters<
                        typeof t
                      >[0],
                    )}
                  />
                  {b.status !== "cancelled" && <CancelButton bookingId={b.id} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
