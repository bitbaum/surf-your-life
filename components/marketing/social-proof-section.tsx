import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Waves } from "lucide-react"
import { NewsletterForm } from "@/components/marketing/newsletter-form"

interface SocialProofSectionProps {
  isLoggedIn: boolean
}

export function SocialProofSection({ isLoggedIn }: SocialProofSectionProps) {
  const t = useTranslations("landing")
  const conditions = t.raw("who.conditions") as string[]
  const testimonials = t.raw("who.testimonials") as Array<{ text: string; author: string }>

  return (
    <>
      <section id="who" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">{t("who.label")}</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                {t("who.title")}
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                {t("who.body")}
              </p>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-700 font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">
                {t("who.testimonialsLabel")}
              </p>
              <div className="flex flex-col gap-6">
                {testimonials.map(({ text, author }) => (
                  <div key={author} className="border-l-2 border-teal-400 pl-4">
                    <p className="text-slate-700 text-sm leading-relaxed italic">
                      &ldquo;{text}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 mt-2">{author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">{t("newsletter.label")}</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">{t("newsletter.title")}</h2>
          <p className="text-slate-500 mb-8">{t("newsletter.body")}</p>
          <NewsletterForm />
        </div>
      </section>

      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-8">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            {t("cta.title1")}<br />{t("cta.title2")}
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            {t("cta.body")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="lg" className="w-full sm:w-auto text-base px-10 bg-teal-500 hover:bg-teal-400 text-white border-0">
                  {t("cta.goToDashboard")}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto text-base px-10 bg-teal-500 hover:bg-teal-400 text-white border-0">
                    {t("cta.button")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
                  {t("cta.signIn")}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
