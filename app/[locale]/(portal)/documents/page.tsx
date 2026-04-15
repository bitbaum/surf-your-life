import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { documents } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent } from "@/components/ui/card"
import { PageHeader } from "@/components/ui/page-header"
import { formatDate } from "@/lib/utils"
import { FileText } from "lucide-react"
import { getTranslations, setRequestLocale } from "next-intl/server"

const TYPE_BADGE: Record<string, string> = {
  session_note: "bg-teal-50 text-teal-700 border-teal-200",
  assessment:   "bg-violet-50 text-violet-700 border-violet-200",
  report:       "bg-blue-50 text-blue-700 border-blue-200",
  upload:       "bg-slate-100 text-slate-600 border-slate-200",
}

export default async function DocumentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.documents")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const docs = await db.query.documents.findMany({
    where: eq(documents.userId, session.user.id),
    orderBy: [desc(documents.createdAt)],
    with: { author: { columns: { name: true } } },
  })

  const typeLabel = (type: string) => {
    const key = `type_${type}` as Parameters<typeof t>[0]
    return t(key)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
      />

      {docs.length === 0 ? (
        <Card>
          <CardContent className="py-12 flex flex-col items-center gap-2 text-center">
            <FileText className="w-8 h-8 text-slate-300" />
            <p className="text-slate-500 font-medium">{t("empty")}</p>
            <p className="text-sm text-slate-400">{t("emptySubtext")}</p>
          </CardContent>
        </Card>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_BADGE[doc.type] ?? TYPE_BADGE.upload}`}>
                        {typeLabel(doc.type)}
                      </span>
                      <span className="text-xs text-slate-400">{formatDate(doc.createdAt)}</span>
                      {doc.author?.name && (
                        <span className="text-xs text-slate-400">· {t("by")} {doc.author.name}</span>
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
    </div>
  )
}
