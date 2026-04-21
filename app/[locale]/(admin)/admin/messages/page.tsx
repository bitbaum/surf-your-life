import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { desc, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const t = await getTranslations("admin.messages")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT

  const [allThreads, totalResult] = await Promise.all([
    db.query.threads.findMany({
      orderBy: [desc(threads.updatedAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: {
        client: true,
        messages: {
          orderBy: [desc(threadMessages.createdAt)],
          limit: 1,
          with: { sender: true },
        },
      },
    }),
    db.select({ value: count() }).from(threads),
  ])

  const total = totalResult[0]?.value ?? 0
  const totalPages = Math.ceil(total / PAGINATION_DEFAULT)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-4 mb-6">
        <PageHeader title={t("title")} description={t("allConversations")} />
        <Link href="/admin/messages/new">
          <Button>{t("newConversation")}</Button>
        </Link>
      </div>

      {allThreads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">{t("noThreads")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {allThreads.map((thread) => {
            const lastMsg = thread.messages[0]
            const isUnread =
              lastMsg &&
              !lastMsg.readAt &&
              lastMsg.sender?.id !== session.user.id

            return (
              <Link
                key={thread.id}
                href={`/admin/messages/${thread.id}`}
                className="block rounded-xl border border-slate-200 bg-white shadow-sm p-4 hover:border-teal-300 hover:shadow transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {isUnread && (
                      <div className="mt-1.5 w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
                    )}
                    {!isUnread && <div className="mt-1.5 w-2 h-2 flex-shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">
                        {thread.subject ?? t("noSubject")}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {thread.client?.name ?? thread.client?.email ?? t("unknownClient")}
                      </p>
                      {lastMsg && (
                        <p className="text-sm text-slate-400 mt-1 truncate">
                          {lastMsg.body}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0 mt-0.5">
                    {formatDate(thread.updatedAt)}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
      <Pagination
        page={page}
        totalPages={totalPages}
        pageLink={(p) => `/admin/messages?page=${p}`}
      />
    </div>
  )
}
