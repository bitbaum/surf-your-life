import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { getTranslations } from "next-intl/server"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileForm } from "./profile-form"
import { SecurityForm } from "./security-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("portal.profile")

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-8">
      <div>
        <PageHeader title={t("title")} description={t("subtitle")} />
        <ProfileForm profile={profile ?? null} initialName={session.user.name ?? ""} />
      </div>
      <SecurityForm />
    </div>
  )
}
