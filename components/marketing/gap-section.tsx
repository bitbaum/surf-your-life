import { useTranslations } from "next-intl";

export function GapSection() {
  const t = useTranslations("landing");
  const gapCards = t.raw("gap.cards") as Array<{ title: string; body: string }>;

  return (
    <section className="bg-surface-overlay py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="text-brand-on-overlay text-sm font-semibold tracking-widest uppercase mb-4">
            {t("gap.label")}
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-ink-on-overlay leading-tight">
            {t("gap.title")}
          </h2>
          <p className="mt-6 text-ink-on-overlay-dim text-lg leading-relaxed">{t("gap.body")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {gapCards.map(({ title, body }) => (
            <div key={title} className="border border-surface-overlay-border rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-surface-overlay-subtle flex items-center justify-center mb-5">
                <div className="w-2 h-2 rounded-full bg-brand-on-overlay" />
              </div>
              <h3 className="font-semibold text-ink-on-overlay mb-3">{title}</h3>
              <p className="text-sm text-ink-on-overlay-dim leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
