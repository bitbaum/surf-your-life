import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle, MapPin } from "lucide-react"

interface HeroSectionProps {
  isLoggedIn: boolean
}

export function HeroSection({ isLoggedIn }: HeroSectionProps) {
  const t = useTranslations("landing")
  const trustItems = t.raw("trust") as string[]
  const proofItems = t.raw("proof") as string[]

  return (
    <>
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-10 tracking-widest uppercase">
              <MapPin className="w-3 h-3" />
              {t("badge")}
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.05] tracking-tight">
              {t("hero.line1")}<br />
              {t("hero.line2")}<br />
              <span className="text-teal-600">{t("hero.line3")}</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-500 max-w-xl leading-relaxed">
              {t("hero.subtitle")}
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              {isLoggedIn ? (
                <Link href="/dashboard">
                  <Button size="lg" className="w-full sm:w-auto text-base px-8">
                    {t("cta.goToDashboard")}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8">
                      {t("hero.cta")}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href="#method">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                      {t("hero.ctaSecondary")}
                    </Button>
                  </a>
                </>
              )}
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {trustItems.map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="border-y border-slate-100 bg-slate-50 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {proofItems.map((item) => (
            <span key={item} className="text-sm text-slate-500 font-medium">{item}</span>
          ))}
        </div>
      </div>
    </>
  )
}
