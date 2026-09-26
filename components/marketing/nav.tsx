"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Waves, Menu, X, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { BRAND_NAME } from "@/lib/constants";

// anchor=true → rendered as <a href="..."> (same-page scroll)
// anchor=false → rendered as <Link href="..."> (route navigation)
const NAV_LINKS = [
  { href: "#method", labelKey: "method", anchor: true },
  { href: "#who", labelKey: "forWhom", anchor: true },
  { href: "#process", labelKey: "howItWorks", anchor: true },
  { href: "/faq", labelKey: "faq", anchor: false },
  { href: "/blog", labelKey: "blog", anchor: false },
  { href: "/contact", labelKey: "contact", anchor: false },
] as const;

// 44x44 is the fleet's touch floor (nav contract rule 3). The hit area grows,
// the text does not: min-h/min-w on the link itself, gap trimmed to pay for it.
const DESKTOP_LINK =
  "inline-flex min-h-11 min-w-11 items-center justify-center text-sm text-ink-muted hover:text-ink transition-colors";
const MOBILE_LINK =
  "flex min-h-11 items-center text-sm text-ink-soft hover:text-brand transition-colors";

export function MarketingNav({ isLoggedIn = false }: { isLoggedIn?: boolean }) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-border-subtle">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
              <Waves className="w-4 h-4 text-ink-on-overlay" />
            </div>
            <span className="font-semibold text-ink text-sm">{BRAND_NAME}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-6">
            {NAV_LINKS.map(({ href, labelKey, anchor }) =>
              anchor ? (
                <a key={href} href={href} className={DESKTOP_LINK}>
                  {t(labelKey)}
                </a>
              ) : (
                <Link key={href} href={href} className={DESKTOP_LINK}>
                  {t(labelKey)}
                </Link>
              ),
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <LocaleSwitcher direction="down" />
            {isLoggedIn ? (
              <Link href="/dashboard">
                <Button size="sm" variant="outline" className="gap-1.5">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  {t("dashboard")}
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm text-ink-muted hover:text-ink transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link href="/register">
                  <Button size="sm">{t("getStarted")}</Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="lg:hidden inline-flex h-11 w-11 items-center justify-center rounded-lg hover:bg-surface-muted transition-colors"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? t("close") : t("open")}
          >
            {open ? (
              <X className="w-5 h-5 text-ink-soft" />
            ) : (
              <Menu className="w-5 h-5 text-ink-soft" />
            )}
          </button>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border-subtle bg-surface px-6 py-3 flex flex-col gap-1">
            {NAV_LINKS.map(({ href, labelKey, anchor }) =>
              anchor ? (
                <a key={href} href={href} onClick={() => setOpen(false)} className={MOBILE_LINK}>
                  {t(labelKey)}
                </a>
              ) : (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={MOBILE_LINK}>
                  {t(labelKey)}
                </Link>
              ),
            )}
            <div className="pt-3 border-t border-border-subtle flex flex-col gap-2">
              <LocaleSwitcher />
              {isLoggedIn ? (
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  <Button className="w-full gap-1.5">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    {t("dashboard")}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      {t("signIn")}
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)}>
                    <Button className="w-full">{t("getStarted")}</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
