import { auth } from "@/lib/auth"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { NewMessageForm } from "./new-message-form"

export default async function PortalNewMessagePage() {
  const session = await auth()
  if (!session) return null

  const t = await getTranslations("messages")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/messages" className="text-sm text-slate-400 hover:text-slate-600">
          ← {t("backToMessages")}
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 mb-6">{t("newMessage")}</h1>

      <NewMessageForm />
    </div>
  )
}
