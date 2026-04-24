import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { eq, desc, count } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { redirect } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { Pagination } from "@/components/ui/pagination"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, computeTotalPages } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { PAGINATION_DEFAULT } from "@/lib/constants"

export default async function PortalMessagesPage({
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

  const t = await getTranslations("messages")

  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? "1") || 1)
  const offset = (page - 1) * PAGINATION_DEFAULT
  const whereClause = eq(threads.clientId, session.user.id)

  const [myThreads, totalResult] = await Promise.all([
    db.query.threads.findMany({
      where: whereClause,
      orderBy: [desc(threads.updatedAt)],
      limit: PAGINATION_DEFAULT,
      offset,
      with: {
        messages: {
          orderBy: [desc(threadMessages.createdAt)],
          limit: 1,
          with: { sender: true },
        },
      },
    }),
    db.select({ value: count() }).from(threads).where(whereClause),
  ])

  const total = totalResult[0]?.value ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  return (
    <div className="max-w-3xl mx-auto">
      <PageHeader
        title={t("title")}
        action={
          <Link href="/messages/new">
            <Button>{t("newMessage")}</Button>
          </Link>
        }
      />

      {myThreads.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">{t("noMessages")}</p>
          <p className="text-sm text-slate-400 mt-1">{t("noMessagesDescription")}</p>
          <Link href="/messages/new" className="inline-block mt-4">
            <Button variant="outline">{t("startConversation")}</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {myThreads.map((thread) => {
            const lastMsg = thread.messages[0]
            const isUnread =
              lastMsg &&
              !lastMsg.readAt &&
              lastMsg.sender?.id !== session.user.id

            return (
              <Link
                key={thread.id}
                href={`/messages/${thread.id}`}
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
                      {lastMsg && (
                        <p className="text-sm text-slate-400 mt-1 truncate">{lastMsg.body}</p>
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
        pageLink={(p) => `/messages?page=${p}`}
      />
    </div>
  )
}
