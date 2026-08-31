// Sentry browser init. Next.js loads this file on the client automatically.
// No-ops silently when NEXT_PUBLIC_SENTRY_DSN is unset (dsn: undefined disables the SDK).
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Clinical data — never attach user identity to events; no session replay.
  sendDefaultPii: false,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
