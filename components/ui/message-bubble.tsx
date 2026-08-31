import { formatDate } from "@/lib/utils";

interface MessageBubbleProps {
  isOwn: boolean;
  senderLabel: string;
  createdAt: Date;
  body: string;
}

export function MessageBubble({ isOwn, senderLabel, createdAt, body }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-card px-4 py-3 ${
          isOwn ? "bg-brand text-white" : "bg-surface-muted text-ink"
        }`}
      >
        <p className={`text-xs mb-1 ${isOwn ? "text-brand-muted" : "text-ink-faint"}`}>
          {senderLabel}
          {" · "}
          {formatDate(createdAt)}
        </p>
        <p className="text-sm whitespace-pre-wrap">{body}</p>
      </div>
    </div>
  );
}
