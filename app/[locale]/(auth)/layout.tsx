"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Waves } from "lucide-react"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("auth.panel")
  const bullets = t.raw("bullets") as string[]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left panel — branding (hidden on mobile) */}
      <div className="hidden lg:flex flex-col w-[420px] flex-shrink-0 bg-slate-950 p-12 justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
            <Waves className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">Surf Your Life</span>
        </Link>

        <div>
          <p className="text-3xl font-bold text-white leading-snug mb-4">
            &ldquo;{t("quote")}&rdquo;
          </p>
          <p className="text-slate-400 text-sm">{t("author")}</p>
        </div>

        <div className="flex flex-col gap-3">
          {bullets.map((bullet) => (
            <div key={bullet} className="flex items-center gap-2 text-sm text-slate-400">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
              {bullet}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center">
                <Waves className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-900">Surf Your Life</span>
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
