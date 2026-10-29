interface OtherWaysDisclosureProps {
  summary: string;
  /** Open on first render — when OrangeCat is unavailable, or the visitor already started here. */
  defaultOpen?: boolean;
  children: React.ReactNode;
}

/**
 * Email/password (and the app's own Google button, only when GOOGLE_CLIENT_ID/
 * _SECRET are set), kept reachable for existing accounts but secondary to "Sign in with OrangeCat".
 */
export function OtherWaysDisclosure({ summary, defaultOpen, children }: OtherWaysDisclosureProps) {
  return (
    <details open={defaultOpen} className="group">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-center gap-1 text-sm text-ink-muted hover:text-ink [&::-webkit-details-marker]:hidden">
        <span className="underline underline-offset-4">{summary}</span>
        <span aria-hidden="true" className="transition-transform group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="mt-3 flex flex-col gap-3">{children}</div>
    </details>
  );
}
