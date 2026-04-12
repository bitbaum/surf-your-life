import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Surf Your Life — Medical Performance & Reintegration, Zürich",
    template: "%s · Surf Your Life",
  },
  description:
    "A psychiatry-led programme for burnout, Long COVID, and midlife reinvention. Body-first methodology. Based at Zollikerstrasse 183, Zürich.",
  openGraph: {
    siteName: "Surf Your Life",
    title: "Surf Your Life — Medical Performance & Reintegration, Zürich",
    description:
      "A psychiatry-led programme for burnout, Long COVID, and midlife reinvention. Body-first methodology. Based in Zürich.",
    locale: "en_CH",
    type: "website",
  },
  metadataBase: new URL("https://surf-your-life.vercel.app"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${geist.className} min-h-full`}>{children}</body>
    </html>
  )
}
