import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { threads } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { markThreadAsReadFor } from "@/lib/db/thread-unread"
import { notFound, redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { setRequestLocale } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { ArrowLeft } from "lucide-react"
import { ReplyForm } from "@/components/ui/reply-form"
import { MessageBubble } from "@/components/ui/message-bubble"

export default async function PortalThreadPage({
  params,
}: {
  params: Promise<{ locale: string; threadId: string }>
}) {
  const { locale, threadId } = await params
  setRequestLocale(locale)

  const session = await auth()
  if (!session?.user?.id) redirect(`/${locale}/login`)

  const t = await getTranslations("messages")

  const thread = await db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      messages: {
        with: { sender: true },
        orderBy: (msgs, { asc }) => [asc(msgs.createdAt)],
      },
    },
  })

  if (!thread) notFound()
  if (thread.clientId !== session.user.id) notFound()

  await markThreadAsReadFor(threadId, session.user.id)

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t("backToMessages")}
        </Link>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          {thread.subject ?? t("noSubject")}
        </h1>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {thread.messages.map((msg) => {
          const isOwn = msg.senderId === session.user.id
          return (
            <MessageBubble
              key={msg.id}
              isOwn={isOwn}
              senderLabel={isOwn ? t("you") : (msg.sender?.name ?? t("teamName"))}
              createdAt={msg.createdAt}
              body={msg.body}
            />
          )
        })}
      </div>

      <div className="sticky bottom-0 bg-slate-50 pt-4 pb-2 border-t border-slate-200">
        <ReplyForm threadId={threadId} />
      </div>
    </div>
  )
}
