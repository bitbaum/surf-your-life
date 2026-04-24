import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { ServiceRow } from "./service-row"
import { CreateServiceForm } from "./create-service-form"
import { EmptyState } from "@/components/ui/empty-state"
import { SERVICES_MAX_LIMIT } from "@/lib/constants"

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("admin.services")

  const allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name))
    .limit(SERVICES_MAX_LIMIT)

  const availableCount = allServices.filter((s) => s.available).length
  const hiddenCount = allServices.filter((s) => !s.available).length

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={<CreateServiceForm />}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("allServices", { n: allServices.length })}</CardTitle>
        </CardHeader>
        <CardContent>
          {allServices.length === 0 ? (
            <EmptyState message={t("noServices")} className="py-8" action={<CreateServiceForm />} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">{t("columnName")}</th>
                    <th className="text-left py-2 font-medium text-slate-500">{t("columnCategory")}</th>
                    <th className="text-left py-2 font-medium text-slate-500">{t("columnDuration")}</th>
                    <th className="text-left py-2 font-medium text-slate-500">{t("columnStatus")}</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {allServices.map((service) => (
                    <ServiceRow key={service.id} service={service} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {hiddenCount > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          {t("hiddenCount", { hidden: hiddenCount, available: availableCount })}
        </p>
      )}
    </div>
  )
}
