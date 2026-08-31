import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "./export-button";
import { DeleteAccountForm } from "./delete-account-form";
import { ReminderToggle } from "./reminder-toggle";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("portal.settings");

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
    columns: { receiveReminders: true },
  });
  // Default to true if no profile exists yet (new users haven't completed onboarding)
  const receiveReminders = profile?.receiveReminders ?? true;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-8">
      <PageHeader title={t("title")} />

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>{t("notificationsTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReminderToggle initialValue={receiveReminders} />
        </CardContent>
      </Card>

      {/* Export */}
      <Card>
        <CardHeader>
          <CardTitle>{t("exportTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">{t("exportBody")}</p>
          <ExportButton />
        </CardContent>
      </Card>

      {/* Delete account */}
      <DeleteAccountForm />
    </div>
  );
}
