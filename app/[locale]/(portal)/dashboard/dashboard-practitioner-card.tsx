import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { assignments, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { UserCircle } from "lucide-react";

export async function DashboardPractitionerCard({ userId }: { userId: string }) {
  const t = await getTranslations("portal.dashboard");

  const assignment = await db
    .select({ practitionerName: users.name })
    .from(assignments)
    .innerJoin(users, eq(users.id, assignments.practitionerId))
    .where(and(eq(assignments.clientId, userId), eq(assignments.active, true)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!assignment) return null;

  return (
    <Card className="mb-6 border-slate-200 bg-white">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400">{t("yourPractitioner")}</p>
            <p className="text-sm font-semibold text-slate-800">{assignment.practitionerName}</p>
          </div>
          <Link href="/messages" className="flex-shrink-0 text-xs text-teal-600 hover:underline">
            {t("yourPractitionerLink")}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
