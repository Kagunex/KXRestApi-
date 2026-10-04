/**
 * Rate limit abstraction.
 *
 * Default: in-memory sliding window per IP (per instance).
 * Not global across Vercel regions. Document this limitation.
 * Interface allows swapping in Redis/KV later.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

const LIMIT = 60;
const WINDOW_MS = 60_000;
const buckets = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(identifier: string): RateLimitResult {
  const now = Date.now();
  const entry = buckets.get(identifier);

  if (!entry || now >= entry.resetAt) {
    const resetAt = now + WINDOW_MS;
    buckets.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: LIMIT - 1, resetAt };
  }

  if (entry.count >= LIMIT) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: LIMIT - entry.count,
    resetAt: entry.resetAt,
  };
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
