import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { AlertTriangle } from "lucide-react";
import {
  DAY_MS,
  MOOD_EMOJI,
  CLIENT_ENERGY_LOW_THRESHOLD,
  CLIENT_ENERGY_MODERATE_THRESHOLD,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { checkIns } from "@/lib/db/schema";
import { inArray, desc } from "drizzle-orm";

type AtRiskClient = {
  id: string;
  name: string | null;
  email: string | null;
  lastCheckIn: Date | null;
};

interface Props {
  clients: AtRiskClient[];
  nowMs: number;
}

export async function AtRiskClientsCard({ clients, nowMs }: Props) {
  const t = await getTranslations("admin.dashboard");

  if (clients.length === 0) return null;

  const clientIds = clients.map((c) => c.id);
  const lastDetails =
    clientIds.length > 0
      ? await db
          .selectDistinctOn([checkIns.userId], {
            userId: checkIns.userId,
            energyLevel: checkIns.energyLevel,
            mood: checkIns.mood,
          })
          .from(checkIns)
          .where(inArray(checkIns.userId, clientIds))
          .orderBy(checkIns.userId, desc(checkIns.createdAt))
      : [];
  const detailMap = Object.fromEntries(lastDetails.map((r) => [r.userId, r]));

  return (
    <Card className="mb-6 border-amber-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            {t("needsAttention")}
          </CardTitle>
          <Link href="/admin/clients/at-risk" className="text-sm text-amber-600 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y divide-slate-100">
          {clients.map((client) => {
            const daysAgo = client.lastCheckIn
              ? Math.floor((nowMs - client.lastCheckIn.getTime()) / DAY_MS)
              : null;
            const detail = detailMap[client.id];
            const energy = detail?.energyLevel ?? null;
            const energyColor =
              energy == null
                ? "text-slate-300"
                : energy <= CLIENT_ENERGY_LOW_THRESHOLD
                  ? "text-red-600 font-semibold"
                  : energy <= CLIENT_ENERGY_MODERATE_THRESHOLD
                    ? "text-amber-600"
                    : "text-teal-600";
            return (
              <Link
                key={client.id}
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-between py-3 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{client.name ?? "—"}</p>
                  <p className="text-xs text-slate-400">{client.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {detail && (
                    <span className="flex items-center gap-1.5 text-xs">
                      <span className={energyColor}>{energy}/10</span>
                      <span>{MOOD_EMOJI[detail.mood] ?? "😐"}</span>
                    </span>
                  )}
                  <p className="text-xs text-amber-600 font-medium">
                    {daysAgo === null ? t("never") : t("daysAgo", { n: daysAgo })}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
