import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { MarketingNav } from "@/components/marketing/nav"
import { auth } from "@/lib/auth"
import { FaqAccordion } from "./faq-accordion"
import { Waves, ArrowLeft } from "lucide-react"

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("faq")
  const session = await auth()
  const items = t.raw("items") as Array<{ q: string; a: string }>

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav isLoggedIn={!!session} />

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("backHome")}
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">{t("title")}</h1>
          <p className="text-slate-500 text-lg">{t("subtitle")}</p>
        </div>

        <FaqAccordion items={items} />
      </main>

      <footer className="py-10 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
              <Waves className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-slate-400">Surf Your Life · Zürich</span>
          </div>
          <Link href="/" className="text-xs text-slate-400 hover:text-teal-600 transition-colors">
            surf-your-life.ch
          </Link>
        </div>
      </footer>
    </div>
  )
}
