import { setRequestLocale } from "next-intl/server"
import { MarketingNav } from "@/components/marketing/nav"
import { MarketingFooter } from "@/components/marketing/footer"
import { auth } from "@/lib/auth"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Surf Your Life collects, processes, and protects your personal and health data. Swiss nFADP and EU GDPR compliant.",
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const session = await auth()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <MarketingNav isLoggedIn={!!session} />

      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-slate-500 mb-10">
            Last updated: April 2026 · Applies to surf-your-life.ch and the Surf Your Life client portal
          </p>

          {/* 1 — Data Controller */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">1. Data Controller</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              The data controller responsible for your personal information is:
            </p>
            <address className="not-italic text-slate-700 text-sm mt-3 pl-4 border-l-2 border-teal-200">
              <strong>Surf Your Life</strong>
              <br />
              Dr. Manu (Medical Director)
              <br />
              Zollikerstrasse 183
              <br />
              8008 Zürich, Switzerland
              <br />
              <a href="mailto:privacy@surf-your-life.ch" className="text-teal-600 hover:underline">
                privacy@surf-your-life.ch
              </a>
            </address>
          </section>

          {/* 2 — Data Collected */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">2. Data We Collect</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              We collect only what is necessary to deliver our service:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>
                <strong>Account information:</strong> name, email address, and (optionally) a profile photo when you
                register via Google OAuth or email/password.
              </li>
              <li>
                <strong>Health tracking data:</strong> mood ratings, energy levels, sleep duration, and free-text
                reflections you enter during check-ins.
              </li>
              <li>
                <strong>Contact information:</strong> messages sent through the contact form or the in-portal
                messaging feature.
              </li>
              <li>
                <strong>Technical data:</strong> IP address, browser type, and access logs — collected automatically
                by our hosting infrastructure (Vercel) for security and performance purposes.
              </li>
            </ul>
          </section>

          {/* 3 — Purpose */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">3. Purpose of Processing</h2>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>Providing and personalising the client portal and health tracking features.</li>
              <li>Enabling practitioners to review your progress and provide clinical guidance.</li>
              <li>Communicating with you about your program and appointments.</li>
              <li>Improving our service through anonymised, aggregated analytics.</li>
              <li>Complying with legal obligations under Swiss and EU law.</li>
            </ul>
            <p className="text-slate-600 text-sm mt-3">
              The legal basis for processing health data is your explicit consent (Art. 6(1)(a) and Art. 9(2)(a)
              GDPR; Art. 31 nFADP). You may withdraw consent at any time — see Section 6.
            </p>
          </section>

          {/* 4 — Retention */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">4. Data Retention</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We retain your data for as long as your account is active and for a maximum of 5 years after account
              closure, unless a longer retention period is required by applicable law (e.g., Swiss medical record
              obligations). Check-in data and health records may be subject to a 10-year retention minimum under
              Swiss health legislation.
            </p>
          </section>

          {/* 5 — Third Parties */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">5. Third-Party Processors</h2>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>
                <strong>Vercel Inc.</strong> (USA) — hosting and edge delivery. Standard Contractual Clauses apply.
              </li>
              <li>
                <strong>Neon Inc.</strong> (USA) — database hosting (PostgreSQL). Standard Contractual Clauses apply.
              </li>
              <li>
                <strong>Google LLC</strong> — OAuth authentication if you choose &ldquo;Sign in with Google&rdquo;.
                Governed by Google&apos;s Privacy Policy.
              </li>
            </ul>
            <p className="text-slate-600 text-sm mt-3">
              We do not sell your data. We do not share your health data with any third party unless required by law
              or with your explicit consent.
            </p>
          </section>

          {/* 6 — Your Rights */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">6. Your Rights</h2>
            <p className="text-slate-600 text-sm leading-relaxed mb-3">
              Under Swiss nFADP and EU GDPR you have the right to:
            </p>
            <ul className="list-disc pl-5 text-slate-600 text-sm space-y-2">
              <li>
                <strong>Access</strong> a copy of all personal data we hold about you.
              </li>
              <li>
                <strong>Rectification</strong> of inaccurate or incomplete data.
              </li>
              <li>
                <strong>Erasure</strong> (&ldquo;right to be forgotten&rdquo;) — deletion of your account and all
                associated data, subject to legal retention obligations.
              </li>
              <li>
                <strong>Portability</strong> — receive your check-in and profile data in a structured,
                machine-readable format (JSON or CSV).
              </li>
              <li>
                <strong>Restriction</strong> of processing while a dispute is under review.
              </li>
              <li>
                <strong>Withdraw consent</strong> at any time without affecting prior processing.
              </li>
              <li>
                <strong>Lodge a complaint</strong> with the Swiss Federal Data Protection and Information
                Commissioner (FDPIC) or, for EU residents, your local supervisory authority.
              </li>
            </ul>
            <p className="text-slate-600 text-sm mt-4">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:privacy@surf-your-life.ch" className="text-teal-600 hover:underline">
                privacy@surf-your-life.ch
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          {/* 7 — Cookies */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">7. Cookies</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We use a single session cookie to keep you logged in. No tracking or advertising cookies are set. We do
              not use Google Analytics or similar tracking tools.
            </p>
          </section>

          {/* 8 — Compliance */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">8. Legal Compliance</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              This policy complies with the{" "}
              <strong>Swiss Federal Act on Data Protection (nFADP / revDSG)</strong>, in force since 1 September 2023,
              and with the{" "}
              <strong>EU General Data Protection Regulation (GDPR)</strong> where applicable to EU residents. As a
              health portal processing special-category data, we apply the highest level of data protection
              obligations.
            </p>
          </section>

          {/* 9 — Changes */}
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">9. Changes to This Policy</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              We may update this policy as our services evolve or legal requirements change. Material changes will be
              communicated by email to registered users at least 14 days before they take effect. The current version
              is always available at this URL.
            </p>
          </section>
        </div>
      </main>

      <MarketingFooter />
    </div>
  )
}
