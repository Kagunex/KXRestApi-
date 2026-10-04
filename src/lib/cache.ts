/**
 * Cache abstraction for KXRestApi.
 *
 * Default: in-memory Map (per serverless instance).
 * On Vercel, cold starts reset the cache. Suitable as a short-TTL
 * request-deduplication layer. Swap implementation for Redis/KV later.
 */

type Entry<T> = { data: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export const CacheTTL = {
  search: 30_000,
  detail: 5 * 60_000,
  episodes: 3 * 60_000,
  recent: 60_000,
  genres: 30 * 60_000,
  genreAnime: 5 * 60_000,
  schedule: 10 * 60_000,
  health: 15_000,
} as const;

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheKey(...parts: (string | number)[]): string {
  return parts.join(":");
}
