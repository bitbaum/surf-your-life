import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { profiles } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { PageHeader } from "@/components/ui/page-header"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const session = await auth()
  if (!session) return null

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, session.user.id),
  })

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="My Profile" description="Help us understand your situation so we can support you better" />
      <ProfileForm profile={profile ?? null} />
    </div>
  )
}
