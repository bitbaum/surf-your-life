import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { setRequestLocale, getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { Geist } from "next/font/google"
import type { Metadata } from "next"
import { Toaster } from "sonner"
import "../globals.css"
import { SITE_URL, BRAND_NAME } from "@/lib/constants"
import { FeedbackWidget } from "@/components/feedback-widget"

const BRAND_TITLE = `${BRAND_NAME} — Medical Performance Space Zürich`

export const metadata: Metadata = {
  title: {
    default: BRAND_TITLE,
    template: `%s | ${BRAND_NAME}`,
  },
  description:
    "Psychiatry-led burnout recovery and longevity program. Individual tracking portal, body-first methodology. Zollikerstrasse 183, Zürich.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: BRAND_NAME,
    title: BRAND_TITLE,
    description: "Psychiatry-led burnout recovery and longevity program. Zürich.",
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_TITLE,
    description: "Psychiatry-led burnout recovery and longevity program. Zürich.",
  },
  metadataBase: new URL(SITE_URL),
}

const geist = Geist({ subsets: ["latin"] })

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  setRequestLocale(locale)
  const messages = await getMessages()

  return (
    <html lang={locale} className={`${geist.className} h-full antialiased`}>
      <body className="min-h-full">
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster richColors position="top-right" />
          <FeedbackWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
