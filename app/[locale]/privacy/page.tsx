import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MarketingNav } from "@/components/marketing/nav";
import { MarketingFooter } from "@/components/marketing/footer";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

// Rich-text tags the policy messages may use.
const tags = {
  b: (chunks: ReactNode) => <strong>{chunks}</strong>,
  contact: (chunks: ReactNode) => (
    <Link href="/contact" className="text-teal-600 hover:underline">
      {chunks}
    </Link>
  ),
};

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-slate-900 mb-3">{heading}</h2>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

const PROSE = "text-slate-600 text-sm leading-relaxed";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  const session = await auth();
  const rich = (key: string) => t.rich(key, tags);
  const list = (prefix: string, keys: string[]) => keys.map((k) => rich(`${prefix}.${k}`));

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNav isLoggedIn={!!session} />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t("title")}</h1>
          <p className="text-slate-500 mb-10">{t("updated")}</p>

          <Section heading={t("controller.heading")}>
            <p className={PROSE}>{t("controller.intro")}</p>
            <address className="not-italic text-slate-700 text-sm mt-3 pl-4 border-l-2 border-teal-200">
              <strong>Surf Your Life</strong>
              <br />
              {t("controller.director")}
              <br />
              Zollikerstrasse 183
              <br />
              8008 Zürich, {t("controller.country")}
            </address>
          </Section>

          <Section heading={t("collected.heading")}>
            <p className={`${PROSE} mb-3`}>{t("collected.intro")}</p>
            <Bullets
              items={list("collected.items", ["account", "health", "contact", "technical"])}
            />
          </Section>

          <Section heading={t("purpose.heading")}>
            <Bullets
              items={list("purpose.items", [
                "portal",
                "practitioners",
                "communication",
                "analytics",
                "legal",
              ])}
            />
            <p className={`${PROSE} mt-3`}>{t("purpose.basis")}</p>
            <p id="ai-consent" className={`${PROSE} mt-3`}>
              {rich("purpose.aiConsent")}
            </p>
          </Section>

          <Section heading={t("retention.heading")}>
            <p className={PROSE}>{t("retention.body")}</p>
          </Section>

          <Section heading={t("processors.heading")}>
            <p className={`${PROSE} mb-3`}>{t("processors.intro")}</p>
            <Bullets items={list("processors", ["hetzner", "orangecat", "resend"])} />
          </Section>

          <Section heading={t("ai.heading")}>
            <p className={`${PROSE} mb-4`}>{t("ai.intro")}</p>

            <h3 className="font-semibold text-slate-900 mb-2">{t("ai.groq.name")}</h3>
            <div className={`${PROSE} space-y-2 mb-6`}>
              <p>{rich("ai.groq.role")}</p>
              <p>{rich("ai.groq.data")}</p>
              <Bullets items={list("ai.groq", ["chat", "form", "summaries"])} />
              <p>{t("ai.groq.notSent")}</p>
              <p>{rich("ai.groq.purpose")}</p>
              <p>{rich("ai.basis")}</p>
            </div>

            {(["openrouter", "openai"] as const).map((id) => (
              <div key={id} className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-2">{t(`ai.${id}.name`)}</h3>
                <div className={`${PROSE} space-y-2`}>
                  <p>{rich(`ai.${id}.role`)}</p>
                  <p>{rich(`ai.${id}.data`)}</p>
                  <p>{rich(`ai.${id}.purpose`)}</p>
                  <p>{rich("ai.basis")}</p>
                </div>
              </div>
            ))}

            <p className={`${PROSE} mb-3`}>{rich("ai.choice")}</p>
            <p className={PROSE}>{t("ai.noSale")}</p>
          </Section>

          <Section heading={t("rights.heading")}>
            <p className={`${PROSE} mb-3`}>{t("rights.intro")}</p>
            <Bullets
              items={list("rights.items", [
                "access",
                "rectification",
                "erasure",
                "portability",
                "restriction",
                "withdraw",
                "complaint",
              ])}
            />
            <p className={`${PROSE} mt-4`}>{rich("rights.exercise")}</p>
          </Section>

          <Section heading={t("cookies.heading")}>
            <p className={PROSE}>{t("cookies.body")}</p>
          </Section>

          <Section heading={t("compliance.heading")}>
            <p className={PROSE}>{rich("compliance.body")}</p>
          </Section>

          <Section heading={t("changes.heading")}>
            <p className={PROSE}>{t("changes.body")}</p>
          </Section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}
