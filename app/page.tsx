import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Waves, ArrowRight, Brain, Activity, Users, CheckCircle } from "lucide-react"

const pillars = [
  {
    icon: Activity,
    title: "Biological reset",
    description: "We start with your body — sleep, nervous system regulation, and physical recovery. No psychological work lands without this foundation.",
  },
  {
    icon: Brain,
    title: "Psychiatric guidance",
    description: "Medically anchored from day one. Our psychiatrist works with you to understand what happened and build a clear path forward.",
  },
  {
    icon: Users,
    title: "Reintegration",
    description: "Returning to work or reinventing what comes next — we navigate that gap with you, step by step.",
  },
]

const conditions = ["Burnout", "Long COVID", "Midlife reinvention", "Work reintegration", "Chronic stress", "Energy & performance"]

const steps = [
  { n: "01", title: "Assessment", body: "A deep intake session to understand your situation, history, and goals — medically and personally." },
  { n: "02", title: "Your programme", body: "A structured plan combining body-first protocols, regular check-ins, and psychiatric support." },
  { n: "03", title: "Track & adjust", body: "You log your daily state in the portal. We see the data. Your programme evolves with you." },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center">
              <Waves className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-slate-900">Surf Your Life</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block">How it works</a>
            <a href="#for-whom" className="text-sm text-slate-600 hover:text-slate-900 hidden sm:block">For whom</a>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Zurich · Medical Performance Space
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight tracking-tight">
            Get back to yourself.<br />
            <span className="text-teal-600">On your terms.</span>
          </h1>
          <p className="mt-6 text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
            A medically anchored programme for burnout, Long COVID, and midlife reinvention.
            We fix the biology first. Then the rest follows.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Start your programme
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Social proof bar */}
      <div className="border-y border-slate-100 bg-slate-50 py-5 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {["Psychiatry-led", "Zollikerstrasse 183, Zürich", "230 m² performance space", "Body-first methodology"].map((item) => (
            <span key={item} className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Three pillars */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Hardware before software</h2>
            <p className="mt-3 text-slate-500 max-w-lg mx-auto">
              Most programmes start with mindset. We start with your body.
              A dysregulated nervous system can&apos;t be coached out of trouble.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex flex-col gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-teal-600" />
                </div>
                <h3 className="font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For whom */}
      <section id="for-whom" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Who comes to us</h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Our clients are high-functioning people who hit a wall. Executives, doctors, founders,
                creatives. People who did everything right and still burned out — or never fully recovered.
              </p>
              <div className="flex flex-wrap gap-2">
                {conditions.map((c) => (
                  <span key={c} className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
              <blockquote className="text-slate-700 leading-relaxed italic">
                &ldquo;The gap between clinic discharge and returning to work is where most people fall through.
                We exist specifically to bridge that gap — with medicine, structure, and accountability.&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <span className="text-teal-700 font-semibold text-sm">M</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Dr. Manu</p>
                  <p className="text-xs text-slate-400">Psychiatrist & Founder, Vitareba</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
            <p className="mt-3 text-slate-500">Clear structure. No guesswork.</p>
          </div>
          <div className="flex flex-col gap-10">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="flex gap-6">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{n}</span>
                </div>
                <div className="pt-2">
                  <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-teal-600">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white">Ready to start?</h2>
          <p className="mt-4 text-teal-100 text-lg">
            Create your account, complete your intake, and we&apos;ll be in touch within 24 hours.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Create your account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="text-sm text-teal-100 hover:text-white">
              Already have an account →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 border-t border-slate-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-teal-600 flex items-center justify-center">
              <Waves className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm text-slate-500">Surf Your Life · Zollikerstrasse 183, Zürich</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-xs text-slate-400 hover:text-slate-600">Sign in</Link>
            <Link href="/register" className="text-xs text-slate-400 hover:text-slate-600">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
