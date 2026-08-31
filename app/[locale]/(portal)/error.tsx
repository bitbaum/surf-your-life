"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function PortalError({ error, reset }: { error: Error; reset: () => void }) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full min-h-[60vh] px-6">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{t("error")}</h2>
        <p className="text-slate-500 mb-6">{t("errorDescription")}</p>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>{t("tryAgain")}</Button>
          <Link href="/dashboard">
            <Button variant="outline">{t("goToDashboard")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
