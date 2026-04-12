import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { MarketingNav } from "@/components/marketing/nav"
import { auth } from "@/lib/auth"
import { Waves, ArrowLeft, ArrowRight } from "lucide-react"

type Post = { slug: string; title: string; date: string; category: string; excerpt: string; body: string }

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("blog")
  const session = await auth()
  const posts = t.raw("posts") as Post[]

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav isLoggedIn={!!session} />

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-24">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("backHome")}
        </Link>

        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">{t("title")}</h1>
          <p className="text-slate-500 text-lg">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="group border border-slate-200 rounded-2xl p-8 hover:border-teal-200 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
                  {post.category}
                </span>
                <time className="text-xs text-slate-400">
                  {new Date(post.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-teal-700 transition-colors">
                {post.title}
              </h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors"
              >
                {t("readMore")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </article>
          ))}
        </div>
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
