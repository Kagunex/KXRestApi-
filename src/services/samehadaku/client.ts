const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const FETCH_TIMEOUT = 12_000;
const HEALTH_TIMEOUT = 8_000;

export function getBaseUrl(): string {
  const url = process.env.SAMEHADAKU_BASE_URL;

  if (!url) {
    throw new SourceUnavailableError(
      "SAMEHADAKU_BASE_URL is not configured"
    );
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

function buildUrl(path: string): string {
  const base = getBaseUrl();

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function getUpstreamMessage(status: number): string {
  switch (status) {
    case 401:
      return "Upstream returned 401 Unauthorized";

    case 403:
      return "Upstream returned 403 Forbidden";

    case 408:
      return "Upstream returned 408 Request Timeout";

    case 429:
      return "Upstream returned 429 Too Many Requests";

    case 500:
      return "Upstream returned 500 Internal Server Error";

    case 502:
      return "Upstream returned 502 Bad Gateway";

    case 503:
      return "Upstream returned 503 Service Unavailable";

    case 504:
      return "Upstream returned 504 Gateway Timeout";

    default:
      return `Upstream returned ${status}`;
  }
}

export async function fetchHtml(path: string): Promise<string> {
  const url = buildUrl(path);

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

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
      cache: "no-store",
    });

    if (res.status === 404) {
      throw new NotFoundError("Page not found on source");
    }

    if (!res.ok) {
      const retryAfter = res.headers.get("retry-after");

      if (res.status === 429) {
        const message = retryAfter
          ? `Upstream returned 429 Too Many Requests (Retry-After: ${retryAfter})`
          : "Upstream returned 429 Too Many Requests";

        throw new SourceUnavailableError(message);
      }

      if (res.status === 403) {
        throw new SourceUnavailableError(
          "Upstream returned 403 Forbidden. The source is rejecting this request."
        );
      }

      if (res.status >= 500) {
        throw new SourceUnavailableError(
          getUpstreamMessage(res.status)
        );
      }

      throw new SourceError(
        getUpstreamMessage(res.status),
        502
      );
    }

    const contentType = res.headers.get("content-type") || "";

    const text = await res.text();

    if (!text || text.trim().length < 50) {
      throw new SourceUnavailableError(
        "Upstream returned an empty or invalid response"
      );
    }

    /*
     * We expect HTML from the anime source.
     * Don't parse obviously non-HTML responses as anime pages.
     */
    const looksLikeHtml =
      contentType.includes("text/html") ||
      /<!doctype\s+html/i.test(text) ||
      /<html[\s>]/i.test(text);

    if (!looksLikeHtml) {
      throw new SourceUnavailableError(
        "Upstream returned a non-HTML response"
      );
    }

    return text;
  } catch (err) {
    if (
      err instanceof SourceError ||
      err instanceof NotFoundError
    ) {
      throw err;
    }

    if (
      err instanceof Error &&
      err.name === "AbortError"
    ) {
      throw new SourceUnavailableError(
        "Upstream request timed out"
      );
    }

    if (err instanceof TypeError) {
      throw new SourceUnavailableError(
        "Failed to connect to upstream source"
      );
    }

    throw new SourceUnavailableError(
      "Failed to reach upstream source"
    );
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

  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    const base = getBaseUrl();

    const controller = new AbortController();

    timer = setTimeout(() => {
      controller.abort();
    }, HEALTH_TIMEOUT);

    const res = await fetch(base, {
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,id;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
      cache: "no-store",
    });

    const latency = Date.now() - start;

    /*
     * A 403/503 still proves that the hostname is reachable,
     * but the upstream is refusing or protecting the request.
     */
    if (res.ok) {
      return {
        ok: true,
        latency,
        message: `reachable (${res.status})`,
      };
    }

    if (res.status === 403) {
      return {
        ok: false,
        latency,
        message: "reachable but returned 403 Forbidden",
      };
    }

    if (res.status === 429) {
      return {
        ok: false,
        latency,
        message: "reachable but returned 429 Too Many Requests",
      };
    }

    if (res.status >= 500) {
      return {
        ok: false,
        latency,
        message: `reachable but returned ${res.status}`,
      };
    }

    return {
      ok: false,
      latency,
      message: `status ${res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      latency: Date.now() - start,
      message:
        err instanceof Error
          ? err.name === "AbortError"
            ? "health check timed out"
            : err.message
          : "unreachable",
    };
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}
