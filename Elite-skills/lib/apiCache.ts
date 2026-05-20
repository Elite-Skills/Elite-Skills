/**
 * In-memory GET response cache for the Elite Skills client.
 * Entries stay valid until TTL expires, prefix invalidation, or full clear (e.g. logout).
 */

type CacheEntry<T> = { value: T; expiresAt: number | null }

const store = new Map<string, CacheEntry<unknown>>()

export function apiCacheGet<T>(key: string): T | undefined {
  const e = store.get(key) as CacheEntry<T> | undefined
  if (!e) return undefined
  if (e.expiresAt !== null && Date.now() > e.expiresAt) {
    store.delete(key)
    return undefined
  }
  return e.value
}

/** @param ttlMs null = no expiry until invalidate/clear */
export function apiCacheSet<T>(key: string, value: T, ttlMs: number | null = null) {
  store.set(key, {
    value,
    expiresAt: ttlMs === null ? null : Date.now() + ttlMs,
  })
}

export function apiCacheDelete(key: string) {
  store.delete(key)
}

export function apiCacheInvalidatePrefix(prefix: string) {
  for (const k of [...store.keys()]) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}

export function apiCacheClear() {
  store.clear()
}
