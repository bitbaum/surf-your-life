"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatMessageList } from "./chat-message-list"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

type Props = {
  initialMessages: Message[]
}

export function ChatInterface({ initialMessages }: Props) {
  const t = useTranslations("portal.aiChat")
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    setInput("")
    setError("")
    setSending(true)

    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content, createdAt: new Date().toISOString() },
    ])

    const res = await fetch("/api/portal/ai-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    })

    const data = await res.json()
    setSending(false)

    if (!data.success) {
      setError(t("sendError"))
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      return
    }

    setMessages((prev) => [
      ...prev,
      { id: data.data.id, role: "assistant", content: data.data.content, createdAt: data.data.createdAt },
    ])
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-16rem)] min-h-[400px]">
      <ChatMessageList
        messages={messages}
        sending={sending}
        bottomRef={bottomRef}
        onSuggestion={setInput}
      />

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("inputPlaceholder")}
            rows={1}
            maxLength={1000}
            disabled={sending}
            className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ minHeight: "44px" }}
          />
          <Button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex-shrink-0 h-11 w-11 p-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-2">{t("disclaimer")}</p>
      </div>
    </div>
  )
}
