const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT = 12_000;

export function getBaseUrl(): string {
  const url = process.env.SAMEHADAKU_BASE_URL;
  if (!url) {
    throw new SourceUnavailableError("SAMEHADAKU_BASE_URL is not configured");
  }
  return url.replace(/\/$/, "");
}

export class SourceError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "SourceError";
    this.status = status;
  }
}

export class SourceUnavailableError extends SourceError {
  constructor(message = "Anime source is temporarily unavailable") {
    super(message, 503);
    this.name = "SourceUnavailableError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function fetchHtml(path: string): Promise<string> {
  const base = getBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    if (res.status === 404) {
      throw new NotFoundError("Page not found on source");
    }

    if (!res.ok) {
      if (res.status >= 500) {
        throw new SourceUnavailableError(`Upstream returned ${res.status}`);
      }
      // 403 often means Cloudflare challenge — treat as unavailable
      if (res.status === 403) {
        throw new SourceUnavailableError("Upstream blocked the request");
      }
      throw new SourceError(`Upstream returned ${res.status}`, 502);
    }

    const text = await res.text();
    if (!text || text.length < 50) {
      throw new SourceUnavailableError("Upstream returned empty response");
    }
    return text;
  } catch (err) {
    if (err instanceof SourceError || err instanceof NotFoundError) throw err;
    if (err instanceof Error && err.name === "AbortError") {
      throw new SourceUnavailableError("Upstream request timed out");
    }
    throw new SourceUnavailableError("Failed to reach upstream source");
  } finally {
    clearTimeout(timer);
  }
}

export async function checkSourceReachable(): Promise<{
  ok: boolean;
  latency: number;
  message: string;
}> {
  const start = Date.now();
  try {
    const base = getBaseUrl();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8_000);

    const res = await fetch(base, {
      method: "GET",
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timer);

    const latency = Date.now() - start;
    // 200 OK, or 403/503 from Cloudflare means host is reachable
    if (res.ok || res.status === 403 || res.status === 503) {
      return {
        ok: true,
        latency,
        message: res.ok ? "reachable" : "reachable (protected)",
      };
    }
    return { ok: false, latency, message: `status ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}
