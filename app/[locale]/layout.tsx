import { notFound } from "next/navigation"
import { hasLocale, NextIntlClientProvider } from "next-intl"
import { setRequestLocale, getMessages } from "next-intl/server"
import { routing } from "@/i18n/routing"
import { Geist } from "next/font/google"
import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: {
    default: "Surf Your Life — Medical Performance Space Zürich",
    template: "%s | Surf Your Life",
  },
  description:
    "Psychiatry-led burnout recovery and longevity program. Individual tracking portal, body-first methodology. Zollikerstrasse 183, Zürich.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Surf Your Life",
    title: "Surf Your Life — Medical Performance Space Zürich",
    description: "Psychiatry-led burnout recovery and longevity program. Zürich.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Surf Your Life — Medical Performance Space Zürich",
    description: "Psychiatry-led burnout recovery and longevity program. Zürich.",
  },
  metadataBase: new URL(process.env.AUTH_URL ?? "https://surf-your-life.ch"),
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
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
