"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BRAND_NAME } from "@/lib/constants";
import { Waves, ClipboardList, Menu } from "lucide-react";

interface Props {
  onOpenMenu: () => void;
}

export function SidebarMobileBar({ onOpenMenu }: Props) {
  const t = useTranslations("sidebar");

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
      <Link href="/dashboard" className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-teal-600 flex items-center justify-center">
          <Waves className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-semibold text-slate-900 text-sm">{BRAND_NAME}</span>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href="/check-in"
          className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700 transition-colors"
        >
          <ClipboardList className="w-3.5 h-3.5" />
          {t("checkIn")}
        </Link>
        <button
          onClick={onOpenMenu}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label={t("openMenu")}
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
      </div>
    </div>
  );
}
