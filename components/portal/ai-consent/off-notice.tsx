import { Info } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * "AI is off for you" — shown where an AI feature would be, with the way to
 * turn it on. The feature below it keeps working without AI.
 */
export function AiOffNotice({
  message,
  actionLabel,
  from,
}: {
  message: string;
  actionLabel: string;
  /** The page to come back to after the consent screen. */
  from: "/ai-chat" | "/check-in";
}) {
  return (
    <div className="flex flex-col gap-2 rounded-element border border-border bg-surface-subtle p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-start gap-2 text-ink-soft mb-0 min-w-0">
        <Info className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" aria-hidden />
        <span>{message}</span>
      </p>
      <Link
        href={`/ai-consent?from=${from}`}
        className="inline-flex min-h-11 shrink-0 items-center font-medium text-brand underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-ring rounded-element"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
