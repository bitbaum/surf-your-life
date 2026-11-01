import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { authLabelsFor, isDeliverable } from "@bitbaum/accountkit/auth";
import { AccountPanel } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/ui/page-header";
import { auth } from "@/lib/auth";
import { surfMethods } from "@/lib/auth/methods";
import { sharedAuth } from "@/lib/auth/shared/runtime";
import { ProfileForm } from "./profile-form";
import { getUserProfile } from "@/lib/db/queries";

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const session = await auth();
  if (!session) return null;

  const t = await getTranslations("portal.profile");
  const requestHeaders = await headers();
  const [profile, shared, accounts] = await Promise.all([
    getUserProfile(session.user.id),
    sharedAuth.getSession(),
    sharedAuth
      .getAuth()
      .api.listUserAccounts({ headers: requestHeaders })
      .catch(() => []),
  ]);
  const user = shared?.user as
    (NonNullable<typeof shared>["user"] & { twoFactorEnabled?: boolean | null }) | undefined;

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-8">
      <div>
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ProfileForm profile={profile ?? null} initialName={session.user.name ?? ""} />
      </div>
      {/* How this person signs in: password, passkeys, a second factor, linked
          sign-ins, and deleting the account (AccountKit's panel). */}
      <section id="account">
        <AccountPanel
          labels={authLabelsFor(locale)}
          user={{
            name: user?.name ?? session.user.name ?? "",
            email: user && isDeliverable(user.email) ? user.email : null,
            emailVerified: Boolean(user?.emailVerified),
            role: session.user.role,
            twoFactorEnabled: Boolean(user?.twoFactorEnabled),
          }}
          linked={accounts.map((a) => a.providerId)}
          methods={surfMethods()}
          accountPath={`/${locale}/profile`}
          homePath={`/${locale}`}
        />
      </section>
    </div>
  );
}
