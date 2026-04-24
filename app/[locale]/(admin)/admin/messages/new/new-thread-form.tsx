"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { FIELD_MAX_TITLE, FIELD_MAX_MESSAGE } from "@/lib/constants"

type Client = { id: string; name: string | null; email: string }

export function NewThreadForm({
  clients,
  preselectedClientId,
}: {
  clients: Client[]
  preselectedClientId?: string
}) {
  const t = useTranslations("messages")
  const at = useTranslations("admin.messages")
  const router = useRouter()

  const [form, setForm] = useState({
    clientId: preselectedClientId ?? "",
    subject: "",
    body: "",
  })
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setError(null)
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!json.success) throw new Error(typeof json.error === "string" ? json.error : t("failedToSend"))
      router.push(`/admin/messages/${json.data.threadId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToSend"))
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select
        label={at("selectClient")}
        value={form.clientId}
        onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
        required
        disabled={sending}
      >
        <option value="">{at("selectClientPlaceholder")}</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name ?? c.email} {c.name ? `(${c.email})` : ""}
          </option>
        ))}
      </Select>

      <Input
        label={t("subject")}
        value={form.subject}
        onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
        placeholder={t("subjectPlaceholder")}
        required
        disabled={sending}
        maxLength={FIELD_MAX_TITLE}
      />

      <Textarea
        label={t("message")}
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        placeholder={t("messagePlaceholder")}
        rows={5}
        required
        disabled={sending}
        maxLength={FIELD_MAX_MESSAGE}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={sending}>
          {sending ? t("sending") : t("send")}
        </Button>
      </div>
    </form>
  )
}
