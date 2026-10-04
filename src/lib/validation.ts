export function parsePositiveInt(
  value: string | null,
  fallback: number,
  max: number
): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return fallback;
  return Math.min(n, max);
}

export function validateQuery(
  q: string | null
): { ok: true; query: string } | { ok: false; message: string } {
  if (q === null || q === undefined) {
    return { ok: false, message: "Query parameter q is required" };
  }
  const trimmed = q.trim();
  if (!trimmed) {
    return { ok: false, message: "Query parameter q cannot be empty" };
  }
  if (trimmed.length > 100) {
    return { ok: false, message: "Query must be at most 100 characters" };
  }
  return { ok: true, query: trimmed };
}

export function validateSlug(
  slug: string | undefined
): { ok: true; slug: string } | { ok: false; message: string } {
  if (!slug || !slug.trim()) {
    return { ok: false, message: "Slug is required" };
  }
  const s = slug.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9\-]*[a-z0-9]$|^[a-z0-9]$/.test(s) || s.length > 200) {
    return { ok: false, message: "Invalid slug format" };
  }
  return { ok: true, slug: s };
}
