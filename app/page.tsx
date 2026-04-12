import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MarketingNav } from "@/components/marketing/nav"
import {
  ArrowRight,
  Brain,
  Activity,
  Users,
  CheckCircle,
  MapPin,
  Waves,
} from "lucide-react"

const pillars = [
  {
    n: "01",
    icon: Activity,
    title: "Biological reset",
    description:
      "Sleep architecture, nervous system regulation, and physical recovery — sequenced and monitored. No psychological programme lands without this foundation.",
  },
  {
    n: "02",
    icon: Brain,
    title: "Psychiatric guidance",
    description:
      "Medically anchored from day one. Our psychiatrist establishes a clear clinical picture and keeps your programme evidence-based throughout.",
  },
  {
    n: "03",
    icon: Users,
    title: "Reintegration",
    description:
      "Returning to work, reinventing what's next, or simply reclaiming your capacity — we map the gap and navigate it with you, step by step.",
  },
]

const failureModes = [
  {
    title: "Coaching before the body is ready",
    body: "Talk therapy and mindset work have no traction when the nervous system is still in threat response. The biology has to come first.",
  },
  {
    title: "The discharge gap is unmanaged",
    body: "Most clinics discharge without a structured bridge back to function. The space between treatment and life is where recovery breaks down.",
  },
  {
    title: "No medical anchor",
    body: "Wellness programmes lack the clinical depth to distinguish burnout from depression, or Long COVID from chronic stress. Precision matters.",
  },
]

const steps = [
  {
    n: "01",
    title: "Deep assessment",
    body: "A thorough intake covering your medical history, current state, work context, and goals — so we understand the full picture before anything begins.",
  },
  {
    n: "02",
    title: "Your programme",
    body: "A structured plan combining body-first protocols, regular psychiatric check-ins, and reintegration milestones. Personalised, not generic.",
  },
  {
    n: "03",
    title: "Track & evolve",
    body: "Daily check-ins in the portal. We see the data. Your programme adapts as you recover — no waiting for the next appointment.",
  },
]

const conditions = [
  "Burnout",
  "Long COVID",
  "Midlife reinvention",
  "Work reintegration",
  "Chronic stress",
  "Post-clinic transition",
  "Energy & performance",
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
        {/* Decorative gradient blobs */}
        <div className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -left-40 w-[500px] h-[500px] rounded-full bg-slate-200/40 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 py-24 w-full">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold mb-10 tracking-widest uppercase">
              <MapPin className="w-3 h-3" />
              Zürich · Medical Performance Space
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 leading-[1.05] tracking-tight">
              Get back<br />
              to yourself.<br />
              <span className="text-teal-600">On your terms.</span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-500 max-w-xl leading-relaxed">
              A psychiatry-led programme for burnout, Long COVID, and midlife reinvention.
              We reset the biology first — because everything else depends on it.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start your programme
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#method">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base px-8">
                  See the method
                </Button>
              </a>
            </div>

            <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {["Psychiatry-led", "Body-first methodology", "Zollikerstrasse 183"].map((item) => (
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
          {[
            "230 m² performance space",
            "Psychiatry-led",
            "Individual programmes",
            "Daily tracking portal",
            "Zürich CBD",
          ].map((item) => (
            <span key={item} className="text-sm text-slate-500 font-medium">{item}</span>
          ))}
        </div>
      </div>

      {/* ── The problem ──────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-4">The gap</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-white leading-tight">
              Why most recovery never completes
            </h2>
            <p className="mt-6 text-slate-400 text-lg leading-relaxed">
              A dysregulated nervous system cannot be coached or willed back to health.
              Standard approaches fail because they skip the biology — or never address the gap between
              clinical discharge and functional life.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {failureModes.map(({ title, body }) => (
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
            <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">The method</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 leading-tight">
              Hardware before software
            </h2>
            <p className="mt-6 text-slate-500 text-lg leading-relaxed">
              Every programme starts with your body — sleep, nervous system, and physical resilience.
              Only once that foundation is stable does the psychological work begin.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map(({ n, icon: Icon, title, description }) => (
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
                  <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-teal-600">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-teal-300 text-8xl font-serif leading-none mb-4 select-none">&ldquo;</div>
          <blockquote className="text-xl sm:text-2xl font-medium text-white leading-relaxed -mt-6">
            The gap between clinic discharge and returning to work is where most people fall through.
            We exist specifically to bridge that gap — with medicine, structure, and accountability.
          </blockquote>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Dr. Manu</p>
              <p className="text-xs text-teal-200">Psychiatrist & Founder, Vitareba</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Who ──────────────────────────────────────────────────────── */}
      <section id="who" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">For whom</p>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">
                High-functioning people who hit a wall
              </h2>
              <p className="text-slate-500 leading-relaxed mb-8">
                Executives, doctors, founders, creatives. People who did everything right
                and still burned out — or who never fully recovered from Long COVID, a health crisis,
                or a major life transition.
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
                What our clients say
              </p>
              <div className="flex flex-col gap-6">
                <div className="border-l-2 border-teal-400 pl-4">
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    &ldquo;I didn&apos;t realise how burned out I was until I started tracking properly.
                    The structure gave me something to hold onto.&rdquo;
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Executive, Zürich</p>
                </div>
                <div className="border-l-2 border-teal-400 pl-4">
                  <p className="text-slate-700 text-sm leading-relaxed italic">
                    &ldquo;After 18 months of Long COVID, this was the first programme
                    that actually started with how I felt physically.&rdquo;
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Physician, Basel</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────────── */}
      <section id="process" className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-teal-600 text-sm font-semibold tracking-widest uppercase mb-4">The process</p>
            <h2 className="text-4xl font-bold text-slate-900">Simple. Structured. Clear.</h2>
            <p className="mt-3 text-slate-500 max-w-lg mx-auto">
              No guesswork. Every step is defined before you start.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ n, title, body }) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <div className="text-5xl font-bold text-teal-50 mb-4 leading-none select-none"
                  style={{ textShadow: "0 0 0 #0d9488", WebkitTextStroke: "1.5px #0d9488" }}
                >
                  {n}
                </div>
                <h3 className="font-semibold text-slate-900 mb-3 text-lg">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-slate-950">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center mx-auto mb-8">
            <Waves className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to start<br />your programme?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Create your account, complete the intake, and we&apos;ll be in touch within 24 hours
            to schedule your initial assessment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button
                size="lg"
                className="w-full sm:w-auto text-base px-10 bg-teal-500 hover:bg-teal-400 text-white border-0"
              >
                Create your account
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition-colors">
              Already have an account →
            </Link>
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
            <span className="text-sm text-slate-400">Surf Your Life · Zollikerstrasse 183, 8008 Zürich</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#method" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Method</a>
            <a href="#who" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">For whom</a>
            <Link href="/login" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Sign in</Link>
            <Link href="/register" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
