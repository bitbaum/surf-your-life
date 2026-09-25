"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AI_DIGEST_MIN_CHECKINS } from "@/lib/constants";
import type { ClientDigestResult } from "@/lib/domain/digest";

/**
 * Practitioner-triggered weekly digest. Deliberately NOT generated on page load:
 * it spends the shared free AI pool, so it runs only when someone clicks.
 */
export function WeeklyDigest({ clientId }: { clientId: string }) {
  const t = useTranslations("admin.clients.weeklyDigest");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ClientDigestResult | null>(null);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/digest`, { method: "POST" });
      if (res.status === 429) throw new Error(t("rateLimited"));
      const json = await res.json();
      if (!json.success) throw new Error(t("error"));
      setResult(json.data);
      // The digest is stored on the latest check-in; refresh so it shows there too.
      if (json.data.status === "generated") router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-ink-muted">
          {t("description", { min: AI_DIGEST_MIN_CHECKINS })}
        </p>
        <Button variant="outline" onClick={handleGenerate} disabled={loading} className="min-h-11">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden />
          )}
          {loading ? t("generating") : t("generate")}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        {result?.status === "generated" && (
          <p className="text-sm text-ink-soft leading-relaxed bg-accent-subtle border border-accent-dim rounded-element p-3">
            {result.digest}
          </p>
        )}
        {result?.status === "not_enough_check_ins" && (
          <p className="text-sm text-ink-muted">
            {t("notEnough", { count: result.checkInCount, min: AI_DIGEST_MIN_CHECKINS })}
          </p>
        )}
        {result?.status === "unavailable" && (
          <p className="text-sm text-ink-muted">{t("unavailable")}</p>
        )}
      </CardContent>
    </Card>
  );
}
