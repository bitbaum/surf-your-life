import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { formatDate } from "@/lib/utils";

interface Props {
  insight: string | null;
  generatedAt: Date | string | null;
}

export async function DashboardAIInsightCard({ insight, generatedAt }: Props) {
  if (!insight || !generatedAt) return null;
  const t = await getTranslations("portal.dashboard");

  return (
    <Card className="mb-6 border-violet-200 bg-violet-50">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center mt-0.5">
            <Sparkles className="w-4 h-4 text-violet-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <p className="text-sm font-semibold text-violet-800">{t("aiInsightTitle")}</p>
              <span className="text-xs text-violet-500 flex-shrink-0">
                {formatDate(generatedAt)}
              </span>
            </div>
            <p className="text-sm text-violet-900 leading-relaxed">{insight}</p>
            <Link
              href="/check-ins"
              className="inline-block mt-3 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
            >
              {t("aiInsightViewAll")} →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
