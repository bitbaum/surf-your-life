"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { AiConsentAction } from "@/lib/domain/ai-consent";

/** POST one decision for the signed-in user. Throws when it was not saved. */
export async function saveAiConsent(action: AiConsentAction) {
  const res = await fetch("/api/settings/ai-consent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) throw new Error("not saved");
}

/**
 * "Allow AI" and "Not now". Both are a complete answer: either one records the
 * decision and lets the person carry on — to `returnTo` when given, otherwise
 * to the page they had opened (the layout re-renders without the prompt).
 */
export function AiConsentActions({ returnTo }: { returnTo?: string }) {
  const t = useTranslations("portal.aiConsent");
  const router = useRouter();
  const [pending, setPending] = useState<AiConsentAction | null>(null);
  const [error, setError] = useState("");

  async function decide(action: AiConsentAction) {
    setPending(action);
    setError("");
    try {
      await saveAiConsent(action);
      if (returnTo) router.push(returnTo);
      else router.refresh();
    } catch {
      setError(t("saveError"));
      setPending(null);
    }
  }

  const busy = pending !== null;
  const label = (action: AiConsentAction, text: string) => (
    <>
      {pending === action && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
      {pending === action ? t("saving") : text}
    </>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          disabled={busy}
          onClick={() => decide("declined")}
        >
          {label("declined", t("decline"))}
        </Button>
        <Button
          className="min-h-11 w-full sm:w-auto"
          disabled={busy}
          onClick={() => decide("granted")}
        >
          {label("granted", t("allow"))}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
