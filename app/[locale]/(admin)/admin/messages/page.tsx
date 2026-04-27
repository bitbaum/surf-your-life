import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads, threadMessages } from "@/lib/db/schema"
import { desc, count, eq, and } from "drizzle-orm"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { PAGINATION_DEFAULT } from "@/lib/constants"
import { unreadFromClientExists } from "@/lib/db/thread-unread"
import { findUserContact } from "@/lib/db/queries"
import { PageHeader } from "@/components/ui/page-header"
import { Button } from "@/components/ui/button"
import { formatDate, computeTotalPages, parsePagination } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { Pagination } from "@/components/ui/pagination"
import { EmptyState } from "@/components/ui/empty-state"
import { Card } from "@/components/ui/card"
import { FilterTabs } from "@/components/ui/filter-tabs"

type FilterMode = "all" | "unread"
const FILTER_MODES: FilterMode[] = ["all", "unread"]
function isValidFilter(v: string | undefined): v is FilterMode {
  return FILTER_MODES.includes(v as FilterMode)
}

export default async function AdminMessagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string; client?: string; filter?: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) return null

  const t = await getTranslations("admin.messages")

  const { page: pageParam, client: clientIdParam, filter: filterParam } = await searchParams
  const filter: FilterMode = isValidFilter(filterParam) ? filterParam : "all"
  const { page, offset } = parsePagination(pageParam)

  // "Unread": at least one unread message in this thread sent by a client
  // (not staff). Per-thread global property; matches the practitioner intent
  // of "needs my reply". Built unconditionally so the badge count query can
  // reuse it regardless of the active filter.
  const unreadExists = unreadFromClientExists()

  const clientFilter = clientIdParam ? eq(threads.clientId, clientIdParam) : undefined
  const whereParts = [
    clientFilter,
    filter === "unread" ? unreadExists : undefined,
  ].filter((p): p is NonNullable<typeof p> => p != null)
  const whereClause = whereParts.length > 1 ? and(...whereParts) : whereParts[0]

  // Badge count: always computed, scoped to the same client filter, so the tab
  // shows e.g. "Unread (3)" regardless of which tab is active.
  const unreadCountWhere = clientFilter ? and(clientFilter, unreadExists) : unreadExists

  const [allThreads, totalResult, unreadCountResult, filteredClient] = await Promise.all([
    db.query.threads.findMany({
      where: whereClause,
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
    db.select({ value: count() }).from(threads).where(whereClause),
    db.select({ value: count() }).from(threads).where(unreadCountWhere),
    clientIdParam
      ? findUserContact(clientIdParam)
      : Promise.resolve(null),
  ])

  const total = totalResult[0]?.value ?? 0
  const unreadCount = unreadCountResult[0]?.value ?? 0
  const totalPages = computeTotalPages(total, PAGINATION_DEFAULT)

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title={t("title")}
        description={filteredClient
          ? `${t("filteringBy")} ${filteredClient.name ?? filteredClient.email}`
          : t("allConversations")}
        action={
          <div className="flex items-center gap-2">
            {clientIdParam && (
              <Link href="/admin/messages" className="text-sm text-slate-500 hover:text-slate-700">
                {t("clearFilter")}
              </Link>
            )}
            <Link href={clientIdParam ? `/admin/messages/new?clientId=${clientIdParam}` : "/admin/messages/new"}>
              <Button>{t("newConversation")}</Button>
            </Link>
          </div>
        }
      />

      <FilterTabs
        tabs={[
          { value: "all" as FilterMode, label: t("filterAll") },
          { value: "unread" as FilterMode, label: t("filterUnread", { count: unreadCount }) },
        ]}
        active={filter}
        href={(v) => {
          const params = new URLSearchParams()
          if (clientIdParam) params.set("client", clientIdParam)
          if (v !== "all") params.set("filter", v)
          const qs = params.toString()
          return qs ? `/admin/messages?${qs}` : "/admin/messages"
        }}
      />

      {allThreads.length === 0 ? (
        <Card className="p-12">
          <EmptyState
            icon={<MessageSquare className="w-10 h-10" />}
            message={filter === "unread" ? t("noUnreadThreads") : t("noThreads")}
          />
        </Card>
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
        pageLink={(p) => {
          const params = new URLSearchParams()
          params.set("page", String(p))
          if (clientIdParam) params.set("client", clientIdParam)
          if (filter !== "all") params.set("filter", filter)
          return `/admin/messages?${params.toString()}`
        }}
      />
    </div>
  )
}
