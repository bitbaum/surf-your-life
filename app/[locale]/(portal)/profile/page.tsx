import { auth } from "@/lib/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHeader } from "@/components/ui/page-header";
import { ProfileForm } from "./profile-form";
import { SecurityForm } from "./security-form";
import { getUserProfile } from "@/lib/db/queries";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session) return null;

  const t = await getTranslations("portal.profile");

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-8">
      <div>
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ProfileForm profile={profile ?? null} initialName={session.user.name ?? ""} />
      </div>
      <SecurityForm />
    </div>
  );
}
