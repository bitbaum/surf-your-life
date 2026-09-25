import { useTranslations } from "next-intl";
import { Waves } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center mb-8">
        <Waves className="w-6 h-6 text-ink-on-overlay" aria-hidden />
      </div>
      <h1 className="text-6xl font-bold text-ink mb-4">404</h1>
      <p className="text-xl text-ink-muted mb-2">{t("title")}</p>
      <p className="text-ink-faint mb-10 max-w-sm">{t("description")}</p>
      <div className="flex gap-3">
        <Link href="/">
          <Button>{t("home")}</Button>
        </Link>
        <Link href="/dashboard">
          <Button variant="outline">{t("dashboard")}</Button>
        </Link>
      </div>
    </div>
  );
}
