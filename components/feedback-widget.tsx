"use client";

import Script from "next/script";
import { usePathname } from "@/i18n/navigation";
import {
  FEEDBACK_WIDGET_SRC,
  FEEDBACK_WIDGET_PROJECT,
  FEEDBACK_WIDGET_PUBLIC_PATH_PREFIXES,
} from "@/lib/constants";

function isPublicPath(pathname: string) {
  if (pathname === "/") return true;
  return FEEDBACK_WIDGET_PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Renders only on public marketing/auth pages — the client portal and admin area
// (both session-gated, both showing clinical health data) never load third-party scripts.
export function FeedbackWidget() {
  const pathname = usePathname();
  if (!isPublicPath(pathname)) return null;

  return (
    <Script
      src={FEEDBACK_WIDGET_SRC}
      data-fc-project={FEEDBACK_WIDGET_PROJECT}
      strategy="afterInteractive"
    />
  );
}
