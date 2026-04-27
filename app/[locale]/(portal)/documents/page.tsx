import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { PAGINATION_DEFAULT, DOC_TYPE_BADGE_CLASSES, DOC_TYPE_I18N_KEYS } from "@/lib/constants"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { Pagination } from "@/components/ui/pagination"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { FileText } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { AddDocumentButton } from "./add-document-button"
import { EmptyStateCard } from "@/components/ui/empty-state-card"

export default async function DocumentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.documents")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { page: pageParam } = await searchParams
  const { page, offset } = parsePagination(pageParam)
  const whereClause = eq(documents.userId, session.user.id)

  const [docs, totalResult] = await Promise.all([
    db.query.documents.findMany({
      where: whereClause,
      orderBy: [desc(documents.createdAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: { author: { columns: { name: true, id: true } } },
    }),
    db.select({ value: count() }).from(documents).where(whereClause),
  ])

  const total = totalResult[0]?.value ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title={t("title")} description={t("subtitle")} />

      <div className="mb-4">
        <AddDocumentButton />
      </div>

      {docs.length === 0 ? (
        <EmptyStateCard
          icon={<FileText className="w-8 h-8" />}
          message={t("empty")}
          description={t("emptySubtext")}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center mt-0.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${DOC_TYPE_BADGE_CLASSES[doc.type] ?? DOC_TYPE_BADGE_CLASSES.upload}`}>
                        {t(DOC_TYPE_I18N_KEYS[doc.type] ?? "typeUpload")}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                      {doc.author && (
                        <span className="text-xs text-slate-400">
                          · {doc.author.id === session.user.id ? t("byYou") : `${t("by")} ${doc.author.name}`}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-800">{doc.title}</p>
                    {doc.content && (
                      <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{doc.content}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <Pagination page={page} totalPages={totalPages} pageLink={(p) => `/documents?page=${p}`} />
    </div>
  )
}
