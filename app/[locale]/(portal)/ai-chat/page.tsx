import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { aiMessages } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChatInterface } from "./chat-interface"
import { getTranslations, setRequestLocale } from "next-intl/server"

export default async function AiChatPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("portal.aiChat")

  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const history = await db.query.aiMessages.findMany({
    where: eq(aiMessages.userId, session.user.id),
    orderBy: [desc(aiMessages.createdAt)],
    limit: 50,
    columns: { id: true, role: true, content: true, createdAt: true },
  })

  const messages = history.reverse().map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
        <p className="text-slate-500 mt-1">{t("description")}</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{t("cardTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ChatInterface initialMessages={messages} />
        </CardContent>
      </Card>
    </div>
  )
}
