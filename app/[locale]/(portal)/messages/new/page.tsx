import { auth } from "@/lib/auth"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { PageHeader } from "@/components/ui/page-header"
import { NewMessageForm } from "./new-message-form"

export default async function PortalNewMessagePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
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

      <PageHeader title={t("newMessage")} />

      <NewMessageForm />
    </div>
  )
}
