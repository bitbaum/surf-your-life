import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { setRequestLocale, getTranslations } from "next-intl/server"
import { PageHeader } from "@/components/ui/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ExportButton } from "./export-button"
import { DeleteAccountForm } from "./delete-account-form"

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session) redirect(`/${locale}/login`)

  const t = await getTranslations("portal.settings")

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 pb-8">
      <PageHeader title={t("title")} />

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
  )
}
