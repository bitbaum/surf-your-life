"use client"

import { useState } from "react"
import Link from "next/link"
import { MarketingNav } from "@/components/marketing/nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle, Waves } from "lucide-react"

export default function ContactPage() {
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
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      setError("Something went wrong. Please try again.")
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
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
            <h1 className="text-2xl font-bold text-slate-900 mb-3">We&apos;ve got your message</h1>
            <p className="text-slate-500">
              You&apos;ll hear from us within 24 hours. In the meantime, feel free to
              create your account and complete your profile.
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <Link href="/register">
                <Button className="w-full">Create your account</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">Back to home</Button>
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
              <h1 className="text-3xl font-bold text-slate-900 mb-3">Get in touch</h1>
              <p className="text-slate-500 leading-relaxed">
                Tell us about your situation. We&apos;ll reach out within 24 hours to discuss
                whether this programme is a fit.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Your name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Dr. Jane Smith"
                required
              />
              <Input
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                placeholder="you@example.com"
                required
              />
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                  What brings you here? <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => set("message", e.target.value)}
                  rows={4}
                  placeholder="Brief overview of your situation — burnout, Long COVID, career transition..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button type="submit" disabled={loading} size="lg">
                {loading ? "Sending…" : "Send message"}
              </Button>
              <p className="text-xs text-slate-400 text-center">
                We respond within 24 hours. Your information stays private.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
