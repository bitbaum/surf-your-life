import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportButton } from "./export-button";
import { Link } from "@/i18n/navigation";
import { ReminderToggle } from "./reminder-toggle";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CLIENT_ROLE } from "@/lib/domain/auth";
import { getAiConsent } from "@/lib/domain/ai-consent";
import { AiConsentSettingsCard } from "@/components/portal/ai-consent/settings-card";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("portal.settings");

  const isClient = session.user.role === CLIENT_ROLE;
  const [profile, aiConsent] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, session.user.id),
      columns: { receiveReminders: true },
    }),
    isClient ? getAiConsent(session.user.id) : null,
  ]);
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

      {aiConsent && (
        <AiConsentSettingsCard state={aiConsent.state} decidedAt={aiConsent.decidedAt} />
      )}

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

      {/* Delete account: done in the account panel on the profile, with the
          other sign-in settings (AccountKit). */}
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">{t("deleteTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-slate-600">{t("deleteBody")}</p>
          <p className="text-sm font-medium text-red-700">{t("deleteWarning")}</p>
          <Link
            href="/profile#account"
            className="inline-flex min-h-10 items-center justify-center self-start rounded-element border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            {t("deleteButton")}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
