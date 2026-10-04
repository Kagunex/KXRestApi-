type CacheEntry<T> = {
  data: T;
  expires: number;
};

const store = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 60 * 1000; // 1 minute
const SEARCH_TTL = 30 * 1000; // 30 seconds
const DETAIL_TTL = 5 * 60 * 1000; // 5 minutes
const GENRE_TTL = 30 * 60 * 1000; // 30 minutes

export function getCache<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

export function cacheKey(...parts: string[]): string {
  return parts.join(":");
}

export const CacheTTL = {
  search: SEARCH_TTL,
  detail: DETAIL_TTL,
  genres: GENRE_TTL,
  recent: SEARCH_TTL,
  default: DEFAULT_TTL,
} as const;

// Simple in-memory rate limiter (per IP, resets on cold start)
const rateMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 60; // requests
const RATE_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
} {
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return { allowed: true, remaining: RATE_LIMIT - 1 };
  }

  if (entry.count >= RATE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: RATE_LIMIT - entry.count };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return request.headers.get("x-real-ip") || "unknown";
}
