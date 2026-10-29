"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { saveAiConsent } from "./actions";

/** Withdraws AI consent. Recorded and in force as soon as the request returns. */
export function WithdrawAiConsentButton() {
  const t = useTranslations("portal.aiConsent");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function withdraw() {
    setLoading(true);
    try {
      await saveAiConsent("withdrawn");
      toast.success(t("withdrawn"));
      router.refresh();
    } catch {
      toast.error(t("saveError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="outline"
      className="min-h-11 w-full sm:w-auto"
      onClick={withdraw}
      disabled={loading}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {loading ? t("saving") : t("withdraw")}
    </Button>
  );
}
