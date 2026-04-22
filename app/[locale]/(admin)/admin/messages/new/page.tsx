import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { CLIENT_ROLE } from "@/lib/domain/auth"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { NewThreadForm } from "./new-thread-form"

export default async function AdminNewMessagePage({
  searchParams,
}: {
  searchParams: Promise<{ clientId?: string }>
}) {
  const session = await auth()
  if (!session) return null

  const { clientId } = await searchParams
  const t = await getTranslations("admin.messages")
  const mt = await getTranslations("messages")

  // Fetch all clients for the select dropdown
  const clients = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.role, CLIENT_ROLE))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/messages" className="text-sm text-slate-400 hover:text-slate-600">
          ← {mt("backToMessages")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t("newConversation")}</h1>

      <NewThreadForm clients={clients} preselectedClientId={clientId} />
    </div>
  )
}
