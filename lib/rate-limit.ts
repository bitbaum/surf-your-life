import { slidingWindow, clientIp, MemoryStore, type Limiter } from "limitkit";

/**
 * Rate limiting — owned by `limitkit` (see fleet/SHARED.md).
 *
 * This file is a SHIM, not an implementation: it keeps the call signatures its
 * seven route callers were written against and holds the one thing that is app
 * semantics — the 15-minute window, and, at the call sites, how many attempts
 * each route allows. The window arithmetic, the refusal shape and the
 * client-IP parsing live in the package.
 *
 * Two things changed for the better by adopting it:
 *   - the store was a bare Map pruned by a `setInterval` that ran forever in
 *     every process; limitkit's MemoryStore is bounded (LRU) and needs no timer.
 *   - `ipKey` used to take the FIRST entry of `X-Forwarded-For`, which is the
 *     part the CLIENT writes — a random value per request meant a fresh bucket
 *     per request, so the limiter could be bypassed entirely. `clientIp` takes
 *     the last hop (one reverse proxy in front of us: Caddy), which the client
 *     cannot forge.
 *
 * Keep this a shim. A local re-implementation "just for one tweak" is how the
 * shared version becomes the stale version.
 */

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const store = new MemoryStore();

/** One limiter per distinct rule; rules are few (per-route constants). */
const limiters = new Map<number, Limiter>();

function limiterFor(limit: number): Limiter {
  let limiter = limiters.get(limit);
  if (!limiter) {
    limiter = slidingWindow({ limit, windowMs: WINDOW_MS }, store);
    limiters.set(limit, limiter);
  }
  return limiter;
}

export function checkRateLimit(
  key: string,
  limit: number,
): { ok: boolean; remaining: number; retryAfterSecs: number } {
  const result = limiterFor(limit).check(key);
  return {
    ok: result.allowed,
    remaining: result.remaining,
    retryAfterSecs: result.retryAfterSeconds,
  };
}

export function ipKey(req: Request, prefix: string): string {
  return `${prefix}:${clientIp(req.headers)}`;
}
