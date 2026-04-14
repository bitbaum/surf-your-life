import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "Surf Your Life — Medical Performance & Reintegration, Zürich",
    template: "%s · Surf Your Life",
  },
  description:
    "A psychiatry-led program for burnout, Long COVID, and midlife reinvention. Body-first methodology. Based at Zollikerstrasse 183, Zürich.",
  openGraph: {
    siteName: "Surf Your Life",
    locale: "de_CH",
    type: "website",
  },
  metadataBase: new URL("https://surf-your-life.vercel.app"),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
