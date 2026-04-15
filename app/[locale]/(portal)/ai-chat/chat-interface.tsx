"use client"

import { useState, useRef, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"

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
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleSend() {
    const content = input.trim()
    if (!content || sending) return

    setInput("")
    setError("")
    setSending(true)

    // Optimistically add the user message
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

    // Add the assistant reply
    setMessages((prev) => [
      ...prev,
      {
        id: data.data.id,
        role: "assistant",
        content: data.data.content,
        createdAt: data.data.createdAt,
      },
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
      {/* Message list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4 pr-1">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <p className="text-slate-700 font-medium">{t("emptyTitle")}</p>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">{t("emptyHint")}</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {(["suggestion1", "suggestion2", "suggestion3"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setInput(t(key))}
                  className="text-xs px-3 py-1.5 rounded-full border border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-600 transition-colors"
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
                🤖
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-teal-600 text-white rounded-tr-sm"
                  : "bg-slate-100 text-slate-800 rounded-tl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-sm mr-2 flex-shrink-0">
              🤖
            </div>
            <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {/* Input bar */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
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
