// In-memory sliding window rate limiter.
// Best-effort on serverless (per-instance), but effective against single-origin abuse.

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Clean up expired entries every 5 minutes to prevent unbounded growth
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function checkRateLimit(
  key: string,
  limit: number
): { ok: boolean; remaining: number; retryAfterSecs: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { ok: true, remaining: limit - 1, retryAfterSecs: 0 }
  }

  if (entry.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSecs: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { ok: true, remaining: limit - entry.count, retryAfterSecs: 0 }
}

export function ipKey(req: Request, prefix: string): string {
  const xff = req.headers.get("x-forwarded-for")
  const ip = xff ? xff.split(",")[0].trim() : "unknown"
  return `${prefix}:${ip}`
}
