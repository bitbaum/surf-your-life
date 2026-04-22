"use client"

import { useTranslations } from "next-intl"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  createdAt: string
}

type Props = {
  messages: Message[]
  sending: boolean
  bottomRef: React.RefObject<HTMLDivElement | null>
  onSuggestion: (text: string) => void
}

export function ChatMessageList({ messages, sending, bottomRef, onSuggestion }: Props) {
  const t = useTranslations("portal.aiChat")

  return (
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
                onClick={() => onSuggestion(t(key))}
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
  )
}
