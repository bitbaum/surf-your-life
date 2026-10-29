import { getFormatter, getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AiConsentState } from "@/lib/domain/ai-consent";
import { WithdrawAiConsentButton } from "./withdraw-button";

/** Settings → AI features: the current decision, and the way to change it. */
export async function AiConsentSettingsCard({
  state,
  decidedAt,
}: {
  state: AiConsentState;
  decidedAt: Date | null;
}) {
  const t = await getTranslations("portal.aiConsent");
  const format = await getFormatter();
  const granted = state === "granted" && decidedAt;

  return (
    <Card id="ai">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand shrink-0" aria-hidden />
          {t("settingsTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {granted ? (
          <>
            <p className="text-sm text-ink-soft mb-0">
              {t("statusGranted", { date: format.dateTime(decidedAt, { dateStyle: "long" }) })}
            </p>
            <p className="text-xs text-ink-muted mb-0">{t("withdrawHint")}</p>
            <WithdrawAiConsentButton />
          </>
        ) : (
          <>
            <p className="text-sm text-ink-soft mb-0">{t("statusOff")}</p>
            <Link
              href="/ai-consent?from=/settings"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-h-11 w-full sm:w-auto sm:self-start",
              )}
            >
              {t("review")}
            </Link>
          </>
        )}
      </CardContent>
    </Card>
  );
}
