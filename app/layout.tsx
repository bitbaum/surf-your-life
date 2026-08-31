import type { Metadata } from "next";
import { SITE_URL, BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${BRAND_NAME} — Medical Performance & Reintegration, Zürich`,
    template: `%s · ${BRAND_NAME}`,
  },
  description:
    "A psychiatry-led program for burnout, Long COVID, and midlife reinvention. Body-first methodology. Based at Zollikerstrasse 183, Zürich.",
  openGraph: {
    siteName: BRAND_NAME,
    locale: "de_CH",
    type: "website",
  },
  metadataBase: new URL(SITE_URL),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
