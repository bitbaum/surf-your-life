import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { AlertTriangle } from "lucide-react";
import { AlertList, type Alert } from "./alert-list";

interface Props {
  count: number;
  alerts: Alert[];
}

export async function AlertsPreviewCard({ count, alerts }: Props) {
  if (count === 0) return null;
  const t = await getTranslations("admin.dashboard");

  return (
    <Card className="mb-6 border-red-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            {t("clinicalAlerts")} ({count})
          </CardTitle>
          <Link href="/admin/alerts" className="text-sm text-red-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <AlertList alerts={alerts} />
      </CardContent>
    </Card>
  );
}
