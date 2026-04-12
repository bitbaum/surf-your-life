import { setRequestLocale } from "next-intl/server"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { MarketingNav } from "@/components/marketing/nav"
import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import { Waves, ArrowLeft } from "lucide-react"

type Post = { slug: string; title: string; date: string; category: string; excerpt: string; body: string }

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const t = await getTranslations("blog")
  const session = await auth()
  const posts = t.raw("posts") as Post[]
  const post = posts.find((p) => p.slug === slug)

  if (!post) notFound()

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav isLoggedIn={!!session} />

      <main className="max-w-2xl mx-auto px-6 pt-28 pb-24">
        <Link href="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-teal-600 transition-colors mb-10">
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("title")}
        </Link>

        <article>
          <div className="flex items-center gap-3 mb-6">
            <span className="px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 text-xs font-semibold">
              {post.category}
            </span>
            <time className="text-xs text-slate-400">
              {new Date(post.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
            </time>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight mb-6">
            {post.title}
          </h1>

          <p className="text-lg text-slate-500 leading-relaxed mb-8 border-l-4 border-teal-400 pl-4 italic">
            {post.excerpt}
          </p>

          <div className="prose prose-slate prose-sm max-w-none">
            {post.body.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-slate-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </article>

        <div className="mt-16 pt-8 border-t border-slate-100">
          <div className="bg-teal-50 rounded-2xl p-6 text-center">
            <p className="font-semibold text-slate-900 mb-2">Ready to start your recovery?</p>
            <p className="text-sm text-slate-500 mb-4">Join the programme and take the first step.</p>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors"
            >
              Create your account
            </Link>
          </div>
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
