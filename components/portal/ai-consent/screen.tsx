import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ChevronDown, Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiConsentActions } from "./actions";

const LINK = "text-brand underline underline-offset-2 hover:text-brand-hover";

/**
 * The one-time consent question. The plain-words summary (what, to whom and
 * where, why) is this screen's own text; "Exactly what each provider receives"
 * renders the privacy policy's section 6 sentences themselves, so the two can
 * never say different things.
 */
export async function AiConsentScreen({ returnTo }: { returnTo?: string }) {
  const t = await getTranslations("portal.aiConsent");
  const p = await getTranslations("privacy.ai");

  const tags = {
    b: (chunks: ReactNode) => <strong className="text-ink">{chunks}</strong>,
    settings: (chunks: ReactNode) => (
      <Link href="/settings" className={LINK}>
        {chunks}
      </Link>
    ),
    privacy: (chunks: ReactNode) => (
      <Link href="/privacy#ai-consent" className={LINK}>
        {chunks}
      </Link>
    ),
    contact: (chunks: ReactNode) => (
      <Link href="/contact" className={LINK}>
        {chunks}
      </Link>
    ),
  };
  const policy = (key: string) => p.rich(key, tags);

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-brand shrink-0" aria-hidden />
            {t("title")}
          </CardTitle>
          <p className="text-sm text-ink-muted mb-0">{t("intro")}</p>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 text-sm text-ink-soft leading-relaxed">
          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            <li>{t.rich("what", tags)}</li>
            <li>{t.rich("who", tags)}</li>
            <li>{t.rich("why", tags)}</li>
          </ul>

          <details className="group rounded-element border border-border bg-surface-subtle">
            <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden min-h-11 flex items-center justify-between gap-2 px-4 py-2 font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring rounded-element">
              {t("details")}
              <ChevronDown
                className="w-4 h-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4 text-ink-muted">
              <p className="font-semibold text-ink mb-0">{p("groq.name")}</p>
              <p className="mb-0">{policy("groq.role")}</p>
              <p className="mb-0">{policy("groq.data")}</p>
              <ul className="list-disc pl-5 flex flex-col gap-2 m-0">
                <li>{policy("groq.chat")}</li>
                <li>{policy("groq.form")}</li>
                <li>{policy("groq.summaries")}</li>
              </ul>
              <p className="mb-0">{p("groq.notSent")}</p>
              <p className="mb-0">{policy("groq.purpose")}</p>
              {(["openrouter", "openai"] as const).map((id) => (
                <div key={id} className="flex flex-col gap-3">
                  <p className="font-semibold text-ink mb-0">{p(`${id}.name`)}</p>
                  <p className="mb-0">{policy(`${id}.role`)}</p>
                  <p className="mb-0">{policy(`${id}.data`)}</p>
                  <p className="mb-0">{policy(`${id}.purpose`)}</p>
                </div>
              ))}
              <p className="mb-0">{policy("basis")}</p>
            </div>
          </details>

          <div>
            <p className="font-semibold text-ink mb-1">{t("notNowHeading")}</p>
            <p className="mb-0">{t("notNowBody")}</p>
          </div>

          <p className="text-ink-muted mb-0">{t.rich("change", tags)}</p>

          <AiConsentActions returnTo={returnTo} />
        </CardContent>
      </Card>
    </div>
  );
}
