"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
import { User, Settings, ShieldCheck, LogOut } from "lucide-react";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

const BOTTOM_ITEMS = [
  { href: "/profile", labelKey: "profile" as const, icon: User },
  { href: "/settings", labelKey: "settings" as const, icon: Settings },
];

interface Props {
  isAdminUser: boolean;
  onClose: () => void;
}

export function PortalSidebarBottom({ isAdminUser, onClose }: Props) {
  const t = useTranslations("sidebar");

  return (
    <div className="flex flex-col gap-1 pt-4 border-t border-slate-100">
      {BOTTOM_ITEMS.map(({ href, labelKey, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <Icon className="w-4 h-4" />
          {t(labelKey)}
        </Link>
      ))}

      {isAdminUser && (
        <Link
          href="/admin/dashboard"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-teal-700 hover:bg-teal-50 transition-colors"
        >
          <ShieldCheck className="w-4 h-4" />
          {t("adminArea")}
        </Link>
      )}

      <div className="flex items-center justify-between px-3 py-2">
        <LocaleSwitcher />
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-slate-700 transition-colors"
          title={t("signOut")}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
