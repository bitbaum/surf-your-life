import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { eq, desc, isNotNull, and, gte } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { THIRTY_DAYS_MS } from "@/lib/constants";

export async function DashboardPractitionerNoteCard({ userId }: { userId: string }) {
  const t = await getTranslations("portal.dashboard");

  const thirtyDaysAgo = new Date(Date.now() - THIRTY_DAYS_MS); // eslint-disable-line react-hooks/purity -- server component

  const latest = await db.query.checkIns.findFirst({
    where: and(
      eq(checkIns.userId, userId),
      isNotNull(checkIns.practitionerNote),
      gte(checkIns.practitionerNoteAt, thirtyDaysAgo),
    ),
    orderBy: [desc(checkIns.practitionerNoteAt)],
    columns: { practitionerNote: true, practitionerNoteAt: true },
  });

  if (!latest?.practitionerNote) return null;

  return (
    <Card className="mb-6 border-teal-200 bg-teal-50/40">
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-teal-100 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-teal-900">
                {t("practitionerNoteTitle")}
              </span>
              {latest.practitionerNoteAt && (
                <span className="text-xs text-teal-600">
                  {formatDate(latest.practitionerNoteAt)}
                </span>
              )}
            </div>
            <p className="text-sm text-teal-800 leading-relaxed">{latest.practitionerNote}</p>
            <Link
              href="/check-ins"
              className="text-xs text-teal-600 hover:underline mt-2 inline-block"
            >
              {t("practitionerNoteLink")}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
