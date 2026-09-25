"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { SessionPrepView } from "@/lib/domain/session-prep";
import { SessionPrepStats } from "./session-prep-stats";

/**
 * Practitioner-triggered session prep. Deliberately NOT generated on page load:
 * it spends the shared free AI pool, so it runs only when someone clicks. The
 * page passes in the latest stored prep, which is shown instead of regenerating.
 */
export function SessionPrep({
  clientId,
  initialPrep,
}: {
  clientId: string;
  initialPrep: SessionPrepView | null;
}) {
  const t = useTranslations("admin.clients.sessionPrep");
  const [loading, setLoading] = useState(false);
  const [prep, setPrep] = useState<SessionPrepView | null>(initialPrep);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/session-prep`, { method: "POST" });
      if (res.status === 429) throw new Error(t("rateLimited"));
      const json = await res.json();
      if (!json.success) throw new Error(t("error"));
      setPrep(json.data);
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
          <Sparkles className="w-4 h-4 text-brand" aria-hidden />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!prep && <p className="text-sm text-ink-muted">{t("description")}</p>}
        {prep && (
          <div>
            <SessionPrepStats stats={prep.stats} />
            <p className="text-sm text-ink-soft leading-relaxed">{prep.summary}</p>
            <p className="text-xs text-ink-faint mt-2">
              {t("preparedOn", { date: formatDate(prep.createdAt) })}
              {!prep.aiGenerated && ` · ${t("ruleBasedNote")}`}
            </p>
          </div>
        )}
        <Button variant="outline" onClick={handleGenerate} disabled={loading} className="min-h-11">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="w-4 h-4" aria-hidden />
          )}
          {loading ? t("generating") : prep ? t("regenerate") : t("generate")}
        </Button>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
