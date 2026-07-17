// Sentry server-runtime init. Loaded via instrumentation.ts register().
// No-ops silently when NEXT_PUBLIC_SENTRY_DSN is unset (dsn: undefined disables the SDK).
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Clinical data — never attach user IPs, cookies, or request identity to events.
  sendDefaultPii: false,
})
