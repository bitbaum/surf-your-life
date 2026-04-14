import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"
import { asc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { setRequestLocale } from "next-intl/server"
import { ServiceRow } from "./service-row"
import { CreateServiceForm } from "./create-service-form"

export default async function AdminServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const allServices = await db
    .select()
    .from(services)
    .orderBy(asc(services.sortOrder), asc(services.name))

  const available = allServices.filter((s) => s.available)
  const hidden = allServices.filter((s) => !s.available)

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Services"
        description="Manage bookable services shown to clients"
        action={<CreateServiceForm />}
      />

      <Card>
        <CardHeader>
          <CardTitle>All services ({allServices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allServices.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No services yet. Create one above.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 font-medium text-slate-500">Name</th>
                    <th className="text-left py-2 font-medium text-slate-500">Category</th>
                    <th className="text-left py-2 font-medium text-slate-500">Duration</th>
                    <th className="text-left py-2 font-medium text-slate-500">Status</th>
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

      {hidden.length > 0 && (
        <p className="text-xs text-slate-400 mt-3 text-center">
          {hidden.length} hidden service{hidden.length !== 1 ? "s" : ""} not shown to clients ·{" "}
          {available.length} available
        </p>
      )}
    </div>
  )
}
