/**
 * Lightweight client-side rate limiting to reduce accidental bursts and abuse.
 * Server-side limits still apply; this improves UX and protects the API from tight loops.
 */

const buckets = new Map<string, number[]>()

function prune(timestamps: number[], windowMs: number, now: number): number[] {
  return timestamps.filter((t) => now - t < windowMs)
}

/**
 * @throws Error with a user-facing message if the limit is exceeded
 */
export function consumeClientRateLimit(key: string, max: number, windowMs: number): void {
  const now = Date.now()
  const prev = buckets.get(key) ?? []
  const next = prune(prev, windowMs, now)
  if (next.length >= max) {
    throw new Error('Too many requests. Please wait a moment and try again.')
  }
  next.push(now)
  buckets.set(key, next)
}

export function resetClientRateLimitForTests(key: string): void {
  buckets.delete(key)
}
