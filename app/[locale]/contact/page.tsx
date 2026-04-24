"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { MarketingNav } from "@/components/marketing/nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, Waves } from "lucide-react"

export default function ContactPage() {
  const t = useTranslations("contact")
  const [form, setForm] = useState({ name: "", email: "", message: "" })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  function set(k: keyof typeof form, v: string) {
    setForm((p) => ({ ...p, [k]: v }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        setError(t("error"))
        return
      }
      setSent(true)
    } catch {
      setError(t("error"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      <div className="max-w-xl mx-auto px-6 pt-32 pb-24">
        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-7 h-7 text-teal-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">{t("successTitle")}</h1>
            <p className="text-slate-500">{t("successBody")}</p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/register">
                <Button className="w-full">{t("createAccount")}</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">{t("backHome")}</Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
                  <Waves className="w-4 h-4 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-3">{t("title")}</h1>
              <p className="text-slate-500 leading-relaxed">{t("subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label={t("name")}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder={t("namePlaceholder")}
                required
              />
              <Input
                label={t("email")}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  {t("message")} <span className="text-slate-400 font-normal">{t("messageOptional")}</span>
                </label>
                <Textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={4}
                  placeholder={t("messagePlaceholder")}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} size="lg">
                {loading ? t("loading") : t("submit")}
              </Button>
              <p className="text-xs text-slate-400 text-center">{t("privacy")}</p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
