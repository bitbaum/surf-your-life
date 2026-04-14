import { PageHeader } from "@/components/ui/page-header"
import { Link } from "@/i18n/navigation"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { CreateProgramForm } from "./create-program-form"

export default async function NewProgramPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.programs")

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/programs" className="text-sm text-slate-400 hover:text-slate-600">
          ← {t("backToPrograms")}
        </Link>
      </div>
      <PageHeader title={t("newTitle")} description={t("newDescription")} />
      <CreateProgramForm />
    </div>
  )
}
