import { useTranslations } from "next-intl"

export function GapSection() {
  const t = useTranslations("landing")
  const gapCards = t.raw("gap.cards") as Array<{ title: string; body: string }>

  return (
    <section className="bg-slate-950 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="max-w-2xl mb-16">
          <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">{t("gap.label")}</p>
          <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
            {t("gap.title")}
          </h2>
          <p className="mt-6 text-slate-400 text-lg leading-relaxed">
            {t("gap.body")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {gapCards.map(({ title, body }) => (
            <div key={title} className="border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center mb-5">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
              </div>
              <h3 className="font-semibold text-white mb-3">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
