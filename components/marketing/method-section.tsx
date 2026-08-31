import { useTranslations } from "next-intl";
import { Activity, Brain, Users } from "lucide-react";

const pillarIcons = [Activity, Brain, Users];

export function MethodSection() {
  const t = useTranslations("landing");
  const pillars = t.raw("method.pillars") as Array<{ title: string; body: string }>;
  const steps = t.raw("process.steps") as Array<{ title: string; body: string }>;

  return (
    <>
      <section id="method" className="py-24 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-brand text-sm font-semibold tracking-widest uppercase mb-4">
              {t("method.label")}
            </p>
            <h2 className="text-4xl sm:text-5xl font-bold text-ink leading-tight">
              {t("method.title")}
            </h2>
            <p className="mt-6 text-ink-muted text-lg leading-relaxed">{t("method.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map(({ title, body }, i) => {
              const Icon = pillarIcons[i];
              const n = String(i + 1).padStart(2, "0");
              return (
                <div
                  key={n}
                  className="group relative rounded-xl border border-border bg-surface p-8 hover:border-brand-soft hover:shadow-md transition-all duration-200"
                >
                  <span className="absolute top-6 right-6 text-6xl font-bold text-surface-subtle select-none group-hover:text-brand-subtle transition-colors">
                    {n}
                  </span>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-brand-subtle flex items-center justify-center mb-6 group-hover:bg-brand-muted transition-colors">
                      <Icon className="w-5 h-5 text-brand" />
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-3">{title}</h3>
                    <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-brand">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-brand-soft text-8xl font-serif leading-none mb-4 select-none">
            &ldquo;
          </div>
          <blockquote className="text-xl sm:text-2xl font-medium text-ink-on-overlay leading-relaxed -mt-6">
            {t("quote.text")}
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-ring flex items-center justify-center">
              <span className="text-ink-on-overlay font-bold text-sm">M</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-ink-on-overlay">{t("quote.author")}</p>
              <p className="text-xs text-brand-dim">{t("quote.role")}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="process" className="py-24 px-6 bg-surface-subtle">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-brand text-sm font-semibold tracking-widest uppercase mb-4">
              {t("process.label")}
            </p>
            <h2 className="text-4xl font-bold text-ink">{t("process.title")}</h2>
            <p className="mt-3 text-ink-muted max-w-lg mx-auto">{t("process.subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ title, body }, i) => {
              const n = String(i + 1).padStart(2, "0");
              return (
                <div key={n} className="bg-surface rounded-xl border border-border p-8 shadow-sm">
                  <div
                    className="text-5xl font-bold text-brand-subtle mb-4 leading-none select-none"
                    style={{
                      textShadow: "0 0 0 var(--color-brand)",
                      WebkitTextStroke: "1.5px var(--color-brand)",
                    }}
                  >
                    {n}
                  </div>
                  <h3 className="font-semibold text-ink mb-3 text-lg">{title}</h3>
                  <p className="text-sm text-ink-muted leading-relaxed">{body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
