import { db } from "@/lib/db";
import { clientAlerts, users, assignments } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { AlertList } from "./alert-list";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ADMIN_ALERTS_MAX, SEVEN_DAYS_MS } from "@/lib/constants";
import { buildLastNDayStrings } from "@/lib/utils";
import { fetchCadenceMap } from "@/lib/db/check-in-cadence";

export default async function AlertsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin.alerts");
  const tClients = await getTranslations("admin.clients");

  const session = await auth();
  const myAssignments = session?.user?.id
    ? await db
        .select({ clientId: assignments.clientId })
        .from(assignments)
        .where(and(eq(assignments.practitionerId, session.user.id), eq(assignments.active, true)))
    : [];
  const myClientIds = myAssignments.map((a) => a.clientId);

  const rows = await db
    .select({
      id: clientAlerts.id,
      type: clientAlerts.type,
      severity: clientAlerts.severity,
      title: clientAlerts.title,
      message: clientAlerts.message,
      createdAt: clientAlerts.createdAt,
      client: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(clientAlerts)
    .innerJoin(users, eq(users.id, clientAlerts.clientId))
    .where(eq(clientAlerts.isResolved, false))
    .orderBy(desc(clientAlerts.createdAt))
    .limit(ADMIN_ALERTS_MAX);

  const total = rows.length;
  const highCount = rows.filter((r) => r.severity === "high").length;

  // Per-client 7-day cadence so practitioners can triage "is this client
  // otherwise active?" without clicking through.
  const clientIds = [...new Set(rows.map((r) => r.client.id))];
  const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS); // eslint-disable-line react-hooks/purity -- server component
  const sparkData = await fetchCadenceMap(clientIds, sevenDaysAgo);

  const sparkDays = buildLastNDayStrings(7);
  const sparkLabels = {
    missed: tClients("dotMissed"),
    checkedIn: tClients("dotCheckedIn"),
    pem: tClients("dotPem"),
  };

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        description={
          total === 0
            ? t("descriptionEmpty")
            : highCount > 0
              ? t("descriptionWithHigh", { total, high: highCount })
              : t("description", { total })
        }
      />
      <AlertList
        initialAlerts={rows}
        sparkDays={sparkDays}
        sparkData={sparkData}
        sparkLabels={sparkLabels}
        sparkHint={tClients("cadenceHint")}
        myClientIds={myClientIds}
      />
    </div>
  );
}
