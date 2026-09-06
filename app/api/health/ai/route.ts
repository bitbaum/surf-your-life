export const dynamic = "force-dynamic";

import { aiHealthHandler } from "@/lib/domain/llm";

// Can this deployment reach a model RIGHT NOW?
//
//   GET /api/health/ai            free. Reports what happened last time.
//   GET /api/health/ai?probe=1    makes a real call. Needs AI_PROBE_SECRET,
//                                 via the `x-probe-secret` header or `?secret=`.
//
// Separate from /api/health on purpose. That route is what deploy monitoring
// curls, and a dead provider key must never fail the check that triggers a
// restart — a restart cannot fix a key. This route is the opposite contract:
// 200 only when a model actually answered, 503 when the chain could not, so an
// uptime monitor can watch this URL directly.
//
// A probe spends real tokens from a daily budget shared with the planner and
// the crons, so ai-kit gates it behind the secret and caches a SUCCESS for ten
// minutes — a monitor in a retry loop cannot drain the allowance and take the
// app's actual AI features down with it. A FAILURE is never cached.
//
// With AI_PROBE_SECRET unset the route answers 501: forgetting to configure it
// yields an endpoint that cannot spend money, never an open one that can.
export const GET = aiHealthHandler;
