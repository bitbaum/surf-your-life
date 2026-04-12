import { useTranslations } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing/nav"
import { NewsletterForm } from "@/components/marketing/newsletter-form"
import { auth } from "@/lib/auth"
import {
  ArrowRight,
  Brain,
  Activity,
  Users,
  CheckCircle,
  MapPin,
  Waves,
} from "lucide-react"

const pillarIcons = [Activity, Brain, Users]

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()

  return <HomeContent isLoggedIn={!!session} />
}

function HomeContent({ isLoggedIn }: { isLoggedIn: boolean }) {
  const t = useTranslations("landing")

  const gapCards = t.raw("gap.cards") as Array<{ title: string; body: string }>
  const pillars = t.raw("method.pillars") as Array<{ title: string; body: string }>
  const steps = t.raw("process.steps") as Array<{ title: string; body: string }>
  const conditions = t.raw("who.conditions") as string[]
  const testimonials = t.raw("who.testimonials") as Array<{ text: string; author: string }>
  const trustItems = t.raw("trust") as string[]
  const proofItems = t.raw("proof") as string[]

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav isLoggedIn={isLoggedIn} />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
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

      {/* ── Proof bar ────────────────────────────────────────────────── */}
      <div className="border-y border-slate-100 bg-slate-50 py-5 px-6">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          {proofItems.map((item) => (
            <span key={item} className="text-sm text-slate-500 font-medium">{item}</span>
          ))}
        </div>
      </div>

      {/* ── The problem ──────────────────────────────────────────────── */}
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
              <div key={title} className="border border-slate-800 rounded-2xl p-6">
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

      {/* ── Method ───────────────────────────────────────────────────── */}
      <section id="method" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">{t("method.label")}</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              {t("method.title")}
            </h2>
            <p className="mt-6 text-slate-500 text-lg leading-relaxed">
              {t("method.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map(({ title, body }, i) => {
              const Icon = pillarIcons[i]
              const n = String(i + 1).padStart(2, "0")
              return (
                <div
                  key={n}
                  className="group relative rounded-2xl border border-slate-200 bg-white p-8 hover:border-teal-300 hover:shadow-md transition-all duration-200"
                >
                  <span className="absolute top-6 right-6 text-6xl font-bold text-slate-50 select-none group-hover:text-teal-50 transition-colors">
                    {n}
                  </span>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center mb-6 group-hover:bg-teal-100 transition-colors">
                      <Icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Quote ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-teal-600">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-teal-300 text-8xl font-serif leading-none mb-4 select-none">&ldquo;</div>
          <blockquote className="text-xl sm:text-2xl font-medium text-white leading-relaxed -mt-6">
            {t("quote.text")}
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{t("quote.author")}</p>
              <p className="text-xs text-teal-200">{t("quote.role")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who ──────────────────────────────────────────────────────── */}
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

      {/* ── Process ──────────────────────────────────────────────────── */}
      <section id="process" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">{t("process.label")}</p>
            <h2 className="text-4xl font-bold text-slate-900">{t("process.title")}</h2>
            <p className="mt-3 text-slate-500 max-w-lg mx-auto">
              {t("process.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ title, body }, i) => {
              const n = String(i + 1).padStart(2, "0")
              return (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                  <div className="text-5xl font-bold text-teal-50 mb-4 leading-none select-none"
                    style={{ textShadow: "0 0 0 #0d9488", WebkitTextStroke: "1.5px #0d9488" }}
                  >
                    {n}
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-3 text-lg">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-white border-y border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">{t("newsletter.label")}</p>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">{t("newsletter.title")}</h2>
          <p className="text-slate-500 mb-8">{t("newsletter.body")}</p>
          <NewsletterForm />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
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

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="py-10 px-6 border-t border-slate-800 bg-slate-950">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
              <Waves className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-slate-400">{t("footer.address")}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#method" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.method")}</a>
            <a href="#who" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.forWhom")}</a>
            <Link href="/faq" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.faq")}</Link>
            <Link href="/blog" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.blog")}</Link>
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.signIn")}</Link>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">{t("footer.register")}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
